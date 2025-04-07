import { Guild, GuildTextBasedChannel, Message, OmitPartialGroupDMChannel, Snowflake } from "discord.js";
import { monitorChannel } from "@/discord";

async function readMessages(message: OmitPartialGroupDMChannel<Message>) {
  console.log("message received: ", message.content);
  if (!message.guild) return;
  const channelId = monitorChannel.get(message.guild.id);
  if (!channelId) return;

  if (message.channelId !== channelId) return;
  if (message.author.bot) return;

  console.log("read message: ", message.content);
  // 読み上げ
}

export default readMessages;