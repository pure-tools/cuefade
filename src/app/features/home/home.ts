import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QueueService } from '../../core/services/queue.service';
import { SessionStorageService } from '../../core/services/session-storage.service';
import { Track } from '../../core/interfaces/track';
import { HomeHeaderComponent } from './components/home-header/home-header';
import { UrlInputComponent, PlaylistLoadedEvent } from './components/url-input/url-input';
import { TrackPickerComponent } from './components/track-picker/track-picker';
import { PricingModalComponent } from './components/pricing-modal/pricing-modal';

const HOME_SESSION_KEY = 'cuefade_home';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HomeHeaderComponent, UrlInputComponent, TrackPickerComponent, PricingModalComponent],
  templateUrl: './home.html',
  host: { class: 'block' },
})
export class HomeComponent {
  private queue = inject(QueueService);
  private router = inject(Router);
  private session = inject(SessionStorageService);

  tracks = signal<Track[]>([]);
  playlistTitle = signal('');
  selectedIds = signal<Set<string>>(new Set());
  showPricing = signal(false);
  restoredUrl = signal('');

  readonly featureCards = [
    { icon: '🔀', title: 'Smooth Crossfade', desc: 'easeInOutSine volume + opacity blend from 4 to 20 seconds.', pro: false },
    { icon: '🎚', title: 'Drag-Drop Queue', desc: 'Reorder your setlist live during a mix. The next track preloads instantly.', pro: false },
    { icon: '⏱', title: 'Per-Track Cue Points', desc: 'Set Cue In to skip intros and Cue Out to trigger the fade at exactly the right moment.', pro: true },
  ];

  constructor() {
    this.restorePlaylistSession();
    this.persistPlaylistSession();
  }

  onPlaylistLoaded(event: PlaylistLoadedEvent): void {
    this.restoredUrl.set(event.url);
    this.playlistTitle.set(event.title);
    this.tracks.set(event.tracks);
    this.selectedIds.set(new Set(
      event.tracks.filter(t => t.embeddable !== false).map(t => t.id)
    ));
  }

  onClear(): void {
    this.tracks.set([]);
    this.selectedIds.set(new Set());
    this.playlistTitle.set('');
    this.restoredUrl.set('');
  }

  onSelectionChange(ids: Set<string>): void {
    this.selectedIds.set(ids);
  }

  onStartMix(tracks: Track[]): void {
    this.queue.setTracks(tracks);
    this.router.navigate(['/player']);
  }

  private restorePlaylistSession(): void {
    const saved = this.session.load<{
      url: string; playlistTitle: string; tracks: Track[]; selectedIds: string[];
    }>(HOME_SESSION_KEY);
    if (saved?.tracks?.length) {
      this.restoredUrl.set(saved.url ?? '');
      this.playlistTitle.set(saved.playlistTitle ?? '');
      this.tracks.set(saved.tracks);
      this.selectedIds.set(new Set(saved.selectedIds ?? []));
    }
  }

  private persistPlaylistSession(): void {
    this.session.watch(HOME_SESSION_KEY, () => {
      const tracks = this.tracks();
      return tracks.length ? {
        url: this.restoredUrl(),
        playlistTitle: this.playlistTitle(),
        tracks,
        selectedIds: [...this.selectedIds()],
      } : null;
    });
  }
}
