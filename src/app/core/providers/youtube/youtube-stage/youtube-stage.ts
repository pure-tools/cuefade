import {
  Component, OnInit, OnDestroy, effect, inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { YouTubePlayerService, PlayerSlot } from '../youtube-player.service';
import { CrossfadeService } from '../../../services/crossfade.service';
import { QueueService } from '../../../services/queue.service';
import { ProviderRegistryService } from '../../../services/provider-registry.service';

@Component({
  selector: 'app-youtube-stage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './youtube-stage.html',
  styleUrl: './youtube-stage.css',
})
export class YouTubeStageComponent implements OnInit, OnDestroy {
  private ytPlayer = inject(YouTubePlayerService);
  readonly crossfade = inject(CrossfadeService);
  private queue = inject(QueueService);
  private registry = inject(ProviderRegistryService);

  // Add-track overlay state
  showAddInput = signal(false);
  addUrl = '';
  addingTrack = signal(false);
  addError = signal('');

  /**
   * CrossfadeService uses opacityA = active track, opacityB = incoming track.
   * activeSlot lives in the service so it survives route navigation.
   */
  readonly opacityForA = computed(() =>
    this.ytPlayer.activeSlot() === 'A' ? this.crossfade.opacityA() : this.crossfade.opacityB()
  );
  readonly opacityForB = computed(() =>
    this.ytPlayer.activeSlot() === 'B' ? this.crossfade.opacityA() : this.crossfade.opacityB()
  );

  private subs: Subscription[] = [];

  constructor() {
    this.registerPreloadEffect();
    this.registerVolumeEffects();
  }

  private registerPreloadEffect(): void {
    effect(() => {
      const next = this.queue.nextTrack();
      const hidden = this.hiddenSlot();
      if (next) {
        this.ytPlayer.loadTrack(hidden, next.id, next.cueIn ?? 0);
        this.ytPlayer.setVolume(hidden, 0);
      }
    });
  }

  private registerVolumeEffects(): void {
    effect(() => this.ytPlayer.setVolume(this.ytPlayer.activeSlot(), this.crossfade.volumeA()));
    effect(() => this.ytPlayer.setVolume(this.hiddenSlot(), this.crossfade.volumeB()));
  }

  private hiddenSlot(): PlayerSlot {
    return this.ytPlayer.activeSlot() === 'A' ? 'B' : 'A';
  }

  ngOnInit(): void {
    Promise.all([
      this.ytPlayer.createPlayer('A', 'yt-player-a'),
      this.ytPlayer.createPlayer('B', 'yt-player-b'),
    ]).then(() => {
      if (this.ytPlayer.resumeTime === null) {
        this.ytPlayer.activeSlot.set('A');
      }
      this.loadCurrentTrack();
      this.preloadNext();
      this.ytPlayer.startPolling();
    });

    this.subs.push(
      this.ytPlayer.timeUpdate$.subscribe(ev => {
        if (ev.slot === this.ytPlayer.activeSlot()) {
          this.crossfade.onTimeUpdate(ev.currentTime, ev.duration);
        }
      })
    );

    this.subs.push(
      this.crossfade.crossfadeEvents$.subscribe(ev => {
        if (ev.type === 'started') {
          this.ytPlayer.play(this.hiddenSlot());
        }
        if (ev.type === 'completed') {
          this.ytPlayer.activeSlot.set(this.hiddenSlot());
          this.preloadNext();
        }
      })
    );
  }

  private loadCurrentTrack(): void {
    const track = this.queue.currentTrack();
    if (!track) return;
    const slot = this.ytPlayer.activeSlot();
    const startAt = this.ytPlayer.resumeTime ?? track.cueIn ?? 0;
    this.ytPlayer.resumeTime = null;
    this.ytPlayer.setVolume(slot, 100);
    this.ytPlayer.playTrack(slot, track.id, startAt);
  }

  private preloadNext(): void {
    const next = this.queue.nextTrack();
    if (!next) return;
    this.ytPlayer.loadTrack(this.hiddenSlot(), next.id, next.cueIn ?? 0);
    this.ytPlayer.setVolume(this.hiddenSlot(), 0);
  }

  insertTrack(): void {
    const url = this.addUrl.trim();
    if (!url) return;
    const provider = this.registry.resolve(url);
    if (!provider) {
      this.addError.set('Unsupported URL — only YouTube links are supported in v1');
      return;
    }
    this.addingTrack.set(true);
    this.addError.set('');
    provider.fetchTrack(url).subscribe({
      next: track => {
        this.queue.insertAt(this.queue.currentIndex(), track);
        this.showAddInput.set(false);
        this.addUrl = '';
        this.addingTrack.set(false);
      },
      error: (e: Error) => {
        this.addError.set(e.message ?? 'Failed to load track');
        this.addingTrack.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.ytPlayer.savePlaybackState();
    this.ytPlayer.stopPolling();
    this.subs.forEach(s => s.unsubscribe());
  }
}
