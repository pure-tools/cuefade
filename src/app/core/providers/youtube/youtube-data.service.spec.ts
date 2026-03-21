import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { YouTubeDataService } from './youtube-data.service';

describe('YouTubeDataService', () => {
  let service: YouTubeDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        YouTubeDataService,
      ],
    });
    service = TestBed.inject(YouTubeDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetchVideoDetails returns mapped tracks', async () => {
    const promise = firstValueFrom(service.fetchVideoDetails(['vid1']));

    const req = httpMock.expectOne(r => r.url.includes('/videos'));
    req.flush({
      items: [
        {
          id: 'vid1',
          snippet: {
            title: 'Test Song',
            channelTitle: 'Test Artist',
            thumbnails: { medium: { url: 'https://thumb.jpg' } },
          },
          contentDetails: { duration: 'PT3M30S' },
        },
      ],
    });

    const tracks = await promise;
    expect(tracks.length).toBe(1);
    expect(tracks[0].id).toBe('vid1');
    expect(tracks[0].title).toBe('Test Song');
    expect(tracks[0].duration).toBe(210); // 3*60 + 30
    expect(tracks[0].provider).toBe('youtube');
  });

  it('fetchVideoDetails returns empty array for empty input', async () => {
    const tracks = await firstValueFrom(service.fetchVideoDetails([]));
    expect(tracks).toEqual([]);
    httpMock.expectNone(() => true);
  });
});
