import { Injectable, Type } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { MusicProvider } from '../../interfaces/music-provider';
import { Track, ProviderType } from '../../interfaces/track';
import { Playlist } from '../../interfaces/playlist';

@Injectable()
export class SoundCloudProvider implements MusicProvider {
  readonly type: ProviderType = 'soundcloud';

  canHandleUrl(url: string): boolean {
    return /soundcloud\.com/i.test(url);
  }

  fetchPlaylist(_url: string): Observable<Playlist> {
    return throwError(() => new Error('SoundCloud support coming soon'));
  }

  fetchTrack(_id: string): Observable<Track> {
    return throwError(() => new Error('SoundCloud support coming soon'));
  }

  getStageComponent(): Type<unknown> {
    return class {};  // placeholder
  }
}
