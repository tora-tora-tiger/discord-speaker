import { Snowflake, Guild } from "discord.js";
import GuildSpeaker from "@/discord/speaker/GuildSpeaker";

interface GuildData {
  channelId: Snowflake;
  guildSpeaker: GuildSpeaker;
}

export class GuildSpeakerManager {
  private static instance: GuildSpeakerManager;
  private guildData = new Map<Snowflake, GuildData>();

  private constructor() {}

  // グローバルのインスタンスを1にするためのシングルトンパターン
  public static getInstance(): GuildSpeakerManager {
    if (!GuildSpeakerManager.instance) {
      GuildSpeakerManager.instance = new GuildSpeakerManager();
    }
    return GuildSpeakerManager.instance;
  }

  // サーバーをチャンネル購読・更新
  subscribe(guild: Guild, channelId: Snowflake): GuildSpeaker {
    const guildId = guild.id;
    const existingData = this.guildData.get(guildId);

    if (!existingData) {
      // 新規の場合
      const guildSpeaker = new GuildSpeaker(guild, this);
      const newData = {
        channelId,
        guildSpeaker
      };
      this.guildData.set(guildId, newData);
      return guildSpeaker;
    } else {
      // 既存の場合はチャンネルIDのみ更新
      existingData.channelId = channelId;
      return existingData.guildSpeaker;
    }
  }

  // サーバーのチャンネル購読解除（byeコマンド用）
  unsubscribe(guildId: Snowflake) {
    this.guildData.delete(guildId);
  }

  // チャンネルIDを取得
  getChannelId(guildId: Snowflake): Snowflake | undefined {
    return this.guildData.get(guildId)?.channelId;
  }

  // ReadMessagesインスタンスを取得
  getReadMessages(guildId: Snowflake): GuildSpeaker | undefined {
    return this.guildData.get(guildId)?.guildSpeaker;
  }

  // ギルドが存在するか確認
  hasGuild(guildId: Snowflake): boolean {
    return this.guildData.has(guildId);
  }

  // 全クリア（テスト用）
  clear() {
    this.guildData.clear();
  }
}

export default GuildSpeakerManager;