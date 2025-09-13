import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName('set-volume')
  .setDescription('set volume')
  .addNumberOption(option =>
    option.setName('speed-volume')
      .setDescription('読み上げvolume')
      .setRequired(true)
  );

export default data;