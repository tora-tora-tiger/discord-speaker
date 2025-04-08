import { Client, Events, GatewayIntentBits, Collection, Snowflake } from 'discord.js';
import { token } from 'config.json';
import { collectCommands } from '@/discord/collectFiles';
import executeCommands from '@/discord/events/executeCommands';
import readMessages from '@/discord/events/readMessages';

import readline from 'readline';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,  // メッセージイベントを受け取るために必要
    GatewayIntentBits.MessageContent
  ]
});

export const monitorChannel = new Map<Snowflake, Snowflake>();
(async () => {
  
  // スラッシュコマンドのmap
  client.commands = new Collection();
  
  const commands = await collectCommands();
  commands.forEach(command => {
    client.commands.set(command.data.name, command);
  });
  
  // ログイン
  client.once(Events.ClientReady, (readyClient: Client<true>) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });
  
  // スラッシュコマンドの実行
  client.on(Events.InteractionCreate, executeCommands);

  // メッセージの読み上げ
  client.on(Events.MessageCreate, readMessages)
  
  client.login(token);
})();


// bot終了用
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Press Enter to close client session...', () => {
  rl.close();
  client.destroy();
  process.exit(0);
});