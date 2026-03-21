import { Observable } from 'rxjs';
import { Type } from '@angular/core';
import { Track, ProviderType } from './track';
import { Playlist } from './playlist';

export interface MusicProvider {
  type: ProviderType;
  canHandleUrl(url: string): boolean;
  fetchPlaylist(url: string): Observable<Playlist>;
  fetchTrack(id: string): Observable<Track>;
  /** Returns the stage component class to render in the player stage */
  getStageComponent(): Type<unknown>;
}

/** Extended interface for providers that support OAuth login */
export interface AuthenticatedMusicProvider extends MusicProvider {
  isAuthenticated$: Observable<boolean>;
  login(): Promise<void>;
  logout(): void;
  getUserPlaylists(): Observable<Playlist[]>;
}

export function isAuthenticatedProvider(p: MusicProvider): p is AuthenticatedMusicProvider {
  return 'isAuthenticated$' in p;
}
