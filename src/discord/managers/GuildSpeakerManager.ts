import { Snowflake, Guild } from "discord.js";
import GuildSpeaker from "@/discord/managers/GuildSpeaker";

interface GuildData {
  channelId: Snowflake;
  readMessages: GuildSpeaker;
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
      const newData = {
        channelId,
        readMessages: new GuildSpeaker(guild)
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

  // チャンネルIDを取得
  getChannelId(guildId: Snowflake): Snowflake | undefined {
    return this.guildData.get(guildId)?.channelId;
  }

  // ReadMessagesインスタンスを取得
  getReadMessages(guildId: Snowflake): GuildSpeaker | undefined {
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