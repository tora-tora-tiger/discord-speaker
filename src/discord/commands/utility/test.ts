import { joinVoiceChannel } from '@discordjs/voice';
import {SlashCommandBuilder, CommandInteraction, ChannelType} from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('test')
  .setDescription('test verious commands');

const execute = async function(interaction: CommandInteraction) {
  // チャンネル一覧を取得して，そこからコマンドを打った人が入っているVCを探す
  const guild = interaction.guild;
  const guildChannelManager = guild?.channels;
  if(!guildChannelManager) return;
  const channels = guildChannelManager.cache;
  const voiceChannels = channels.filter(channel => channel.type === ChannelType.GuildVoice);
  console.log("found channels", voiceChannels);
  const vcChannel = voiceChannels.find(channel => {
    const members = channel.members;
    return members.has(interaction.user.id);
  });

  if(!vcChannel) {
    await interaction.reply("You are not in a voice channel.");
    return;
  }

  const connection = joinVoiceChannel({
    channelId: vcChannel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
  });
  await interaction.reply(`Joined ${vcChannel.name}`);
}

export default { 
  data: data,
  execute: execute
};