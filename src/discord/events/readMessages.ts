import { Message, OmitPartialGroupDMChannel } from "discord.js";
import { monitorChannel } from "@/discord";
import { AudioPlayer, createAudioResource, getVoiceConnection, StreamType } from "@discordjs/voice";
import { Readable } from "stream";
import talk from "@/index";

async function readMessages(message: OmitPartialGroupDMChannel<Message>) {
  if (!message.guild) return;
  const channelId = monitorChannel.get(message.guild.id);
  if (!channelId) return;

  if (message.channelId !== channelId) return;
  if (message.author.bot) return;

  console.log("[discord] read message: ", message.content);

  // 読み上げ
  
  const connection = getVoiceConnection(message.guild.id);
  if (!connection) {
    console.error("[discord] No voice connection found");
    return;
  }
  const subscription = connection?.subscribe(new AudioPlayer());
  const player = subscription?.player;
  if (!player) {
    console.error("[discord] No audio player found");
    return;
  }

  // 音声バイナリ取得
  const voice = await talk.voiceboxTalk(message.content);
  if(!voice) {
    console.error("[discord] Failed to get message voice");
    return;
  }
  const stream = new Readable();
  stream.push(Buffer.from(voice));
  stream.push(null);

  // 音声を再生
  const resource = createAudioResource(stream, {inputType: StreamType.Arbitrary});

  player.play(resource);

  // [TODO] 音声が再生中の場合，キューに入れる

}

export default readMessages;