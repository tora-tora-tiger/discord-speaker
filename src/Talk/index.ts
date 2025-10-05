import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';

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

export default class Talk {
  host: string;
  port: string;

  speaker: string
  speedScale: string;
  pitchScale: string;
  intonationScale: string
  volumeScale: string;
  kana: boolean;

  constructor(params: Params, options: TalkOptions) {
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

  private async request(url: URL, option: RequestInit): Promise<Response | undefined> {
    try {
      console.log('[Talk] Requesting:', url.toString());
      const response = await fetch(url.toString(), option);
      if (!response.ok) {
        throw new Error('[Talk] Network response was not ok');
      }
      return response;
    } catch (error) {
      console.error('[Talk] Fetch error:', error);
    }
    return undefined;
  }
  
  // voicboxを利用
  async voiceboxTalk(
    text: string,
    options: TalkOptions = {}
  ): Promise<ArrayBuffer | undefined> {
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
  
    const query_response = await this.request(query_url, {method: 'POST'});
    
    if (!query_response) {
      console.error('[Talk] Failed to get audio query response');
      return;
    }
  
    const query_json = await query_response.json();

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
    
    const synthesis_response = await this.request(synthesis_url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query_json)
    });
  
    if (!synthesis_response) {
      console.error('[Talk] Failed to get synthesis response');
      return;
    }
  
    // ArrayBufferとして音声データを取得
    const audioData = await synthesis_response.arrayBuffer();
    
    // AudioContextを使用して音声を再生
    // await this.playAudio(audioData);

    return audioData;
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
