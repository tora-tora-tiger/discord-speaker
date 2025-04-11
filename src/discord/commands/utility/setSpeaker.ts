import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import talk from "@/index";

const data = new SlashCommandBuilder()
  .setName('set-speaker')
  .setDescription('set speaker')
  .addNumberOption(option =>
    option.setName('speaker')
      .setDescription('喋る人')
      .setRequired(true)
  );

const execute = async function(interaction: CommandInteraction) {
  const speaker = interaction.options.get('speaker');
  if (!speaker) {
    return interaction.reply('faild to set speaker');
  }

  const value = speaker.value?.toString() ?? '1'; // デフォルトはずんだもん
  talk.setSpeaker(value);
  await interaction.reply('set speaker: ' + value);
  console.log("[discord] set speaker: ", value);
  // [TODO] すでに読み上げ中の音声に反映されるようにする
}

export default { 
  data: data,
  execute: execute
};