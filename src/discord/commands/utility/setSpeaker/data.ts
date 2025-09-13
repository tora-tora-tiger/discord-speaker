import { SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('set-speaker')
  .setDescription('set speaker')
  .addNumberOption(option =>
    option.setName('speaker')
      .setDescription('喋る人')
      .setRequired(true)
  );

export default { data };