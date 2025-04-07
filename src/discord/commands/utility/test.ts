import { joinVoiceChannel } from '@discordjs/voice';
import {SlashCommandBuilder, CommandInteraction, ChannelType, Options} from 'discord.js';
import asyncFind from '@/utility/asyncFind';

const data = new SlashCommandBuilder()
  .setName('test')
  .setDescription('test verious commands');

const execute = async function(interaction: CommandInteraction) {
  await interaction.reply("null");
}

export default { 
  data: data,
  execute: execute
};