import { Message, OmitPartialGroupDMChannel, Guild } from "discord.js";
import { monitorChannel } from "@/discord";
import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioResource, getVoiceConnection, StreamType } from "@discordjs/voice";
import { Readable } from "stream";
import talk from "@/server";

const guildList = new Map<string, _ReadMessages>();

async function readMessages(message: OmitPartialGroupDMChannel<Message>) {
  if (!message.guild || !message.guildId) return;
  const channelId = monitorChannel.get(message.guild.id);
  if (!channelId) return;
  
  if(guildList.has(message.guildId)) {
    const guild = guildList.get(message.guildId);
    if(guild) {
      guild.speak(message);
    }
  } else {
    const speaker = new _ReadMessages(message);
    guildList.set(message.guildId, speaker);
    speaker.speak(message);
  }
}

class _ReadMessages {
  private player;
  private audioResourceQueue;
  private guild: Guild;

  constructor(message: OmitPartialGroupDMChannel<Message>) {
    if (!message.guild || !message.guildId) {
      throw new Error("[discord/ReadMessages] Guild not found");
    }
    this.guild = message.guild;

    this.player = new AudioPlayer();
    this.audioResourceQueue = new Array<AudioResource>();
    // 読み上げが終わったらキューに入った次の音声を再生する
    this.player.on(AudioPlayerStatus.Idle, () => {
      if(this.audioResourceQueue.length > 0) {
        const nextResource = this.audioResourceQueue.shift();
        if(nextResource) {
          this.player.play(nextResource);
          console.log("[discord] Next audio resource playing");
        } else {
          console.error("[discord] Failed to get next audio resource");
        }
      }
    });
  }


  async speak(message: OmitPartialGroupDMChannel<Message>) {
    if (!message.guild || !message.guildId) return;
    const channelId = monitorChannel.get(message.guild.id);
    // 読まないメッセージは無視
    if (message.channelId !== channelId) return;
    if (message.author.bot) return;

    console.log(`[discord/${this.guild.name}] received message:`, message.content);

    // 読み上げのためにVCに流すplayerを取得
    const connection = getVoiceConnection(this.guild.id);
    if (!connection) {
      console.error(`[discord/${this.guild.name}] No voice connection found`);
      return;
    }
    connection?.subscribe(this.player);
    if (!this.player) {
      console.error(`[discord${this.guild.id}] No audio player found`);
      return;
    }

    // 音声バイナリ取得し，discord.jsのAudioResourceに変換
    const voice = await talk.voiceboxTalk(this.fixText(message.content));
    if(!voice) {
      console.error(`[discord${this.guild.id}] Failed to get message voice`);
      // message.reply("音声合成に失敗しました"); 権限足りなくて返信できない
      return;
    }
    const stream = new Readable();
    stream.push(Buffer.from(voice));
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
    const linkPattern = new RegExp(`\\w+://[\\w!?/+\\-_~;.,*&@#$%()'[\\]=]+`);
    if(text.match(linkPattern)) {
      text = text.replace(linkPattern, "ゆーあーるえる省略");
    }
    // [TODO] @mentionを省略する
    const mentionPattern = new RegExp(`<@\\d+>`);
    if(text.match(mentionPattern)) {
      text = text.replace(mentionPattern, "めんしょん省略");
    }
    // [TODO] 絵文字を省略する
    // [TODO] 画像を省略する
    // [TODO] 動画を省略する

    console.log("[discord] fixed text:", text);
    return text;
  }
}

export default readMessages;