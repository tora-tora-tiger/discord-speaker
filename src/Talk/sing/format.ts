import { SimpleSingNote, SimpleSingScore } from "./types";

const SING_PADDING_FRAME_LENGTH = 15;
const VOICEVOX_FRAME_RATE = 90;

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
    .join(" ")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  if (items.length === 0) {
    return undefined;
  }

  const notes: SimpleSingNote[] = [{ key: null, frame_length: SING_PADDING_FRAME_LENGTH, lyric: "" }];
  for (const item of items) {
    const parts = item.split(/\s+/).filter(Boolean);
    if (parts.length < 1 || parts.length > 2) {
      return undefined;
    }

    const noteToken = parts[0];
    const lyricToken = parts[1] ?? "";
    const key = noteTokenToMidi(noteToken);
    if (key === undefined) {
      return undefined;
    }
    if (key !== null && lyricToken.length === 0) {
      return undefined;
    }

    notes.push({
      key,
      frame_length: noteFrameLength,
      lyric: key === null ? "" : lyricToken
    });
  }

  notes.push({ key: null, frame_length: SING_PADDING_FRAME_LENGTH, lyric: "" });
  return { notes };
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

  const midi = (octave + 1) * 12 + semitone;
  if (midi < 0 || midi > 127) {
    return undefined;
  }
  return midi;
}
