import { SimpleSingNote, SimpleSingScore } from "./types";

const SING_PADDING_FRAME_LENGTH = 15;
const VOICEVOX_FRAME_RATE = 90;
const MIDDLE_C_MIDI = 60;
const MIDDLE_C_OCTAVE = 3;

export function isSimpleSingText(text: string): boolean {
  return parseSimpleSingScore(text) !== undefined;
}

export function parseSimpleSingScore(text: string): SimpleSingScore | undefined {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length < 2) {
    return undefined;
  }

  const bpmLine = lines[0];
  if (!/^\d+(?:\.\d+)?$/.test(bpmLine)) {
    return undefined;
  }
  const bpm = Number.parseFloat(bpmLine);
  if (!Number.isFinite(bpm) || bpm <= 0) {
    return undefined;
  }

  const noteFrameLength = bpmToFrameLength(bpm);
  const items = lines
    .slice(1)
    .flatMap((line) => line.split(/[,，、]/))
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  if (items.length === 0) {
    return undefined;
  }

  const notes: SimpleSingNote[] = [{ key: null, frame_length: SING_PADDING_FRAME_LENGTH, lyric: "" }];
  for (const item of items) {
    const parsed = parseScoreItem(item);
    if (!parsed) {
      return undefined;
    }

    const noteToken = parsed.noteToken;
    const lyricToken = parsed.lyricToken;
    const key = noteTokenToMidi(noteToken);
    if (key === undefined) {
      return undefined;
    }
    if (key !== null && lyricToken.length === 0) {
      return undefined;
    }

    if (key === null) {
      notes.push({
        key: null,
        frame_length: noteFrameLength,
        lyric: ""
      });
      continue;
    }

    const lyricUnits = splitLyricToUnits(lyricToken);
    if (lyricUnits.length === 0) {
      return undefined;
    }

    const distributedLengths = distributeFrameLength(noteFrameLength, lyricUnits.length);
    for (let i = 0; i < lyricUnits.length; i += 1) {
      notes.push({
        key,
        frame_length: distributedLengths[i],
        lyric: lyricUnits[i]
      });
    }
  }

  notes.push({ key: null, frame_length: SING_PADDING_FRAME_LENGTH, lyric: "" });
  return { notes };
}

function parseScoreItem(item: string): { noteToken: string; lyricToken: string } | undefined {
  const parts = item.split(/\s+/).filter(Boolean);
  if (parts.length < 1 || parts.length > 2) {
    return undefined;
  }

  const noteToken = parts[0];
  if (/^(R|REST|-)$/i.test(noteToken)) {
    // 休符は歌詞不要
    if (parts.length !== 1) {
      return undefined;
    }
    return { noteToken, lyricToken: "" };
  }

  // 通常ノートは「音名 + 空白 + 歌詞」を必須にする
  if (parts.length !== 2) {
    return undefined;
  }
  const lyricToken = parts[1];
  if (lyricToken.length === 0) {
    return undefined;
  }
  return { noteToken, lyricToken };
}

function splitLyricToUnits(lyric: string): string[] {
  const chars = Array.from(lyric);
  if (chars.length === 0) {
    return [];
  }

  const smallKana = new Set([
    "ぁ", "ぃ", "ぅ", "ぇ", "ぉ",
    "ゃ", "ゅ", "ょ", "ゎ",
    "ァ", "ィ", "ゥ", "ェ", "ォ",
    "ャ", "ュ", "ョ", "ヮ",
    "っ", "ッ", "ー"
  ]);

  const units: string[] = [];
  for (const ch of chars) {
    if (smallKana.has(ch) && units.length > 0) {
      units[units.length - 1] += ch;
      continue;
    }
    units.push(ch);
  }
  return units;
}

function distributeFrameLength(total: number, count: number): number[] {
  const safeTotal = Math.max(total, count);
  const base = Math.floor(safeTotal / count);
  const remainder = safeTotal % count;
  const frames = new Array<number>(count).fill(base);
  for (let i = 0; i < remainder; i += 1) {
    frames[i] += 1;
  }
  return frames;
}

function bpmToFrameLength(bpm: number): number {
  const frameLength = Math.round((60 * VOICEVOX_FRAME_RATE) / bpm);
  return Math.max(1, frameLength);
}

function noteTokenToMidi(token: string): number | null | undefined {
  const upper = token.toUpperCase();
  if (upper === "R" || upper === "REST" || upper === "-") {
    return null;
  }

  const match = token.match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!match) {
    return undefined;
  }

  const note = match[1].toUpperCase();
  const accidental = match[2];
  const octave = Number.parseInt(match[3], 10);
  if (Number.isNaN(octave)) {
    return undefined;
  }

  const semitoneMap: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11
  };

  let semitone = semitoneMap[note];
  if (accidental === "#") {
    semitone += 1;
  } else if (accidental === "b") {
    semitone -= 1;
  }

  const midi = (octave - MIDDLE_C_OCTAVE) * 12 + MIDDLE_C_MIDI + semitone;
  if (midi < 0 || midi > 127) {
    return undefined;
  }
  return midi;
}
