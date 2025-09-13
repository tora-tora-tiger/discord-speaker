import talk from "@/server";
import { CommandInteraction } from "discord.js";

const execute = async function(interaction: CommandInteraction) {
  const volumeScale = interaction.options.get('speed-volume');
  if (!volumeScale) {
    return interaction.reply('faild to set volumeScale');
  }

  const value = volumeScale.value?.toString() ?? '100';
  talk.setVolumeScale(value);
  await interaction.reply('set volumeScale: ' + value);
  console.log("[discord] set volumeScale: ", value);
  // [TODO] すでに読み上げ中の音声に反映されるようにする
}

export default execute;