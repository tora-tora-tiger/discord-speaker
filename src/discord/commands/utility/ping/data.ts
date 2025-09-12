import { SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!');

export default { data };