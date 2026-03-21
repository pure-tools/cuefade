import { Injectable, Type } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { MusicProvider, AuthenticatedMusicProvider } from '../../interfaces/music-provider';
import { Track, ProviderType } from '../../interfaces/track';
import { Playlist } from '../../interfaces/playlist';
import { YouTubeDataService } from './youtube-data.service';
import { YouTubeStageComponent } from './youtube-stage/youtube-stage';

@Injectable()
export class YouTubeProvider implements AuthenticatedMusicProvider {
  readonly type: ProviderType = 'youtube';

  // v1 stub: always unauthenticated
  readonly isAuthenticated$ = new BehaviorSubject<boolean>(false).asObservable();

  constructor(private dataService: YouTubeDataService) {}

  canHandleUrl(url: string): boolean {
    return /youtube\.com|youtu\.be/i.test(url);
  }

  fetchPlaylist(url: string): Observable<Playlist> {
    const listId = extractPlaylistId(url);
    if (listId) return this.dataService.fetchPlaylist(listId);
    const videoId = extractVideoId(url);
    if (videoId) {
      return new Observable(observer => {
        this.dataService.fetchSingleVideo(videoId).subscribe({
          next: track => {
            observer.next({
              id: videoId,
              title: track.title,
              thumbnailUrl: track.thumbnailUrl,
              provider: 'youtube',
              trackIds: [videoId],
            });
            observer.complete();
          },
          error: (e: Error) => observer.error(e),
        });
      });
    }
    throw new Error('Cannot extract YouTube playlist or video ID from URL: ' + url);
  }

  fetchTrack(urlOrId: string): Observable<Track> {
    // Accept a full URL or a bare video ID
    const videoId = extractVideoId(urlOrId) ?? urlOrId.trim();
    return this.dataService.fetchSingleVideo(videoId);
  }

  getStageComponent(): Type<unknown> {
    return YouTubeStageComponent;
  }

  // v1 stubs — no auth yet
  async login(): Promise<void> {
    console.warn('[YouTubeProvider] OAuth login not implemented in v1');
  }

  logout(): void {
    console.warn('[YouTubeProvider] OAuth logout not implemented in v1');
  }

  getUserPlaylists(): Observable<Playlist[]> {
    return of([]);
  }
}

export function extractPlaylistId(url: string): string | null {
  // Full URL: ?list=PL... or &list=PL...
  const fromUrl = url.match(/[?&]list=([^&#]+)/);
  if (fromUrl) return fromUrl[1];
  // Bare playlist ID (PL, RD, UU, LL, FL prefixes)
  const bare = url.trim();
  if (/^(PL|RD|UU|LL|FL)[a-zA-Z0-9_-]{10,}$/.test(bare)) return bare;
  return null;
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /embed\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
