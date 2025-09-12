import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import talk from "@/server";

const data = new SlashCommandBuilder()
  .setName('set-speed')
  .setDescription('set speed')
  .addNumberOption(option =>
    option.setName('speed-scale')
      .setDescription('読み上げspeed')
      .setRequired(true)
  );

const execute = async function(interaction: CommandInteraction) {
  const speedScale = interaction.options.get('speed-scale');
  if (!speedScale) {
    return interaction.reply('faild to set speedScale');
  }

  const value = speedScale.value?.toString() ?? '1';
  talk.setSpeedScale(value);
  await interaction.reply('set speedScale: ' + value);
  console.log("[discord] set speedScale: ", value);
  // [TODO] すでに読み上げ中の音声に反映されるようにする
}

export default { 
  data: data,
  execute: execute
};