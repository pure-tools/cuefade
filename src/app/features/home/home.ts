import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { QueueService } from '../../core/services/queue.service';
import { SessionStorageService } from '../../core/services/session-storage.service';
import { Track } from '../../core/interfaces/track';
import { HomeHeaderComponent } from './components/home-header/home-header';
import { UrlInputComponent, PlaylistLoadedEvent } from './components/url-input/url-input';
import { TrackPickerComponent } from './components/track-picker/track-picker';
import { PricingModalComponent } from './components/pricing-modal/pricing-modal';
import { AuthModalComponent } from '../auth/auth-modal/auth-modal';
import { AuthService } from '../../core/services/auth.service';

const HOME_SESSION_KEY = 'cuefade_home';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HomeHeaderComponent, UrlInputComponent, TrackPickerComponent, PricingModalComponent, AuthModalComponent],
  templateUrl: './home.html',
  host: { class: 'block' },
})
export class HomeComponent {
  private queue = inject(QueueService);
  private router = inject(Router);
  private session = inject(SessionStorageService);
  private titleService = inject(Title);
  readonly auth = inject(AuthService);

  tracks = signal<Track[]>([]);
  playlistTitle = signal('');
  selectedIds = signal<Set<string>>(new Set());
  showPricing = signal(false);
  showAuth = signal(false);
  restoredUrl = signal('');

  readonly featureCards = [
    { icon: '🔀', title: 'Smooth Crossfade', desc: 'easeInOutSine volume + opacity blend from 4 to 20 seconds.', pro: false },
    { icon: '🎚', title: 'Drag-Drop Queue', desc: 'Reorder your setlist live during a mix. The next track preloads instantly.', pro: false },
    { icon: '⏱', title: 'Per-Track Cue Points', desc: 'Set Cue In to skip intros and Cue Out to trigger the fade at exactly the right moment.', pro: true },
  ];

  constructor() {
    this.restorePlaylistSession();
    this.persistPlaylistSession();
    this.checkUpgradeReturn();
  }

  private checkUpgradeReturn(): void {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === '1') {
      this.auth.refreshProfile();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  onPlaylistLoaded(event: PlaylistLoadedEvent): void {
    this.restoredUrl.set(event.url);
    this.playlistTitle.set(event.title);
    this.tracks.set(event.tracks);
    if (event.title) {
      this.titleService.setTitle(`${event.title} — CueFade`);
    }
    this.selectedIds.set(new Set(
      event.tracks.filter(t => t.embeddable !== false).map(t => t.id)
    ));
  }

  onClear(): void {
    this.tracks.set([]);
    this.selectedIds.set(new Set());
    this.playlistTitle.set('');
    this.restoredUrl.set('');
    this.titleService.setTitle('CueFade — Create Your Own Mix');
  }

  onSelectionChange(ids: Set<string>): void {
    this.selectedIds.set(ids);
  }

  onStartMix(tracks: Track[]): void {
    this.queue.setTracks(tracks, this.playlistTitle());
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
