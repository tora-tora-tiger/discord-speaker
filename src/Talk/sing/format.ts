import * as abcjs from "abcjs";
import { SimpleSingNote, SimpleSingScore } from "./types";

const SING_PADDING_FRAME_LENGTH = 15;
const VOICEVOX_FRAME_RATE = 93.75;
const DEFAULT_NOTE_LYRIC = "あ";
const TIE_NOTE_LYRIC = "ー";

type AbcLyric = {
  syllable: string;
  divider: " " | "-" | "_";
};

type AbcMidiPitch = {
  cmd?: string;
  pitch?: number;
};

type AbcVoiceNote = abcjs.VoiceItemNote & {
  lyric?: AbcLyric[];
  midiPitches?: AbcMidiPitch[];
};

export function isSimpleSingText(text: string): boolean {
  return parseSimpleSingScore(text) !== undefined;
}

export function parseSimpleSingScore(text: string): SimpleSingScore | undefined {
  if (!isLikelyAbcText(text)) {
    return undefined;
  }

  const normalizedText = normalizeAbcForParser(text);
  let tune: abcjs.TuneObject | undefined;
  try {
    const tunes = abcjs.parseOnly(normalizedText);
    tune = tunes[0];
  } catch {
    return undefined;
  }

  if (!tune) {
    return undefined;
  }

  try {
    tune.setUpAudio({});
  } catch {
    // midiPitchesの付与に失敗した場合は後段の抽出で弾く
  }

  const bpm = tune.getBpm();
  const beatLength = tune.getBeatLength();
  if (!Number.isFinite(bpm) || bpm <= 0 || !Number.isFinite(beatLength) || beatLength <= 0) {
    return undefined;
  }

  const framesPerWholeNote = (60 * VOICEVOX_FRAME_RATE) / (bpm * beatLength);
  if (!Number.isFinite(framesPerWholeNote) || framesPerWholeNote <= 0) {
    return undefined;
  }

  const melodyVoiceIndex = detectMelodyVoiceIndex(tune);
  const voiceNotes = collectVoiceNotes(tune, melodyVoiceIndex);
  if (voiceNotes.length === 0) {
    return undefined;
  }

  const notes: SimpleSingNote[] = [{ key: null, frame_length: SING_PADDING_FRAME_LENGTH, lyric: "" }];
  let frameCarry = 0;
  let hasPlayableNote = false;

  for (const voiceNote of voiceNotes) {
    const duration = voiceNote.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      return undefined;
    }

    const frame = durationToFrameLength(duration, framesPerWholeNote, frameCarry);
    frameCarry = frame.carry;

    if (isRestNote(voiceNote)) {
      notes.push({ key: null, frame_length: frame.frameLength, lyric: "" });
      continue;
    }

    const key = extractMidiKey(voiceNote);
    if (key === undefined) {
      return undefined;
    }

    notes.push({
      key,
      frame_length: frame.frameLength,
      lyric: extractLyric(voiceNote)
    });
    hasPlayableNote = true;
  }

  if (!hasPlayableNote) {
    return undefined;
  }

  notes.push({ key: null, frame_length: SING_PADDING_FRAME_LENGTH, lyric: "" });
  return { notes };
}

function isLikelyAbcText(text: string): boolean {
  if (!/^\s*K:/m.test(text)) {
    return false;
  }
  return /^\s*(X:|T:|M:|L:|Q:|K:|V:|w:)/m.test(text);
}

function normalizeAbcForParser(text: string): string {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

function detectMelodyVoiceIndex(tune: abcjs.TuneObject): number {
  for (const line of tune.lines ?? []) {
    for (const staff of line.staff ?? []) {
      const voices = staff.voices ?? [];
      for (let i = 0; i < voices.length; i += 1) {
        const voice = voices[i];
        if (voice.some((item) => item.el_type === "note")) {
          return i;
        }
      }
    }
  }
  return 0;
}

function collectVoiceNotes(tune: abcjs.TuneObject, melodyVoiceIndex: number): AbcVoiceNote[] {
  const result: AbcVoiceNote[] = [];

  for (const line of tune.lines ?? []) {
    for (const staff of line.staff ?? []) {
      const voice = staff.voices?.[melodyVoiceIndex];
      if (!voice) {
        continue;
      }

      for (const item of voice) {
        if (item.el_type !== "note") {
          continue;
        }
        result.push(item as AbcVoiceNote);
      }
      break;
    }
  }

  return result;
}

function isRestNote(note: AbcVoiceNote): boolean {
  return note.rest !== undefined;
}

function extractMidiKey(note: AbcVoiceNote): number | undefined {
  const midiPitches = note.midiPitches ?? [];
  const values = midiPitches
    .filter((pitch) => pitch.cmd === "note" && Number.isFinite(pitch.pitch))
    .map((pitch) => Number(pitch.pitch));

  if (values.length === 0) {
    return undefined;
  }

  const key = Math.max(...values);
  if (!Number.isFinite(key) || key < 0 || key > 127) {
    return undefined;
  }
  return Math.round(key);
}

function extractLyric(note: AbcVoiceNote): string {
  const lyrics = note.lyric ?? [];
  if (lyrics.length === 0) {
    return DEFAULT_NOTE_LYRIC;
  }

  let sawTieDivider = false;
  for (const entry of lyrics) {
    if (entry.divider === "_") {
      sawTieDivider = true;
    }

    const normalized = normalizeLyricSyllable(entry.syllable ?? "");
    if (normalized === "*" || normalized === "~") {
      return TIE_NOTE_LYRIC;
    }
    if (normalized.length > 0) {
      // 複数w:行がある場合は先頭の有効な1行分を採用
      return normalized;
    }
  }

  if (sawTieDivider) {
    return TIE_NOTE_LYRIC;
  }
  return DEFAULT_NOTE_LYRIC;
}

function normalizeLyricSyllable(syllable: string): string {
  const stripped = syllable
    // 1番, 2., 3) などの節番号は歌詞として扱わない
    .replace(/^\d+[\.\)．）]*/u, "")
    .replace(/\s+/g, "")
    .trim();
  return stripped;
}

function durationToFrameLength(
  durationWhole: number,
  framesPerWholeNote: number,
  carry: number
): { frameLength: number; carry: number } {
  const rawFrameLength = durationWhole * framesPerWholeNote + carry;
  const roundedFrameLength = Math.round(rawFrameLength);
  if (roundedFrameLength < 1) {
    return { frameLength: 1, carry: rawFrameLength - 1 };
  }
  return {
    frameLength: roundedFrameLength,
    carry: rawFrameLength - roundedFrameLength
  };
}
