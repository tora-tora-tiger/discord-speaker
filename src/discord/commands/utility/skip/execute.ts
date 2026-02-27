import { CommandInteraction } from "discord.js";
import { guildSpeakerManager } from "@/discord";

const execute = async function(interaction: CommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply("このコマンドはサーバー内でのみ使用できます");
  }

  const guildSpeaker = guildSpeakerManager.getReadMessages(interaction.guild.id);
  if (!guildSpeaker) {
    return interaction.reply("このサーバーでは現在読み上げ中ではありません");
  }

  const skipped = guildSpeaker.skipCurrent();
  if (skipped) {
    return interaction.reply("現在再生中の読み上げをスキップしました");
  }

  return interaction.reply("現在スキップできる読み上げはありません");
};

export default execute;
