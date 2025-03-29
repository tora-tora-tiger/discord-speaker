// import { SlashCommandBuilder } from "discord.js"

// export default {
//   data: new SlashCommandBuilder()
//     .setName("join")
//     .setDescription("Join a voice channel"),

//   async execute(interaction) {
//     const voiceChannel = interaction.member.voice.channel
//     if (!voiceChannel) {
//       return interaction.reply("You need to be in a voice channel to use this command.")
//     }

//     voiceChannel.join().then(() => {
//       interaction.reply(`Joined ${voiceChannel.name}`)
//     }).catch(err => {
//       console.error(err)
//       interaction.reply("Failed to join the voice channel.")
//     })
//   }
  
// }