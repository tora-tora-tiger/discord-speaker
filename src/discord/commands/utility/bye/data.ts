import { SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('bye')
  .setDescription('Disconnect from the voice channel');

export default data;