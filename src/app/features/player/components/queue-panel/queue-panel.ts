import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, CdkDrag, CdkDropList, CdkDragPlaceholder, moveItemInArray } from '@angular/cdk/drag-drop';
import { QueueService } from '../../../../core/services/queue.service';
import { CrossfadeService } from '../../../../core/services/crossfade.service';
import { ProviderRegistryService } from '../../../../core/services/provider-registry.service';
import { TrackCardComponent } from '../track-card/track-card';
import { Track } from '../../../../core/interfaces/track';

@Component({
  selector: 'app-queue-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkDrag, CdkDropList, CdkDragPlaceholder, TrackCardComponent],
  templateUrl: './queue-panel.html',
  styleUrl: './queue-panel.css',
})
export class QueuePanelComponent {
  readonly queue = inject(QueueService);
  private crossfade = inject(CrossfadeService);
  private registry = inject(ProviderRegistryService);

  insertOpenAt = signal<number | null>(null);
  insertUrl = '';
  insertError = signal('');

  onDrop(event: CdkDragDrop<Track[]>): void {
    const tracks = [...this.queue.tracks()];
    moveItemInArray(tracks, event.previousIndex, event.currentIndex);
    const prevNextId = this.queue.nextTrack()?.id;
    this.queue.setTracks(tracks);
    const newNextId = this.queue.nextTrack()?.id;
    if (prevNextId !== newNextId) {
      this.crossfade.cancelFade();
    }
  }

  onPlayNext(index: number): void {
    this.queue.playNext(index);
  }

  onCueChange(event: { index: number; cueIn?: number; cueOut?: number }): void {
    this.queue.updateCuePoints(event.index, event.cueIn, event.cueOut);
  }

  openInsert(index: number): void {
    this.insertOpenAt.set(index);
    this.insertUrl = '';
    this.insertError.set('');
  }

  cancelInsert(): void {
    this.insertOpenAt.set(null);
    this.insertUrl = '';
    this.insertError.set('');
  }

  confirmInsert(): void {
    const url = this.insertUrl.trim();
    const afterIndex = this.insertOpenAt();
    if (!url || afterIndex === null) return;

    const provider = this.registry.resolve(url) ?? this.registry.getByType('youtube');
    if (!provider) {
      this.insertError.set('Unsupported URL');
      return;
    }

    this.insertError.set('');
    provider.fetchTrack(url).subscribe({
      next: (track: Track) => {
        this.queue.insertAt(afterIndex, track);
        this.cancelInsert();
      },
      error: (e: Error) => {
        this.insertError.set(e.message ?? 'Failed to load track');
      },
    });
  }
}
