import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Track } from '../../../../core/interfaces/track';

@Component({
  selector: 'app-cue-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cue-editor.html',
  styleUrl: './cue-editor.css',
})
export class CueEditorComponent {
  track = input.required<Track>();
  index = input.required<number>();
  cueChange = output<{ index: number; cueIn?: number; cueOut?: number }>();

  cueIn = 0;
  cueOut = 0;
  maxSeconds = 600;

  constructor() {
    effect(() => {
      const t = this.track();
      this.cueIn = t?.cueIn ?? 0;
      this.cueOut = t?.cueOut ?? (t?.duration ?? 300);
      this.maxSeconds = t?.duration ?? 600;
    });
  }

  onCueInChange(val: string): void {
    this.cueIn = +val;
    this.emit();
  }

  onCueOutChange(val: string): void {
    this.cueOut = +val;
    this.emit();
  }

  private emit(): void {
    this.cueChange.emit({
      index: this.index(),
      cueIn: this.cueIn || undefined,
      cueOut: this.cueOut || undefined,
    });
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
