import { SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('set-model')
  .setDescription('読み上げモデルを設定します')
  .addStringOption(option =>
    option.setName('speaker')
      .setDescription('話者ID（例: 1=ずんだもん, 3=四国めたん）')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('target')
      .setDescription('設定対象')
      .addChoices(
        { name: '個人設定', value: 'user' },
        { name: 'サーバー設定', value: 'server' }
      )
      .setRequired(false)
  );

export default data;