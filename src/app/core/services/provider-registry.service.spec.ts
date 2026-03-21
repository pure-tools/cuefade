import { TestBed } from '@angular/core/testing';
import { ProviderRegistryService } from './provider-registry.service';
import { MUSIC_PROVIDERS } from '../providers/provider.token';
import { MusicProvider } from '../interfaces/music-provider';
import { vi } from 'vitest';

const makeProvider = (type: string, canHandle: (url: string) => boolean): MusicProvider => ({
  type: type as any,
  canHandleUrl: vi.fn(canHandle),
  fetchPlaylist: vi.fn(),
  fetchTrack: vi.fn(),
  getStageComponent: vi.fn(),
});

describe('ProviderRegistryService', () => {
  let service: ProviderRegistryService;
  const ytProvider = makeProvider('youtube', url => url.includes('youtube'));
  const spProvider = makeProvider('spotify', url => url.includes('spotify'));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MUSIC_PROVIDERS, useValue: ytProvider, multi: true },
        { provide: MUSIC_PROVIDERS, useValue: spProvider, multi: true },
      ],
    });
    service = TestBed.inject(ProviderRegistryService);
  });

  it('resolve returns correct provider for YouTube URL', () => {
    const p = service.resolve('https://youtube.com/watch?v=123');
    expect(p).toBe(ytProvider);
  });

  it('resolve returns correct provider for Spotify URL', () => {
    const p = service.resolve('https://open.spotify.com/playlist/abc');
    expect(p).toBe(spProvider);
  });

  it('resolve returns null for unknown URL', () => {
    const p = service.resolve('https://example.com');
    expect(p).toBeNull();
  });

  it('getAll returns all providers', () => {
    expect(service.getAll().length).toBe(2);
  });

  it('getByType returns provider by type', () => {
    expect(service.getByType('youtube')).toBe(ytProvider);
    expect(service.getByType('unknown')).toBeNull();
  });
});
