import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('show')
  .setDescription('show interaction data');

const execute = async function(interaction: CommandInteraction) {
  console.log(interaction);
  await interaction.reply("execute show command");
}

export default { 
  data: data,
  execute: execute
};