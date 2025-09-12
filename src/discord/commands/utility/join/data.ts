import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("join")
  .setDescription("Join a voice channel");

export default { data };