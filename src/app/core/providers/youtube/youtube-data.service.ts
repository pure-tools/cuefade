import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, map, switchMap, catchError, throwError, of } from 'rxjs';
import { Track } from '../../interfaces/track';
import { Playlist } from '../../interfaces/playlist';
import { environment } from '../../../../environments/environment';

const API_BASE = 'https://www.googleapis.com/youtube/v3';

@Injectable({ providedIn: 'root' })
export class YouTubeDataService {
  private http = inject(HttpClient);
  private apiKey = environment.youtubeApiKey;

  fetchPlaylist(playlistId: string): Observable<Playlist> {
    const params = new HttpParams()
      .set('part', 'snippet')
      .set('id', playlistId)
      .set('key', this.apiKey);

    return this.http
      .get<YtPlaylistListResponse>(`${API_BASE}/playlists`, { params })
      .pipe(
        catchError(err => throwError(() => parseYtError(err))),
        switchMap(res => {
          if (!res.items?.length) {
            return throwError(() => new Error(
              'Playlist not found or is private. ' +
              'Make sure the playlist visibility is set to "Public" on YouTube.'
            ));
          }
          const item = res.items[0];
          const title = item.snippet?.title ?? 'Untitled Playlist';
          const thumbnail = item.snippet?.thumbnails?.medium?.url ?? '';
          return this.fetchPlaylistItems(playlistId).pipe(
            map(tracks => ({
              id: playlistId,
              title,
              thumbnailUrl: thumbnail,
              provider: 'youtube' as const,
              trackIds: tracks.map(t => t.id),
              tracks,
            }))
          );
        })
      );
  }

  fetchPlaylistItems(playlistId: string, pageToken?: string): Observable<Track[]> {
    let params = new HttpParams()
      .set('part', 'snippet,contentDetails')
      .set('playlistId', playlistId)
      .set('maxResults', '50')
      .set('key', this.apiKey);
    if (pageToken) params = params.set('pageToken', pageToken);

    return this.http
      .get<YtPlaylistItemListResponse>(`${API_BASE}/playlistItems`, { params })
      .pipe(
        catchError(err => throwError(() => parseYtError(err))),
        switchMap(res => {
          const videoIds = (res.items ?? [])
            .map(i => i.contentDetails?.videoId)
            .filter((id): id is string => !!id);

          const tracks$ = this.fetchVideoDetails(videoIds);
          const nextPage$: Observable<Track[]> = res.nextPageToken
            ? this.fetchPlaylistItems(playlistId, res.nextPageToken)
            : of([]);

          return forkJoin([tracks$, nextPage$]).pipe(
            map(([current, next]) => [...current, ...next])
          );
        })
      );
  }

  fetchVideoDetails(videoIds: string[]): Observable<Track[]> {
    if (videoIds.length === 0) return of([]);

    const params = new HttpParams()
      .set('part', 'snippet,contentDetails,status')
      .set('id', videoIds.join(','))
      .set('key', this.apiKey);

    return this.http
      .get<YtVideoListResponse>(`${API_BASE}/videos`, { params })
      .pipe(
        catchError(err => throwError(() => parseYtError(err))),
        map(res => {
          const foundMap = new Map<string, Track>();
          for (const item of res.items ?? []) {
            const notEmbeddable = item.status?.embeddable === false;
            foundMap.set(item.id, {
              id: item.id,
              title: item.snippet?.title ?? 'Unknown',
              artist: item.snippet?.channelTitle,
              thumbnailUrl:
                item.snippet?.thumbnails?.medium?.url ??
                item.snippet?.thumbnails?.default?.url ??
                '',
              duration: parseDuration(item.contentDetails?.duration),
              provider: 'youtube' as const,
              embeddable: !notEmbeddable,
              embedError: notEmbeddable
                ? 'Playback on other websites has been disabled by the video owner'
                : undefined,
            });
          }
          // Preserve original order; fill in placeholders for missing (deleted/private) videos
          return videoIds.map(id =>
            foundMap.get(id) ?? {
              id,
              title: 'Video unavailable',
              thumbnailUrl: '',
              provider: 'youtube' as const,
              embeddable: false,
              embedError: 'Video unavailable',
            }
          );
        })
      );
  }

  fetchSingleVideo(videoId: string): Observable<Track> {
    return this.fetchVideoDetails([videoId]).pipe(
      map(tracks => {
        if (tracks.length === 0) throw new Error(`Video ${videoId} not found`);
        return tracks[0];
      })
    );
  }
}

// --- YouTube API response types ---

interface YtThumbnail { url: string }
interface YtThumbnails { default?: YtThumbnail; medium?: YtThumbnail; high?: YtThumbnail }

interface YtPlaylistListResponse {
  items?: Array<{
    snippet?: { title?: string; thumbnails?: YtThumbnails };
  }>;
}

interface YtPlaylistItemListResponse {
  nextPageToken?: string;
  items?: Array<{
    contentDetails?: { videoId?: string };
  }>;
}

interface YtVideoListResponse {
  items?: Array<{
    id: string;
    snippet?: { title?: string; channelTitle?: string; thumbnails?: YtThumbnails };
    contentDetails?: { duration?: string };
    status?: { embeddable?: boolean };
  }>;
}

/** Parse ISO 8601 duration (PT4M13S) → seconds */
function parseDuration(iso?: string): number | undefined {
  if (!iso) return undefined;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return undefined;
  const h = parseInt(m[1] ?? '0', 10);
  const min = parseInt(m[2] ?? '0', 10);
  const s = parseInt(m[3] ?? '0', 10);
  return h * 3600 + min * 60 + s;
}

/** Extract a human-readable message from a YouTube API HttpErrorResponse */
function parseYtError(err: unknown): Error {
  if (err instanceof HttpErrorResponse) {
    // YouTube API returns { error: { code, message, errors: [] } }
    const ytMsg: string | undefined = (err.error as { error?: { message?: string } })?.error?.message;
    if (ytMsg) return new Error(ytMsg);

    if (err.status === 0) return new Error('Network error — check your internet connection.');
    if (err.status === 400) return new Error('Bad request — check the playlist URL.');
    if (err.status === 403) return new Error(
      'Access denied (403). The API key may be invalid, quota exceeded, or the YouTube Data API v3 is not enabled.'
    );
    if (err.status === 404) return new Error(
      'Playlist not found (404). Make sure the playlist exists and its visibility is set to "Public".'
    );
    return new Error(`YouTube API error ${err.status}: ${err.statusText}`);
  }
  return err instanceof Error ? err : new Error(String(err));
}
