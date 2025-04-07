import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!');

const execute = async function(interaction: CommandInteraction) {
  await interaction.reply('Pong!');
}

export default { 
  data: data,
  execute: execute
};