import { Client, Events, GatewayIntentBits, Collection, Interaction } from 'discord.js';
import { token } from 'config.json';
import { collectCommands } from '@/discord/collectFiles';
import type { Command } from '@/types';


(async () => {

  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });
  
  // スラッシュコマンドのmap
  client.commands = new Collection();
  
  (await collectCommands()).forEach(value => {
    console.log(value);
    client.commands.set(value.data.name, value);
  });
  
  client.once(Events.ClientReady, (readyClient: Client<true>) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });
  
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    console.log(client.commands.keys());
    const command = interaction.client.commands.get(interaction.commandName)
  
    console.log("interaction: ", interaction.commandName);
    console.log("command: ", command);
  
    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
      return;
    }
    try {
      await command.execute(interaction);
      console.log("executed command: ", interaction.commandName);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}`);
      console.error(error);
  
      if(interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  });
  
  client.login(token);
})();