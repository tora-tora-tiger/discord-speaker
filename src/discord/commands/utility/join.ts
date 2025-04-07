import { CommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js"
import { joinVoiceChannel } from "@discordjs/voice";
import { monitorChannel } from "@/discord";

// [TODO] VCの再接続に対応する
const data = new SlashCommandBuilder()
  .setName("join")
  .setDescription("Join a voice channel");

async function execute(interaction: CommandInteraction) {
  if(!interaction.member) return;
  if(!interaction.guild) return;
  if(interaction.user.bot) return;
  if (!(interaction.member instanceof GuildMember)) return;
  const voiceState = interaction.member.voice;

  if (!voiceState.channel || !voiceState.channelId) {
    return interaction.reply("You need to be in a voice channel to use this command.")
  }

  const connection = joinVoiceChannel({
    channelId: voiceState.channelId,
    guildId: interaction.guild.id,
    adapterCreator: interaction.guild.voiceAdapterCreator,
  })

  monitorChannel.set(interaction.guild.id, voiceState.channelId)
  interaction.reply(`Joined ${voiceState.channel.name}`)
}

export default {
  data: data,
  execute: execute
}