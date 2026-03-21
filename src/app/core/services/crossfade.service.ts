import { Injectable, signal, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { QueueService } from './queue.service';

export interface CrossfadeEvent {
  type: 'started' | 'completed';
  fromIndex: number;
  toIndex: number;
}

/** easeInOutSine — smooth DJ crossfade curve */
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

@Injectable({ providedIn: 'root' })
export class CrossfadeService implements OnDestroy {
  /** Crossfade duration in seconds */
  readonly transitionDuration = signal<number>(20);

  /** Volume A (active player) 0–100 */
  readonly volumeA = signal<number>(100);
  /** Volume B (next player) 0–100 */
  readonly volumeB = signal<number>(0);
  /** Opacity A 0–1 */
  readonly opacityA = signal<number>(1);
  /** Opacity B 0–1 */
  readonly opacityB = signal<number>(0);

  readonly crossfadeEvents$ = new Subject<CrossfadeEvent>();

  private rafId: number | null = null;
  private startTime: number | null = null;
  private isFading = false;
  private timeSubscription: Subscription | null = null;
  /** Volume level of the active player at the moment crossfade began */
  private startVolume = 100;

  constructor(private queue: QueueService) {}

  /**
   * Called every tick from the active player's currentTime$.
   * Checks whether it is time to start the crossfade.
   */
  onTimeUpdate(currentTime: number, duration: number): void {
    if (this.isFading || !this.queue.hasNext()) return;
    const track = this.queue.currentTrack();
    const cueOut = track?.cueOut;
    const triggerAt = cueOut != null
      ? cueOut
      : Math.max(0, duration - this.transitionDuration());

    if (duration > 0 && currentTime >= triggerAt) {
      this.startCrossfade();
    }
  }

  startCrossfade(): void {
    if (this.isFading || !this.queue.hasNext()) return;
    this.isFading = true;
    this.startTime = null;
    // Capture current volume so fade starts from wherever A actually is,
    // and B rises to that same ceiling (not always 100)
    this.startVolume = this.volumeA();
    const fromIndex = this.queue.currentIndex();
    const toIndex = this.queue.nextIndex();
    this.crossfadeEvents$.next({ type: 'started', fromIndex, toIndex });
    this.tick();
  }

  private tick(): void {
    const durationMs = this.transitionDuration() * 1000;
    this.rafId = requestAnimationFrame(now => {
      if (this.startTime === null) this.startTime = now;
      const elapsed = now - this.startTime;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = easeInOutSine(t);

      this.volumeA.set(Math.round((1 - eased) * this.startVolume));
      this.volumeB.set(Math.round(eased * this.startVolume));
      this.opacityA.set(1 - eased);
      this.opacityB.set(eased);

      if (t < 1) {
        this.tick();
      } else {
        this.completeCrossfade();
      }
    });
  }

  private completeCrossfade(): void {
    const fromIndex = this.queue.currentIndex();
    const toIndex = this.queue.nextIndex();
    this.queue.advance();
    // B becomes A — restore to the volume level that was active before the fade
    this.volumeA.set(this.startVolume);
    this.volumeB.set(0);
    this.opacityA.set(1);
    this.opacityB.set(0);
    this.isFading = false;
    this.startTime = null;
    this.crossfadeEvents$.next({ type: 'completed', fromIndex, toIndex });
  }

  /** Cancel an in-progress fade (e.g. queue reordered) */
  cancelFade(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isFading = false;
    this.startTime = null;
    this.volumeA.set(100);
    this.volumeB.set(0);
    this.opacityA.set(1);
    this.opacityB.set(0);
  }

  setTransitionDuration(seconds: number): void {
    this.transitionDuration.set(seconds);
  }

  ngOnDestroy(): void {
    this.cancelFade();
    this.timeSubscription?.unsubscribe();
    this.crossfadeEvents$.complete();
  }
}
