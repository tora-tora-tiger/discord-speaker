import { CommandInteraction } from 'discord.js';
import talk from "@/server";
import data from './data';

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