import { getVoiceConnection } from '@discordjs/voice';
import { guildSpeakerManager } from "@/discord";
import { VoiceState, VoiceChannel } from 'discord.js';

const onVoiceStateUpdate = async (oldState: VoiceState, newState: VoiceState) => {
  // ボットがVCに接続しているか確認
  const connection = getVoiceConnection(newState.guild.id);
  if (!connection) {
    return; // ボットがVCに接続していない場合は何もしない
  }

  // ボットが接続しているVCチャンネルIDを取得
  const botChannelId = connection.joinConfig.channelId;
  if (!botChannelId) {
    return; // チャンネルIDが取得できない場合は何もしない
  }

  // 変更があったVCがボットと同じVCか確認
  const changedChannelId = newState.channelId || oldState.channelId;
  if (changedChannelId !== botChannelId) {
    return; // ボットと違うVCの変更は無視
  }

  // VCにいる非ボットメンバーを確認
  const botVoiceChannel = newState.guild.channels.cache.get(botChannelId) as VoiceChannel;
  if (!botVoiceChannel) {
    return; // チャンネルが見つからない場合は何もしない
  }

  // ボット以外のメンバーがいるか確認
  const nonBotMembers = botVoiceChannel.members.filter(member => !member.user.bot);

  console.log(`[discord/${newState.guild.name}] VCメンバー数: ${nonBotMembers.size}`);

  // ボット以外のメンバーがいない場合は退出処理を実行
  if (nonBotMembers.size === 0) {
    // 数秒待機してから退出（誤操作防止のため）
    setTimeout(() => {
      const recheckConnection = getVoiceConnection(newState.guild.id);
      if (recheckConnection) {
        const recheckChannelId = recheckConnection.joinConfig.channelId;
        if (recheckChannelId) {
          const recheckChannel = newState.guild.channels.cache.get(recheckChannelId) as VoiceChannel;
          if (recheckChannel) {
            const currentNonBotMembers = recheckChannel.members.filter(member => !member.user.bot);
            if (currentNonBotMembers.size === 0) {
              console.log(`[discord/${newState.guild.name}] VCにメンバーがいないため退出します`);
              recheckConnection.destroy();
              guildSpeakerManager.unsubscribe(newState.guild.id);
            }
          }
        }
      }
    }, 10000); // 10秒待機
  }
}


export default onVoiceStateUpdate;