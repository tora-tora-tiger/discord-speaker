export type SimpleSingNote = {
  key: number | null;
  frame_length: number;
  lyric: string;
};

export type SimpleSingScore = {
  notes: SimpleSingNote[];
};

export type SingerStyleType = "talk" | "sing" | "singing_teacher" | "frame_decode";

export type SingerStyle = {
  id: number;
  type?: SingerStyleType;
};

export type Singer = {
  speaker_uuid?: string;
  styles?: SingerStyle[];
};

export type SingerStylePair = {
  querySpeaker: string;
  synthesisSpeaker: string;
};

export type TalkRequest = (url: URL, option: RequestInit) => Promise<Response | undefined>;
