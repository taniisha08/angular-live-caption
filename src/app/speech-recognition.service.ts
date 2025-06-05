// --- speech-recognition.service.ts ---
import { Injectable, NgZone } from '@angular/core';

type WebkitSpeechRecognition = typeof window.webkitSpeechRecognition;
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  recognition: any;
  isListening = false;
  interimTranscript = '';
  finalTranscript = '';
  private lastResultTimestamp = Date.now();
  private isRestarting = false;
  private fallbackTimer: any;

  constructor(private zone: NgZone) {
    console.log('[Init] Initializing SpeechRecognitionService...');
    this.createRecognitionInstance();
  }

  private createRecognitionInstance() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.attachRecognitionHandlers();
  }

  private attachRecognitionHandlers() {
    this.recognition.onresult = (event: any) => {
      this.lastResultTimestamp = Date.now();

      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      this.zone.run(() => {
        this.interimTranscript = interim;
        if (final) {
          console.log('[Recognition] Final transcript:', final);
          this.finalTranscript += final + '\n';
        }
      });
    };

    this.recognition.onerror = (event: any) => {
      console.error('[Recognition] Error occurred:', event);
      if (this.isListening && event.error !== 'aborted') {
        console.warn('[Recognition] Restarting after error:', event.error);
        setTimeout(() => this.restartRecognition(), 500);
      }
    };

    this.recognition.onend = () => {
      if (this.isRestarting) {
        console.log('[Recognition] Skipping onend due to manual restart.');
        return;
      }
      console.warn('[Recognition] Recognition ended. Checking if we should restart...');
      if (this.isListening) {
        console.log('[Recognition] Auto-restarting recognition...');
        this.restartRecognition();
      }
    };
  }

  async start() {
    console.log('[SpeechRecognition] Requesting microphone access...');
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      console.log('[SpeechRecognition] Microphone access granted. Starting recognition...');
      this.isListening = true;
      this.recognition.start();

      this.fallbackTimer = setInterval(() => {
        if (!this.isListening) return;
        const now = Date.now();
        if (now - this.lastResultTimestamp > 20000) {
          console.warn('[Fallback] Forcing restart due to extended silence.');
          this.restartRecognition();
        }
      }, 30000);

    } catch (error) {
      console.error('[SpeechRecognition] Microphone access denied:', error);
    }
  }

  stop() {
    console.log('[SpeechRecognition] Stopping recognition...');
    this.isListening = false;
    this.recognition.stop();
    clearInterval(this.fallbackTimer);
  }

  private restartRecognition() {
    if (this.isRestarting) return;
    this.isRestarting = true;

    try {
      console.warn('[Recognition] Hard resetting SpeechRecognition instance...');
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition.abort();

      setTimeout(() => {
        if (this.isListening) {
          this.createRecognitionInstance();
          this.recognition.start();
          this.lastResultTimestamp = Date.now();
          console.log('[Recognition] Restarted fresh SpeechRecognition instance.');
        }
        this.isRestarting = false;
      }, 300);

    } catch (err) {
      console.error('[Recognition] Failed to restart:', err);
      this.isRestarting = false;
    }
  }
}
