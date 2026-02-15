import { Singer, SingerStylePair, SimpleSingScore, TalkRequest } from "./types";

type SingParams = {
  host: string;
  port: string;
  requestedSpeaker: string;
  score: SimpleSingScore;
  request: TalkRequest;
};

export type SingSynthesisResult = {
  audioData?: ArrayBuffer;
  error?: string;
};

type ResolveSingerStyleResult = {
  stylePair?: SingerStylePair;
  error?: string;
};

export async function synthesizeSingVoice(params: SingParams): Promise<SingSynthesisResult> {
  const resolved = await resolveSingerStylePair(
    params.host,
    params.port,
    params.requestedSpeaker,
    params.request
  );
  if (!resolved.stylePair) {
    return { error: resolved.error ?? "歌唱用の話者解決に失敗しました。" };
  }
  const stylePair = resolved.stylePair;

  const queryUrl = new URL(`http://${params.host}:${params.port}/sing_frame_audio_query`);
  queryUrl.search = new URLSearchParams({ speaker: stylePair.querySpeaker }).toString();
  const queryResponse = await params.request(queryUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params.score)
  });
  if (!queryResponse) {
    return { error: `歌唱クエリの生成に失敗しました（speaker=${stylePair.querySpeaker}）。` };
  }
  const frameAudioQuery = await queryResponse.json();

  const synthesisUrl = new URL(`http://${params.host}:${params.port}/frame_synthesis`);
  synthesisUrl.search = new URLSearchParams({ speaker: stylePair.synthesisSpeaker }).toString();
  const synthesisResponse = await params.request(synthesisUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(frameAudioQuery)
  });
  if (!synthesisResponse) {
    return { error: `歌唱音声の合成に失敗しました（speaker=${stylePair.synthesisSpeaker}）。` };
  }
  return { audioData: await synthesisResponse.arrayBuffer() };
}

async function resolveSingerStylePair(
  host: string,
  port: string,
  requestedSpeaker: string,
  request: TalkRequest
): Promise<ResolveSingerStyleResult> {
  const singersUrl = new URL(`http://${host}:${port}/singers`);
  const singersResponse = await request(singersUrl, { method: "GET" });
  if (!singersResponse) {
    return { error: "VOICEVOX の /singers 取得に失敗しました。VOICEVOX が起動しているか確認してください。" };
  }

  const singers = await singersResponse.json() as Singer[];
  const requestedId = Number.parseInt(requestedSpeaker, 10);
  if (Number.isNaN(requestedId)) {
    return { error: `話者IDが不正です: ${requestedSpeaker}` };
  }

  const singIds = singers.flatMap((singer) =>
    (singer.styles ?? [])
      .filter((style) => style.type === "sing" || style.type === "singing_teacher")
      .map((style) => style.id)
  );

  for (const singer of singers) {
    const styles = singer.styles ?? [];
    const selectedStyle = styles.find((style) => style.id === requestedId);
    if (!selectedStyle || !selectedStyle.type) {
      continue;
    }

    if (selectedStyle.type === "sing" || selectedStyle.type === "singing_teacher") {
      const frameDecodeStyle = styles.find((style) => style.type === "frame_decode");
      if (!frameDecodeStyle) {
        return { error: `話者ID ${requestedSpeaker} に対応する frame_decode スタイルが見つかりません。` };
      }
      return {
        stylePair: {
          querySpeaker: String(selectedStyle.id),
          synthesisSpeaker: String(frameDecodeStyle.id)
        }
      };
    }

    if (selectedStyle.type === "frame_decode") {
      const singStyle = styles.find(
        (style) => style.type === "sing" || style.type === "singing_teacher"
      );
      if (!singStyle) {
        const idList = singIds.length > 0 ? singIds.join(", ") : "なし";
        return { error: `話者ID ${requestedSpeaker} は歌唱に非対応です。歌唱対応ID: ${idList}` };
      }
      return {
        stylePair: {
          querySpeaker: String(singStyle.id),
          synthesisSpeaker: String(selectedStyle.id)
        }
      };
    }
  }

  const idList = singIds.length > 0 ? singIds.join(", ") : "なし";
  return { error: `話者ID ${requestedSpeaker} が見つかりません。歌唱対応ID: ${idList}` };
}
