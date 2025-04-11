import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import { monitorChannel } from '@/discord';

const data = new SlashCommandBuilder()
  .setName('bye')
  .setDescription('Disconnect from the voice channel');

const execute = async function(interaction: CommandInteraction) {
  if(!interaction.guild) return;
  const connection = getVoiceConnection(interaction.guild.id);
  if(connection) {
    connection.destroy();
    monitorChannel.delete(interaction.guild.id);
    await interaction.reply("Disconnected from the voice channel.");
    return;
  }
  await interaction.reply("Not connected to any voice channel.");
}

export default { 
  data: data,
  execute: execute
};