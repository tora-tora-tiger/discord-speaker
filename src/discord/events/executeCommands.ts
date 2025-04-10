import { Interaction } from "discord.js";

async function executeCommands(interaction: Interaction): Promise<void>{
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName)
  
  if (!command) {
    console.error(`[discord] No command matching ${interaction.commandName} was found.`);
    return;
  }
  try {
    command.execute(interaction);
    console.log("[discord] executed command: ", interaction.commandName);
  } catch (error) {
    console.error(`[discord] Error executing ${interaction.commandName}`);
    console.error(error);
    
    if(interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
};

export default executeCommands;