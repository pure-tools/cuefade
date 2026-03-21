import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Track } from '../../../../core/interfaces/track';

@Component({
  selector: 'app-track-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-picker.html',
})
export class TrackPickerComponent {
  tracks = input<Track[]>([]);
  playlistTitle = input('');
  selectedIds = input<Set<string>>(new Set());

  selectionChange = output<Set<string>>();
  startMix = output<Track[]>();

  get embeddableCount(): number {
    return this.tracks().filter(t => t.embeddable !== false).length;
  }

  get allSelected(): boolean {
    return this.selectedIds().size === this.embeddableCount;
  }

  toggleTrack(id: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectionChange.emit(next);
  }

  toggleAll(): void {
    if (this.allSelected) {
      this.selectionChange.emit(new Set());
    } else {
      this.selectionChange.emit(
        new Set(this.tracks().filter(t => t.embeddable !== false).map(t => t.id))
      );
    }
  }

  onStartMix(): void {
    const selected = this.tracks().filter(t => this.selectedIds().has(t.id));
    if (selected.length === 0) return;
    this.startMix.emit(selected);
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
