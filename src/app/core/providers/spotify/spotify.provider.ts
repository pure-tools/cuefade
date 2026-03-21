import { Injectable, Type } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { MusicProvider } from '../../interfaces/music-provider';
import { Track, ProviderType } from '../../interfaces/track';
import { Playlist } from '../../interfaces/playlist';
import { SpotifyStageComponent } from './spotify-stage/spotify-stage';

@Injectable()
export class SpotifyProvider implements MusicProvider {
  readonly type: ProviderType = 'spotify';

  canHandleUrl(url: string): boolean {
    return /spotify\.com/i.test(url);
  }

  fetchPlaylist(_url: string): Observable<Playlist> {
    return throwError(() => new Error('Spotify support coming in v2'));
  }

  fetchTrack(_id: string): Observable<Track> {
    return throwError(() => new Error('Spotify support coming in v2'));
  }

  getStageComponent(): Type<unknown> {
    return SpotifyStageComponent;
  }
}
