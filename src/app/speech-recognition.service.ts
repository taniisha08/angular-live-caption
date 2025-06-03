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

  constructor(private zone: NgZone) {
    console.log('[Init] Initializing SpeechRecognitionService...');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      // console.log('[Recognition] Result received:', event);
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
    };

    this.recognition.onend = () => {
      console.warn('[Recognition] Service stopped. Restarting if listening...');
      if (this.isListening) {
        console.log('[Recognition] Restarting recognition...');
        this.recognition.start();
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
    } catch (error) {
      console.error('[SpeechRecognition] Microphone access denied:', error);
    }
  }

  stop() {
    console.log('[SpeechRecognition] Stopping recognition...');
    this.isListening = false;
    this.recognition.stop();
  }
}