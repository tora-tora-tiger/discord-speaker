import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import talk from "@/index";

const data = new SlashCommandBuilder()
  .setName('set-volume')
  .setDescription('set volume')
  .addNumberOption(option =>
    option.setName('speed-volume')
      .setDescription('読み上げvolume')
      .setRequired(true)
  );

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

export default { 
  data: data,
  execute: execute
};