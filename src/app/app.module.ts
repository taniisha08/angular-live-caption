import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { SpeechRecognitionService } from './speech-recognition.service';
import { MicLevelService } from './mic-level.service.service';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [SpeechRecognitionService, MicLevelService],
  bootstrap: [AppComponent]
})
export class AppModule {}