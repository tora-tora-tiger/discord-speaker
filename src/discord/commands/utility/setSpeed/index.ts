import { CommandInteraction } from 'discord.js';
import talk from "@/server";
import data from './data';

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