import { Client, Events, GatewayIntentBits, Collection, Interaction } from 'discord.js';
import { token } from 'config.json';
import { collectCommands } from '@/discord/collectFiles';
import type { Command } from '@/types';
import executeCommands from '@/discord/events/executeCommands';


(async () => {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });
  
  // スラッシュコマンドのmap
  client.commands = new Collection();
  
  const commands = await collectCommands();
  commands.forEach(command => {
    client.commands.set(command.data.name, command);
  });
  
  client.once(Events.ClientReady, (readyClient: Client<true>) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });
  
  client.on(Events.InteractionCreate, executeCommands);
  
  client.login(token);
})();