import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';
import { isSimpleSingText, parseSimpleSingScore } from "@/Talk/sing/format";
import { synthesizeSingVoice } from "@/Talk/sing/synthesis";

type TalkOptions = {
  speaker?: string;
  speedScale?: string;
  pitchScale?: string;
  intonationScale?: string;
  volumeScale?: string;
  kana?: boolean;
};

type Params = {
  host: string;
  port: string;
};

export type TalkSynthesisResult = {
  audioData?: ArrayBuffer;
  error?: string;
};

export default class Talk {
  host: string;
  port: string;
  private readonly singSpeaker = "6000";

  speaker: string
  speedScale: string;
  pitchScale: string;
  intonationScale: string
  volumeScale: string;
  kana: boolean;
  private readonly requestRetryCount = 2;
  private readonly readRetryCount = 2;

  constructor(params: Params, options: TalkOptions = {}) {
    this.host   = params?.host ?? 'localhost';
    this.port   = params?.port ?? '50080';
    this.speaker  = options?.speaker ?? '1';
    this.speedScale  = options?.speedScale ?? '1.3';
    this.pitchScale  = options?.pitchScale ?? '0';
    this.intonationScale = options?.intonationScale ?? '1';
    this.volumeScale = options?.volumeScale ?? '1';
    this.kana = options?.kana ?? false;
  }

  setHost(host: string): void {
    this.host = host;
  }
  setPort(port: string): void {
    this.port = port;
  }
  setSpeaker(speaker: string): void {
    this.speaker = speaker;
  }
  setSpeedScale(speedScale: string): void {
    this.speedScale = speedScale;
  }
  setPitchScale(pitchScale: string): void {
    this.pitchScale = pitchScale;
  }
  setIntonationScale(intonationScale: string): void {
    this.intonationScale = intonationScale;
  }
  setVolumeScale(volumeScale: string): void {
    this.volumeScale = volumeScale;
  }
  setKana(kana: boolean): void {
    this.kana = kana;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRetryableFetchError(error: unknown): boolean {
    if (this.isHttpError(error)) {
      return Boolean(error.retryable);
    }

    const message = error instanceof Error ? error.message : String(error);
    const cause = error instanceof Error ? (error as { cause?: unknown }).cause : undefined;
    const code = typeof cause === "object" && cause !== null && "code" in cause
      ? String((cause as { code?: unknown }).code)
      : "";
    if (["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN"].includes(code)) {
      return true;
    }
    return /terminated|fetch failed|socket|network/i.test(message);
  }

  private isRetryableReadError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    const cause = error instanceof Error ? (error as { cause?: unknown }).cause : undefined;
    const code = typeof cause === "object" && cause !== null && "code" in cause
      ? String((cause as { code?: unknown }).code)
      : "";
    if (["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN"].includes(code)) {
      return true;
    }
    return /terminated|socket|network|reset/i.test(message);
  }

  private async readJsonSafely<T>(
    response: Response,
    context: string,
    setError: (message: string) => void
  ): Promise<T | undefined> {
    try {
      return await response.json() as T;
    } catch (error) {
      console.error(`[Talk] Failed to parse JSON response (${context}):`, error);
      const text = error instanceof Error ? error.message : String(error);
      setError(`${context}のレスポンス解析に失敗しました: ${text}`);
      return undefined;
    }
  }

  private async synthesizeAndReadWithRetry(
    url: URL,
    options: RequestInit,
    context: string,
    setError: (message: string) => void
  ): Promise<ArrayBuffer | undefined> {
    for (let attempt = 0; attempt <= this.readRetryCount; attempt += 1) {
      const response = await this.request(url, options, setError);
      if (!response) {
        setError(`${context}の通信に失敗しました。`);
        return undefined;
      }

      try {
        return await response.arrayBuffer();
      } catch (error) {
        const retryable = this.isRetryableReadError(error);
        const canRetry = retryable && attempt < this.readRetryCount;
        if (canRetry) {
          const backoffMs = 200 * (attempt + 1);
          console.warn(`[Talk] Read retry ${attempt + 1}/${this.readRetryCount}: ${url.toString()}`);
          await this.sleep(backoffMs);
          continue;
        }
        console.error(`[Talk] Failed to read audio response (${context}):`, error);
        const text = error instanceof Error ? error.message : String(error);
        setError(`${context}の音声受信に失敗しました: ${text}`);
        return undefined;
      }
    }
    setError(`${context}の音声受信に失敗しました。`);
    return undefined;
  }

  isSimpleSingText(text: string): boolean {
    return isSimpleSingText(text);
  }

  private async request(
    url: URL,
    option: RequestInit,
    setError: (message: string) => void
  ): Promise<Response | undefined> {
    for (let attempt = 0; attempt <= this.requestRetryCount; attempt += 1) {
      try {
        console.log('[Talk] Requesting:', url.toString());
        const response = await fetch(url.toString(), option);
        if (!response.ok) {
          const detail = await this.extractErrorDetail(response);
          const message = detail
            ? `HTTP ${response.status} ${response.statusText}: ${detail}`
            : `HTTP ${response.status} ${response.statusText}`;
          throw this.createHttpError(message, response.status);
        }
        return response;
      } catch (error) {
        const retryable = this.isRetryableFetchError(error);
        const canRetry = retryable && attempt < this.requestRetryCount;
        if (canRetry) {
          const backoffMs = 200 * (attempt + 1);
          console.warn(`[Talk] Request retry ${attempt + 1}/${this.requestRetryCount}: ${url.toString()}`);
          await this.sleep(backoffMs);
          continue;
        }
        console.error('[Talk] Fetch error:', error);
        if (this.isHttpError(error) && error.status >= 400 && error.status < 500) {
          setError(`TTSリクエストが不正です: ${error.message}`);
          return undefined;
        }
        const text = error instanceof Error ? error.message : String(error);
        setError(`TTSサーバーへの接続に失敗しました: ${text}`);
        return undefined;
      }
    }
    return undefined;
  }

  private async extractErrorDetail(response: Response): Promise<string | undefined> {
    try {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = await response.json() as { detail?: unknown; message?: unknown; error?: unknown };
        if (typeof body.detail === "string") return body.detail;
        if (typeof body.message === "string") return body.message;
        if (typeof body.error === "string") return body.error;
        return JSON.stringify(body);
      }
      const text = await response.text();
      return text.trim().length > 0 ? text.trim() : undefined;
    } catch {
      return undefined;
    }
  }

  private createHttpError(message: string, status: number): Error & { status: number; retryable: boolean } {
    const error = new Error(message) as Error & { status: number; retryable: boolean };
    error.status = status;
    error.retryable = status === 429 || status >= 500;
    return error;
  }

  private isHttpError(error: unknown): error is Error & { status: number; retryable: boolean } {
    return typeof error === "object" && error !== null && "status" in error && "retryable" in error;
  }
  
  // voicboxを利用
  async voiceboxTalkWithResult(
    text: string,
    options: TalkOptions = {}
  ): Promise<TalkSynthesisResult> {
    let localError: string | undefined;
    const setLocalError = (message: string) => {
      if (!localError) {
        localError = message;
      }
    };

    const parsedScore = parseSimpleSingScore(text);
    if (parsedScore) {
      const result = await synthesizeSingVoice({
        host: this.host,
        port: this.port,
        // 歌唱は通常の話者設定と切り離して固定IDを使う
        requestedSpeaker: this.singSpeaker,
        score: parsedScore,
        request: (url, requestOptions) => this.request(url, requestOptions, setLocalError)
      });
      if (result.error) {
        setLocalError(result.error);
      }
      return {
        audioData: result.audioData,
        error: localError ?? result.error
      };
    }

    // デフォルト値を設定
    const finalOptions: Required<TalkOptions> = {
      speaker: options.speaker ?? this.speaker,
      volumeScale: options.volumeScale ?? this.volumeScale,
      speedScale: options.speedScale ?? this.speedScale,
      pitchScale: options.pitchScale ?? this.pitchScale,
      intonationScale: options.intonationScale ?? this.intonationScale,
      kana: options.kana ?? this.kana
    };
    // クエリ生成
    const query: {
      text: string;
      speaker: string;
      core_version?: string;
    } = {
      text: text,
      speaker: finalOptions.speaker
    }

    const query_url = new URL(`http://${this.host}:${this.port}/audio_query`);
    query_url.search = new URLSearchParams(query).toString();
  
    const query_response = await this.request(query_url, {method: 'POST'}, setLocalError);
    
    if (!query_response) {
      console.error('[Talk] Failed to get audio query response');
      setLocalError('音声クエリの生成に失敗しました。');
      return { error: localError };
    }
  
    const query_json = await this.readJsonSafely<Record<string, unknown>>(
      query_response,
      "audio_query",
      setLocalError
    );
    if (!query_json) {
      return { error: localError };
    }

    // クエリのパラメータを設定
    query_json.speaker = finalOptions.speaker;
    query_json.speedScale = finalOptions.speedScale;
    query_json.pitchScale = finalOptions.pitchScale;
    query_json.intonationScale = finalOptions.intonationScale;
    query_json.volumeScale = finalOptions.volumeScale;
    query_json.kana = finalOptions.kana.toString();
    
    // console.log('[Talk] query_json:', query_json);
    
    // 音声合成
    const synthesis_url = new URL(`http://${this.host}:${this.port}/synthesis`);
    synthesis_url.search = new URLSearchParams(query).toString();
  
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const synthesisRequest: RequestInit = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query_json)
    };

    // ArrayBufferとして音声データを取得
    const audioData = await this.synthesizeAndReadWithRetry(
      synthesis_url,
      synthesisRequest,
      "synthesis",
      setLocalError
    );
    if (!audioData) {
      return { error: localError };
    }
    
    // AudioContextを使用して音声を再生
    // await this.playAudio(audioData);

    return { audioData, error: localError };
  }

  async voiceboxTalk(
    text: string,
    options: TalkOptions = {}
  ): Promise<ArrayBuffer | undefined> {
    const result = await this.voiceboxTalkWithResult(text, options);
    return result.audioData;
  }

  private async playAudio(audioData: ArrayBuffer): Promise<void> {
    const execPromise = promisify(exec);
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `voicebox_${Date.now()}.wav`);
    
    try {
      // WAVデータをファイルに保存
      await fs.writeFile(tempFilePath, Buffer.from(audioData));
      
      // Macの場合はafplayを使用して再生
      if (process.platform === 'darwin') {
        await execPromise(`afplay "${tempFilePath}"`);
      } 
      // Linuxの場合はaplayを使用
      else if (process.platform === 'linux') {
        await execPromise(`aplay "${tempFilePath}"`);
      }
      // Windowsの場合はstart commandを使用
      else if (process.platform === 'win32') {
        await execPromise(`start "" "${tempFilePath}"`);
      }
      else {
        throw new Error(`Unsupported platform: ${process.platform}`);
      }
      
      // 一時ファイルを削除
      await fs.unlink(tempFilePath);
      
    } catch (err) {
      console.error('Error playing audio:', err);
      // 一時ファイルの削除を試みる
      try {
        await fs.unlink(tempFilePath);
      } catch (e) {
        // 削除に失敗しても無視
        console.error('Error deleting temp file:', e);
      }
      throw err;
    }
  }
}
