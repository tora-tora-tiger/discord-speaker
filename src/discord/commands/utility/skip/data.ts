import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("現在再生中の読み上げをスキップします");

export default data;
