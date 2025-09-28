import { SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('set-speed')
  .setDescription('set speed')
  .addNumberOption(option =>
    option.setName('speed-scale')
      .setDescription('読み上げspeed')
      .setRequired(true)
  );

export default data;