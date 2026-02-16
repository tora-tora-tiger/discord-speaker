import { Message, OmitPartialGroupDMChannel, Guild, Snowflake } from "discord.js";
import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioResource, getVoiceConnection, StreamType } from "@discordjs/voice";
import { Readable } from "stream";
import talk from "@/server";
import GuildSpeakerManager from "./GuildSpeakerManager";

// 各ギルドごとに読み上げを管理するクラス
// [TODO] Talkクラスもギルドごとに分ける
export default class GuildSpeaker {
  private player;
  private audioResourceQueue;
  private guild: Guild;
  private manager: GuildSpeakerManager;
  private textLengthLimit = 100;
  private userSpeakers = new Map<Snowflake, string>(); // ユーザーID → 話者ID
  private serverSpeaker?: string; // サーバーのデフォルト話者
  private lastErrorNotifyAt = 0;
  private readonly errorNotifyCooldownMs = 15000;

  constructor(guild: Guild, manager: GuildSpeakerManager) {
    this.guild = guild;
    this.manager = manager;

    this.player = new AudioPlayer();
    this.audioResourceQueue = new Array<AudioResource>();
    // 読み上げが終わったらキューに入った次の音声を再生する
    this.player.on(AudioPlayerStatus.Idle, () => {
      this.playNextFromQueue();
    });
    this.player.on("error", (error) => {
      console.error(`[discord/${this.guild.name}] Audio player error:`, error);
      this.playNextFromQueue();
    });
  }


  // ユーザーの話者を設定
  setUserSpeaker(userId: Snowflake, speaker: string): void {
    this.userSpeakers.set(userId, speaker);
  }

  // サーバーの話者を設定
  setServerSpeaker(speaker: string): void {
    this.serverSpeaker = speaker;
  }

  // ユーザーに応じた話者を取得（優先順位: 個人設定 > サーバー設定 > グローバルデフォルト）
  getSpeakerForUser(userId: Snowflake): string {
    // 個人設定があればそれを使用
    if (this.userSpeakers.has(userId)) {
      return this.userSpeakers.get(userId)!;
    }
    // サーバー設定があればそれを使用
    if (this.serverSpeaker) {
      return this.serverSpeaker;
    }
    // グローバルデフォルトを使用
    return talk.speaker;
  }

  async speak(message: OmitPartialGroupDMChannel<Message>) {
    if (!message.guild || !message.guildId) return;
    if (message.author.bot) return;

    // 読まないメッセージは無視
    const channelId = this.manager.getChannelId(this.guild.id);
    if (message.channelId !== channelId) return;


    console.log(`[discord/${this.guild.name}] received message:`, message.content);

    // 読み上げのためにVCに流すplayerを取得
    const connection = getVoiceConnection(this.guild.id);
    if (!connection) {
      console.error(`[discord/${this.guild.name}] No voice connection found`);
      return;
    }
    connection?.subscribe(this.player);
    if (!this.player) {
      console.error(`[discord${this.guild.name}] No audio player found`);
      return;
    }

    // 音声バイナリ取得し，discord.jsのAudioResourceに変換
    const isSingText = talk.isSimpleSingText(message.content);
    const speaker = this.getSpeakerForUser(message.author.id);
    const inputText = isSingText ? message.content : this.fixText(message.content);
    const result = isSingText
      ? await talk.voiceboxTalkWithResult(inputText)
      : await talk.voiceboxTalkWithResult(inputText, { speaker });
    if(!result.audioData) {
      console.error(`[discord${this.guild.id}] Failed to get message voice`);
      const reason = result.error ?? "音声合成に失敗しました。";
      await this.notifySpeakFailure(message, reason);
      return;
    }
    const stream = new Readable();
    stream.push(Buffer.from(result.audioData));
    stream.push(null);
    const resource = createAudioResource(stream, {inputType: StreamType.Arbitrary});


    // 音声を再生
    const status = this.player.state.status;
    if (status === AudioPlayerStatus.Idle) {
      this.player.play(resource);
    } else {
      this.audioResourceQueue.push(resource);
      console.log(`[discord${this.guild.id}] Audio resource pushed to queue`);
    }
  }

  private fixText(text: string): string {
    // URLを省略する
    // const urlPattern = new RegExp(`https?://[\\w!?/+\\-_~;.,*&@#$%()'[\\]]+`);
    const linkPattern = /\w+:\/\/[\w!?/+\\\-_~;.,*&@#$%()'[\]=]+/g;
    text = text.replace(linkPattern, "ゆーあーるえる");

    // @everyone,@hereを置き換える
    text = text.replace(/@everyone/g, "あっとえぶりわん");
    text = text.replace(/@here/g, "あっとひあ");

    // @mentionをユーザー名に置き換える
    const mentionPattern = /<@!?\d+>/g;
    text = text.replace(mentionPattern, (match) => {
      const userId = match.replace(/<@!?/, "").replace(">", "");
      const member = this.guild.members.cache.get(userId);
      return member ? `あっと${member.displayName}` : "あっとあんのうん";
    });

    // ロールメンションをロール名に置き換える
    const roleMentionPattern = /<@&\d+>/g;
    text = text.replace(roleMentionPattern, (match) => {
      const roleId = match.replace(/<@&/, "").replace(">", "");
      const role = this.guild.roles.cache.get(roleId);
      return role ? `あっと${role.name}` : "あんのうんろーる";
    });

    // チャンネルメンションをチャンネル名に置き換える
    const channelMentionPattern = /<#\d+>/g;
    text = text.replace(channelMentionPattern, (match) => {
      const channelId = match.replace(/<#/, "").replace(">", "");
      const channel = this.guild.channels.cache.get(channelId);
      return channel ? `${channel.name}` : "不明";
    });

    // [TODO]ユニコード絵文字を名前に置き換える
    // これは動かない(emoji-name-mapを使用)
    // const unicodeEmojiPattern = /[\p{Emoji_Presentation}]/gu;
    // text = text.replace(unicodeEmojiPattern, (match) => {
    //   const emojiName = emoji.get(match);
    //   return emojiName ? emojiName : "絵文字";
    // });

    // カスタム絵文字を名前に置き換える
    const emojiPattern = /<a?:(\w+):[\d-]+>/g;
    text = text.replace(emojiPattern, "$1");

    // Guild Navigationを置き換え
    const guildNavigationPattern = /<id:(customize|browse|guide|linked-roles)>/g;
    text = text.replace(guildNavigationPattern, (match, p1) => {
      switch(p1) {
        case "customize":
          return "チャンネル&ロール";
        case "browse":
          return "チャンネル一覧";
        case "guide":
          return "サーバーガイド";
        case "linked-roles":
          return "連携ロール";
        default:
          return match;
      }
    });

    // [TODO] 画像を省略する
    // [TODO] 動画を省略する

    // 100文字以上は省略する
    if (text.length > this.textLengthLimit) {
      text = text.slice(0, this.textLengthLimit) + "…";
    }

    console.log("[discord] fixed text:", text);
    return text;
  }

  private playNextFromQueue(): void {
    if (this.audioResourceQueue.length <= 0) {
      return;
    }

    const nextResource = this.audioResourceQueue.shift();
    if (!nextResource) {
      console.error("[discord] Failed to get next audio resource");
      return;
    }
    this.player.play(nextResource);
    console.log("[discord] Next audio resource playing");
  }

  private async notifySpeakFailure(
    message: OmitPartialGroupDMChannel<Message>,
    reason: string
  ): Promise<void> {
    const now = Date.now();
    if (now - this.lastErrorNotifyAt < this.errorNotifyCooldownMs) {
      return;
    }
    this.lastErrorNotifyAt = now;

    if (!message.channel.isTextBased()) {
      return;
    }

    try {
      await message.channel.send({
        content: `読み上げに失敗しました: ${reason}`,
        allowedMentions: { parse: [] }
      });
    } catch (error) {
      console.error(`[discord/${this.guild.name}] Failed to notify speak error:`, error);
    }
  }
}
