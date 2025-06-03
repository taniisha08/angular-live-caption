import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MicLevelService {
  private audioContext!: AudioContext;
  private analyser!: AnalyserNode;
  private dataArray!: Uint8Array;
  private source!: MediaStreamAudioSourceNode;
  private stream!: MediaStream;
  private rafId!: number;
  public micLevel$ = new BehaviorSubject<number>(0);

  async init() {
    try {
      this.audioContext = new AudioContext();

      // Must resume context in some browsers (especially Chrome)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('[MicLevel] AudioContext resumed.');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.source = this.audioContext.createMediaStreamSource(this.stream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.dataArray = new Uint8Array(this.analyser.fftSize);

      this.source.connect(this.analyser);
      this.updateMicLevel();
      console.log('[MicLevel] Initialized and listening.');
    } catch (err) {
      console.error('[MicLevel] Failed to initialize:', err);
    }
  }

  private updateMicLevel() {
    this.analyser.getByteTimeDomainData(this.dataArray);

    // Calculate RMS volume
    let sumSquares = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const normalized = (this.dataArray[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / this.dataArray.length);
    const level = Math.min(100, Math.round(rms * 200)); // Scale to 0–100

    this.micLevel$.next(level);
    this.rafId = requestAnimationFrame(() => this.updateMicLevel());
  }

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) this.audioContext.close();
    console.log('[MicLevel] Stopped.');
  }
}
