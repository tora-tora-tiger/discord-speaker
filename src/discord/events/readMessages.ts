import { Message, OmitPartialGroupDMChannel } from "discord.js";
import { monitorChannel } from "@/discord";
import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioResource, getVoiceConnection, StreamType } from "@discordjs/voice";
import { Readable } from "stream";
import talk from "@/index";

// [TODO] ギルドごとにキューを持つようにする
const player = new AudioPlayer();
const audioResourceQueue = new Array<AudioResource>();

async function readMessages(message: OmitPartialGroupDMChannel<Message>) {
  if (!message.guild) return;
  const channelId = monitorChannel.get(message.guild.id);
  if (!channelId) return;

  // 読まないメッセージは無視
  if (message.channelId !== channelId) return;
  if (message.author.bot) return;

  console.log("[discord] received message: ", message.content);

  // 読み上げ
  const connection = getVoiceConnection(message.guild.id);
  if (!connection) {
    console.error("[discord] No voice connection found");
    return;
  }
  connection?.subscribe(player);
  if (!player) {
    console.error("[discord] No audio player found");
    return;
  }
  // 読み上げが終わったらキューに入った次の音声を再生する
  player.on(AudioPlayerStatus.Idle, () => {
    console.log("[discord] Audio player become idle");
    if(audioResourceQueue.length > 0) {
      const nextResource = audioResourceQueue.shift();
      if(nextResource) {
        player.play(nextResource);
        console.log("[discord] Next audio resource playing");
      } else {
        console.error("[discord] Failed to get next audio resource");
      }
    } else {
      console.log("[dicord] Queue is empty");
    }
  });

  // 音声バイナリ取得し，discord.jsのAudioResourceに変換
  const voice = await talk.voiceboxTalk(message.content);
  if(!voice) {
    console.error("[discord] Failed to get message voice");
    return;
  }
  const stream = new Readable();
  stream.push(Buffer.from(voice));
  stream.push(null);
  const resource = createAudioResource(stream, {inputType: StreamType.Arbitrary});

  
  // 音声を再生
  // [TODO] 音声が再生中の場合，キューに入れる
  const status = player.state.status;
  if (status === AudioPlayerStatus.Idle) {
    player.play(resource);
  } else {
    audioResourceQueue.push(resource);
    console.log("[discord] Audio resource pushed to queue, queue size is ", audioResourceQueue.length);
  }

}

export default readMessages;