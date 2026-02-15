import { Singer, SingerStylePair, SimpleSingScore, TalkRequest } from "./types";

type SingParams = {
  host: string;
  port: string;
  requestedSpeaker: string;
  score: SimpleSingScore;
  request: TalkRequest;
};

export async function synthesizeSingVoice(params: SingParams): Promise<ArrayBuffer | undefined> {
  const stylePair = await resolveSingerStylePair(
    params.host,
    params.port,
    params.requestedSpeaker,
    params.request
  );
  if (!stylePair) {
    return undefined;
  }

  const queryUrl = new URL(`http://${params.host}:${params.port}/sing_frame_audio_query`);
  queryUrl.search = new URLSearchParams({ speaker: stylePair.querySpeaker }).toString();
  const queryResponse = await params.request(queryUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params.score)
  });
  if (!queryResponse) {
    return undefined;
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
    return undefined;
  }
  return synthesisResponse.arrayBuffer();
}

async function resolveSingerStylePair(
  host: string,
  port: string,
  requestedSpeaker: string,
  request: TalkRequest
): Promise<SingerStylePair | undefined> {
  const singersUrl = new URL(`http://${host}:${port}/singers`);
  const singersResponse = await request(singersUrl, { method: "GET" });
  if (!singersResponse) {
    return undefined;
  }

  const singers = await singersResponse.json() as Singer[];
  const requestedId = Number.parseInt(requestedSpeaker, 10);
  if (Number.isNaN(requestedId)) {
    return undefined;
  }

  for (const singer of singers) {
    const styles = singer.styles ?? [];
    const selectedStyle = styles.find((style) => style.id === requestedId);
    if (!selectedStyle || !selectedStyle.type) {
      continue;
    }

    if (selectedStyle.type === "sing" || selectedStyle.type === "singing_teacher") {
      const frameDecodeStyle = styles.find((style) => style.type === "frame_decode");
      if (!frameDecodeStyle) {
        return undefined;
      }
      return {
        querySpeaker: String(selectedStyle.id),
        synthesisSpeaker: String(frameDecodeStyle.id)
      };
    }

    if (selectedStyle.type === "frame_decode") {
      const singStyle = styles.find(
        (style) => style.type === "sing" || style.type === "singing_teacher"
      );
      if (!singStyle) {
        return undefined;
      }
      return {
        querySpeaker: String(singStyle.id),
        synthesisSpeaker: String(selectedStyle.id)
      };
    }
  }

  return undefined;
}
