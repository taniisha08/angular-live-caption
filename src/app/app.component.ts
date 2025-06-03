import { Component, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { SpeechRecognitionService } from './speech-recognition.service';
import { MicLevelService } from './mic-level.service.service';
import { Subscription } from 'rxjs';

interface CaptionEntry {
  time: string;
  text: string;
  speaker: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  @ViewChild('video') videoRef!: ElementRef;
  captions: CaptionEntry[] = [];
  speakerLabel = 'Candidate'; // Change to 'Interviewer' if applicable
  micLevel = 0;
  private micSub!: Subscription;

  constructor(
    public speechService: SpeechRecognitionService,
    // private micLevelService: MicLevelService
  ) {}

  ngOnInit() {
    console.log('[App] Component initialized. Starting caption polling...');
    // this.micLevelService.init();
    // this.micSub = this.micLevelService.micLevel$.subscribe(level => this.micLevel = level);

    setInterval(() => {
      const final = this.speechService.finalTranscript.trim();
      if (final) {
        const caption: CaptionEntry = {
          time: new Date().toLocaleTimeString(),
          text: final,
          speaker: this.speakerLabel
        };
        console.log('[App] New caption pushed:', caption);
        this.captions.push(caption);
        this.speechService.finalTranscript = '';
      }
    }, 1000);
  }

  ngAfterViewInit() {
    console.log('[App] Initializing video stream...');
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        console.log('[App] Webcam stream acquired.');
        this.videoRef.nativeElement.srcObject = stream;
      })
      .catch(err => console.error('[App] Webcam access error:', err));
  }

  toggleRecognition() {
    if (this.speechService.isListening) {
      console.log('[App] Toggling speech recognition: STOP');
      this.speechService.stop();
    } else {
      console.log('[App] Toggling speech recognition: START');
      this.speechService.start();
    }
  }

  ngOnDestroy() {
    // if (this.micSub) this.micSub.unsubscribe();
    // this.micLevelService.stop();
  }
}