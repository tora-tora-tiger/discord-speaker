import { Message, OmitPartialGroupDMChannel } from "discord.js";
import { guildSpeakerManager } from "@/discord";

async function readMessages(message: OmitPartialGroupDMChannel<Message>) {
  if (!message.guild || !message.guildId) return;
  const channelId = guildSpeakerManager.getChannelId(message.guild.id);
  if (!channelId) return;

  const speaker = guildSpeakerManager.subscribe(message.guild, channelId);
  speaker.speak(message);
}

export default readMessages;