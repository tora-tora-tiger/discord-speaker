import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';

type TalkOptions = {
  speaker: string;
  volume: string;
  speed: string;
  tone: string;
};

type Params = {
  host: string;
  port: number;
};

export default class Talk {
  host: string;
  port: number;

  voice: string;
  volume: string;
  speed: string;
  tone: string;

  constructor(params: Params = {
    host: 'localhost',
    port: 50080
  }, options: TalkOptions = {
    speaker: '1',
    volume: '-1',
    speed: '-1',
    tone: '-1'
  }) {
    this.host   = params.host
    this.port   = params.port;
    this.voice  = options.speaker;
    this.volume = options.volume;
    this.speed  = options.speed;
    this.tone   = options.tone;
  }

  setHost(host: string): void {
    this.host = host;
  }
  setPort(port: number): void {
    this.port = port;
  }
  setVoice(voice: string): void {
    this.voice = voice;
  }
  setVolume(volume: string): void {  
    this.volume = volume;
  }
  setSpeed(speed: string): void {
    this.speed = speed;
  }
  setTone(tone: string): void {
    this.tone = tone;
  }

  private async request(url: URL, option: RequestInit): Promise<Response | undefined> {
    try {
      const response = await fetch(url.toString(), option);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
    }
    return undefined;
  }
  
  // voicboxを利用
  async voiceboxTalk(
    text: string,
    options: TalkOptions = {
      speaker: this.voice,
      volume: this.volume,
      speed: this.speed,
      tone: this.tone
    } 
  ): Promise<ArrayBuffer | undefined> {
    // クエリ生成
    const query_url = new URL(`http://${this.host}:${this.port}/audio_query`);
    query_url.search = new URLSearchParams({
      text: text,
      speaker: options.speaker // Python版ではspeakerというパラメータ名を使用
    }).toString();
  
    const query_response = await this.request(query_url, {method: 'POST'});
    
    if (!query_response) {
      console.error('Failed to get audio query response');
      return;
    }
  
    const query_json = await query_response.json();
    
    // 音声合成
    const synthesis_url = new URL(`http://${this.host}:${this.port}/synthesis`);
    synthesis_url.search = new URLSearchParams({
      text: text,
      speaker: options.speaker
    }).toString();
  
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const synthesis_response = await this.request(synthesis_url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query_json)
    });
  
    if (!synthesis_response) {
      console.error('Failed to get synthesis response');
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
