import { Observable } from 'rxjs';

export type PlayerState = 'unstarted' | 'playing' | 'paused' | 'ended' | 'buffering';

export interface EmbedPlayerControl {
  /** Load and cue a track (does not auto-play) */
  loadTrack(trackId: string, startSeconds?: number): void;
  play(): void;
  pause(): void;
  setVolume(vol: number): void;  // 0–100
  seek(seconds: number): void;
  /** Current playback time stream */
  currentTime$: Observable<number>;
  /** Player state changes */
  state$: Observable<PlayerState>;
  /** Duration in seconds once known */
  duration$: Observable<number>;
}
