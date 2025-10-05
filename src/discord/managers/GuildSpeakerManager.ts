import { Snowflake, Guild } from "discord.js";
import { ReadMessages } from "@/discord/events/readMessages";

interface GuildData {
  channelId: Snowflake;
  readMessages: ReadMessages;
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
  subscribe(guildId: Snowflake, channelId: Snowflake, guild?: Guild): ReadMessages {
    const existingData = this.guildData.get(guildId);

    if (!existingData) {
      // 新規の場合
      if (!guild) {
        throw new Error("Guild is required for new guild");
      }
      const newData = {
        channelId,
        readMessages: new ReadMessages(guild)
      };
      this.guildData.set(guildId, newData);
      return newData.readMessages;
    } else {
      // 既存の場合はチャンネルIDのみ更新
      existingData.channelId = channelId;
      return existingData.readMessages;
    }
  }

  // サーバーのチャンネル購読解除（byeコマンド用）
  unsubscribe(guildId: Snowflake) {
    this.guildData.delete(guildId);
  }

  // 互換性のためのgetter（既存コードを壊さないように）
  getMonitorChannel(): Map<Snowflake, Snowflake> {
    const map = new Map<Snowflake, Snowflake>();
    for (const [guildId, data] of this.guildData) {
      map.set(guildId, data.channelId);
    }
    return map;
  }

  getGuildList(): Map<Snowflake, ReadMessages> {
    const map = new Map<Snowflake, ReadMessages>();
    for (const [guildId, data] of this.guildData) {
      map.set(guildId, data.readMessages);
    }
    return map;
  }

  // チャンネルIDを取得
  getChannelId(guildId: Snowflake): Snowflake | undefined {
    return this.guildData.get(guildId)?.channelId;
  }

  // ReadMessagesインスタンスを取得
  getReadMessages(guildId: Snowflake): ReadMessages | undefined {
    return this.guildData.get(guildId)?.readMessages;
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