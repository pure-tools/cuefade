import { Injectable, signal, computed, inject } from '@angular/core';
import { Track } from '../interfaces/track';
import { SessionStorageService } from './session-storage.service';

const STORAGE_KEY = 'cuefade_queue';

@Injectable({ providedIn: 'root' })
export class QueueService {
  private session = inject(SessionStorageService);

  readonly tracks = signal<Track[]>([]);
  readonly currentIndex = signal<number>(0);
  readonly playlistTitle = signal<string>('');
  readonly nextIndex = computed(() => this.currentIndex() + 1);

  readonly currentTrack = computed(() => this.tracks()[this.currentIndex()] ?? null);

  constructor() {
    this.restoreSession();
    this.persistSession();
  }

  private restoreSession(): void {
    const saved = this.session.load<{ tracks: Track[]; currentIndex: number }>(STORAGE_KEY);
    if (saved?.tracks?.length) {
      this.tracks.set(saved.tracks);
      this.currentIndex.set(saved.currentIndex ?? 0);
    }
  }

  private persistSession(): void {
    this.session.watch(STORAGE_KEY, () => {
      const tracks = this.tracks();
      return tracks.length ? { tracks, currentIndex: this.currentIndex() } : null;
    });
  }
  readonly nextTrack = computed(() => this.tracks()[this.nextIndex()] ?? null);
  readonly hasNext = computed(() => this.nextIndex() < this.tracks().length);

  setTracks(tracks: Track[], title?: string): void {
    this.tracks.set(tracks);
    this.currentIndex.set(0);
    if (title !== undefined) this.playlistTitle.set(title);
  }

  addTracks(tracks: Track[]): void {
    this.tracks.update(t => [...t, ...tracks]);
  }

  /** CDK drop event result → reorder */
  moveTrack(from: number, to: number): void {
    this.tracks.update(list => {
      const arr = [...list];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }

  /** Insert a new track at a specific position (after afterIndex) */
  insertAt(afterIndex: number, track: Track): void {
    this.tracks.update(list => {
      const arr = [...list];
      arr.splice(afterIndex + 1, 0, track);
      return arr;
    });
  }

  /** Insert track right after current position */
  playNext(index: number): void {
    this.tracks.update(list => {
      const arr = [...list];
      const [item] = arr.splice(index, 1);
      const insertAt = this.currentIndex() + 1;
      arr.splice(insertAt, 0, item);
      return arr;
    });
  }

  updateCuePoints(index: number, cueIn?: number, cueOut?: number): void {
    this.tracks.update(list => {
      const arr = [...list];
      arr[index] = { ...arr[index], cueIn, cueOut };
      return arr;
    });
  }

  advance(): void {
    if (this.hasNext()) {
      this.currentIndex.update(i => i + 1);
    }
  }

  reset(): void {
    this.tracks.set([]);
    this.currentIndex.set(0);
  }
}
