import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Track } from '../../../../core/interfaces/track';
import { CueEditorComponent } from '../cue-editor/cue-editor';

@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [CommonModule, CueEditorComponent],
  templateUrl: './track-card.html',
  styleUrl: './track-card.css',
})
export class TrackCardComponent {
  track = input.required<Track>();
  index = input.required<number>();
  isCurrent = input(false);
  isNext = input(false);

  playNext = output<number>();
  cueChange = output<{ index: number; cueIn?: number; cueOut?: number }>();

  expanded = signal(false);

  toggleExpand(): void {
    this.expanded.update(v => !v);
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
