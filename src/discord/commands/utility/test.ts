import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('test')
  .setDescription('test verious commands');

const execute = async function(interaction: CommandInteraction) {
  await interaction.reply("null");
}

export default { 
  data: data,
  execute: execute
};