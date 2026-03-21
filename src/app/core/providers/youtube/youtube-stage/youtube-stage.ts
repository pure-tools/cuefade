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

  activeSlot = signal<PlayerSlot>('A');

  // Add-track overlay state
  showAddInput = signal(false);
  addUrl = '';
  addingTrack = signal(false);
  addError = signal('');

  /**
   * CrossfadeService uses opacityA = active track, opacityB = incoming track.
   * After each fade the active slot alternates (A→B→A…), so we must swap
   * which physical player div receives which opacity value.
   */
  readonly opacityForA = computed(() =>
    this.activeSlot() === 'A' ? this.crossfade.opacityA() : this.crossfade.opacityB()
  );
  readonly opacityForB = computed(() =>
    this.activeSlot() === 'B' ? this.crossfade.opacityA() : this.crossfade.opacityB()
  );

  private subs: Subscription[] = [];

  constructor() {
    this.registerPreloadEffect();
    this.registerVolumeEffects();
  }

  /** Reload the hidden player whenever the next track changes (drag-drop reorder). */
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

  /** Keep both player volumes in sync with the crossfade animation (runs every rAF frame). */
  private registerVolumeEffects(): void {
    effect(() => this.ytPlayer.setVolume(this.activeSlot(), this.crossfade.volumeA()));
    effect(() => this.ytPlayer.setVolume(this.hiddenSlot(), this.crossfade.volumeB()));
  }

  private hiddenSlot(): PlayerSlot {
    return this.activeSlot() === 'A' ? 'B' : 'A';
  }

  ngOnInit(): void {
    Promise.all([
      this.ytPlayer.createPlayer('A', 'yt-player-a'),
      this.ytPlayer.createPlayer('B', 'yt-player-b'),
    ]).then(() => {
      this.loadCurrentTrack();
      this.preloadNext();
      this.ytPlayer.startPolling();
    });

    // Drive crossfade timing from active player's time updates
    this.subs.push(
      this.ytPlayer.timeUpdate$.subscribe(ev => {
        if (ev.slot === this.activeSlot()) {
          this.crossfade.onTimeUpdate(ev.currentTime, ev.duration);
        }
      })
    );

    this.subs.push(
      this.crossfade.crossfadeEvents$.subscribe(ev => {
        if (ev.type === 'started') {
          // Start the hidden player now — it was only cued, not playing
          this.ytPlayer.play(this.hiddenSlot());
        }
        if (ev.type === 'completed') {
          // Hidden slot becomes the new active slot
          this.activeSlot.set(this.hiddenSlot());
          this.preloadNext();
        }
      })
    );
  }

  private loadCurrentTrack(): void {
    const track = this.queue.currentTrack();
    if (!track) return;
    const slot = this.activeSlot();
    this.ytPlayer.setVolume(slot, 100);
    this.ytPlayer.playTrack(slot, track.id, track.cueIn ?? 0);
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
    this.ytPlayer.stopPolling();
    this.subs.forEach(s => s.unsubscribe());
  }
}
