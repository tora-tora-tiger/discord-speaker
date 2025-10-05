import { CommandInteraction } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import { guildSpeakerManager } from "@/discord";

const execute = async function(interaction: CommandInteraction) {
  if(!interaction.guild) return;
  const connection = getVoiceConnection(interaction.guild.id);
  if(connection) {
    connection.destroy();
    guildSpeakerManager.unsubscribe(interaction.guild.id);
    await interaction.reply("Disconnected from the voice channel.");
    return;
  }
  await interaction.reply("Not connected to any voice channel.");
}

export default execute;