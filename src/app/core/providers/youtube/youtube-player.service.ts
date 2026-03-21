import { Injectable, NgZone, OnDestroy, signal } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { PlayerState } from '../../interfaces/embed-player';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

/** Slot identifier for the two players */
export type PlayerSlot = 'A' | 'B';

export interface PlayerTimeEvent {
  slot: PlayerSlot;
  currentTime: number;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class YouTubePlayerService implements OnDestroy {
  private players: Partial<Record<PlayerSlot, YT.Player>> = {};
  private apiReady = false;
  private apiReadyCallbacks: (() => void)[] = [];

  readonly timeUpdate$ = new Subject<PlayerTimeEvent>();
  readonly stateChange$ = new Subject<{ slot: PlayerSlot; state: PlayerState }>();
  readonly isPlaying = signal(false);

  private rafId: number | null = null;
  private destroyed = false;

  constructor(private zone: NgZone) {
    this.initApi();
  }

  private initApi(): void {
    if (typeof window === 'undefined') return;
    if ((window as unknown as { YT?: unknown }).YT) {
      this.apiReady = true;
      return;
    }
    window.onYouTubeIframeAPIReady = () => {
      this.zone.run(() => {
        this.apiReady = true;
        this.apiReadyCallbacks.forEach(cb => cb());
        this.apiReadyCallbacks = [];
      });
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  createPlayer(slot: PlayerSlot, elementId: string): Promise<void> {
    return new Promise(resolve => {
      const create = () => {
        this.players[slot] = new window.YT.Player(elementId, {
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 0,
            controls: 1,
            disablekb: 0,
            fs: 1,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
          },
          events: {
            onReady: () => this.zone.run(() => resolve()),
            onStateChange: (e: YT.OnStateChangeEvent) => this.zone.run(() => {
              const localState = ytStateToLocal(e.data);
              this.stateChange$.next({ slot, state: localState });
              if (localState === 'playing') this.isPlaying.set(true);
              else if (localState === 'paused' || localState === 'ended') this.isPlaying.set(false);
            }),
          },
        });
      };
      if (this.apiReady) create();
      else this.apiReadyCallbacks.push(create);
    });
  }

  /** Cue a track without playing (for the hidden/preload player) */
  loadTrack(slot: PlayerSlot, videoId: string, startSeconds = 0): void {
    const p = this.players[slot];
    if (!p) return;
    p.cueVideoById({ videoId, startSeconds });
  }

  /** Load and immediately play a track (for the active player) */
  playTrack(slot: PlayerSlot, videoId: string, startSeconds = 0): void {
    const p = this.players[slot];
    if (!p) return;
    p.loadVideoById({ videoId, startSeconds });
  }

  play(slot: PlayerSlot): void {
    this.players[slot]?.playVideo();
  }

  pause(slot: PlayerSlot): void {
    this.players[slot]?.pauseVideo();
  }

  togglePlayPause(): void {
    for (const slot of ['A', 'B'] as PlayerSlot[]) {
      const p = this.players[slot];
      if (!p || typeof p.getPlayerState !== 'function') continue;
      const state = p.getPlayerState();
      if (state === 1) { p.pauseVideo(); return; }  // playing → pause
      if (state === 2) { p.playVideo(); return; }   // paused  → play
    }
  }

  setVolume(slot: PlayerSlot, vol: number): void {
    this.players[slot]?.setVolume(vol);
  }

  seek(slot: PlayerSlot, seconds: number): void {
    this.players[slot]?.seekTo(seconds, true);
  }

  getCurrentTime(slot: PlayerSlot): number {
    return this.players[slot]?.getCurrentTime() ?? 0;
  }

  getDuration(slot: PlayerSlot): number {
    return this.players[slot]?.getDuration() ?? 0;
  }

  /** Start a polling loop that emits time updates via timeUpdate$ */
  startPolling(): void {
    if (this.rafId !== null) return;
    const poll = () => {
      if (this.destroyed) return;
      for (const slot of ['A', 'B'] as PlayerSlot[]) {
        const p = this.players[slot];
        if (p && typeof p.getPlayerState === 'function') {
          const state = p.getPlayerState();
          if (state === window.YT?.PlayerState?.PLAYING) {
            this.timeUpdate$.next({
              slot,
              currentTime: p.getCurrentTime(),
              duration: p.getDuration(),
            });
          }
        }
      }
      this.rafId = requestAnimationFrame(poll);
    };
    this.rafId = requestAnimationFrame(poll);
  }

  stopPolling(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroyPlayer(slot: PlayerSlot): void {
    this.players[slot]?.destroy();
    delete this.players[slot];
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stopPolling();
    this.destroyPlayer('A');
    this.destroyPlayer('B');
    this.timeUpdate$.complete();
    this.stateChange$.complete();
  }
}

function ytStateToLocal(state: number): PlayerState {
  switch (state) {
    case -1: return 'unstarted';
    case 1:  return 'playing';
    case 2:  return 'paused';
    case 0:  return 'ended';
    case 3:  return 'buffering';
    default: return 'unstarted';
  }
}
