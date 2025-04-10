import { Client, Events, GatewayIntentBits, Collection, Snowflake } from 'discord.js';
import { token } from 'config.json';
import { collectCommands } from '@/discord/collectFiles';
import executeCommands from '@/discord/events/executeCommands';
import readMessages from '@/discord/events/readMessages';

export const monitorChannel = new Map<Snowflake, Snowflake>();
export default class Discord {
  
  private client: Client;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,  // メッセージイベントを受け取るために必要
        GatewayIntentBits.MessageContent
      ]
    });
    // this.monitorChannel = new Map<Snowflake, Snowflake>();
  }

  // getMonitorChannel(): Map<Snowflake, Snowflake> {
  //   return this.monitorChannel;
  // }
  
  async start(): Promise<void> {
    // スラッシュコマンドのmap
    this.client.commands = new Collection();
    
    const commands = await collectCommands();
    commands.forEach(command => {
      this.client.commands.set(command.data.name, command);
    });
    
    // ログイン
    this.client.once(Events.ClientReady, (readyClient: Client<true>) => {
      console.log(`[discord] Ready! Logged in as ${readyClient.user.tag}`);
    });
    
    // スラッシュコマンドの実行
    this.client.on(Events.InteractionCreate, executeCommands);

    // メッセージの読み上げ
    this.client.on(Events.MessageCreate, readMessages)
    
    this.client.login(token);
  };

  async close(): Promise<boolean> {
    try {
      await this.client.destroy();
    } catch (error) {
      console.error('[discord] Error closing Discord client:', error);
      return false;
    }
    console.log('[discord] Discord client closed successfully.');
    return true;
  }
};