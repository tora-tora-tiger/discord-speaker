import * as wav from 'node-wav';
import Speaker from 'speaker';
import { Readable } from 'stream';

type TalkOptions = {
  voice: string;
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
    voice: '0',
    volume: '-1',
    speed: '-1',
    tone: '-1'
  }) {
    this.host   = params.host
    this.port   = params.port;
    this.voice  = options.voice;
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
      voice: this.voice,
      volume: this.volume,
      speed: this.speed,
      tone: this.tone
    } 
  ): Promise<void> {
    const query_url = new URL(`http://${this.host}:${this.port}/audio_query`);
    query_url.search = new URLSearchParams({
      text: text,
      speaker: options.voice // Python版ではspeakerというパラメータ名を使用
    }).toString();
  
    console.log(query_url.toString());
  
    const query_response = await this.request(query_url, {method: 'POST'});
    
    if (!query_response) {
      console.error('Failed to get audio query response');
      return;
    }
  
    const query_json = await query_response.json();
    
    const synthesis_url = new URL(`http://${this.host}:${this.port}/synthesis`);
    synthesis_url.search = new URLSearchParams({
      text: text,
      speaker: options.voice
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
    await this.playAudio(audioData);
  }
  
  private async playAudio(audioData: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // WAVデータをデコード
        const decoded = wav.decode(Buffer.from(audioData));
        
        // Speakerのオプションを設定
        const speakerOptions = {
          channels: decoded.channelData.length,
          bitDepth: 16,
          sampleRate: decoded.sampleRate
        };
        
        // Speakerインスタンスを作成
        const speaker = new Speaker(speakerOptions);
        
        // 完了時のイベント
        speaker.on('close', () => {
          resolve();
        });
        
        // エラー処理
        speaker.on('error', (err) => {
          reject(err);
        });
        
        // PCMデータをバッファに変換
        const bufferData = Buffer.alloc(decoded.channelData[0].length * 2 * decoded.channelData.length);
        
        let offset = 0;
        // インターリーブされたPCMデータを作成
        for (let i = 0; i < decoded.channelData[0].length; i++) {
          for (let channel = 0; channel < decoded.channelData.length; channel++) {
            const sample = Math.max(-1, Math.min(1, decoded.channelData[channel][i]));
            const sampleInt = Math.floor(sample < 0 ? sample * 32768 : sample * 32767);
            bufferData.writeInt16LE(sampleInt, offset);
            offset += 2;
          }
        }
        
        // ストリームを作成して再生
        const readable = new Readable();
        readable._read = () => {};
        readable.push(bufferData);
        readable.push(null);
        readable.pipe(speaker);
        
      } catch (err) {
        reject(err);
      }
    });
  }
}
