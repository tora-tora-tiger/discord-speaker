import { CommandInteraction, GuildMember } from 'discord.js';
import { guildSpeakerManager } from "@/discord";

const execute = async function(interaction: CommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply('このコマンドはサーバー内でのみ使用できます');
  }

  if (!(interaction.member instanceof GuildMember)) {
    return interaction.reply('メンバー情報の取得に失敗しました');
  }

  const speakerOption = interaction.options.get('speaker');
  const targetOption = interaction.options.get('target');

  if (!speakerOption || !speakerOption.value) {
    return interaction.reply('話者IDが指定されていません');
  }

  const speaker = speakerOption.value.toString();
  const target = targetOption?.value?.toString() || 'user'; // デフォルトは'user'

  try {
    const guildSpeaker = guildSpeakerManager.getReadMessages(interaction.guild.id);

    if (!guildSpeaker) {
      return interaction.reply('ボットがこのサーバーで有効化されていません。まず/joinコマンドを実行してください');
    }

    if (target === 'user') {
      // 個人設定
      guildSpeaker.setUserSpeaker(interaction.user.id, speaker);
      await interaction.reply(`個人設定: 話者を ${speaker} に設定しました`);
      console.log(`[discord] User ${interaction.user.username} set personal speaker to ${speaker}`);
    } else if (target === 'server') {
      // サーバー設定
      guildSpeaker.setServerSpeaker(speaker);
      await interaction.reply(`サーバー設定: 話者を ${speaker} に設定しました`);
      console.log(`[discord] Server ${interaction.guild.name} set server speaker to ${speaker}`);
    } else {
      await interaction.reply('無効な対象が指定されました');
    }
  } catch (error) {
    console.error('[discord] Failed to set speaker:', error);
    await interaction.reply('話者の設定に失敗しました');
  }
};

export default execute;