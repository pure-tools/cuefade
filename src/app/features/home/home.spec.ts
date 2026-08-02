import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { HomeComponent } from './home';
import { AuthService } from '../../core/services/auth.service';
import { QueueService } from '../../core/services/queue.service';
import { Track } from '../../core/interfaces/track';

const makeTrack = (id: string): Track => ({ id, title: `Track ${id}`, thumbnailUrl: '', provider: 'youtube' });

const mockRefreshProfile = vi.fn().mockResolvedValue(undefined);
const mockAuth = {
  isLoggedIn: signal(false),
  isPro: signal(false),
  loading: signal(false),
  user: signal(null),
  profile: signal(null),
  refreshProfile: mockRefreshProfile,
};

const mockSetTitle = vi.fn();
const mockTitleService = { setTitle: mockSetTitle };

const mockSetTracks = vi.fn();
const mockQueueService = {
  setTracks: mockSetTracks,
  tracks: signal([]),
  currentIndex: signal(0),
  currentTrack: signal(null),
  playlistTitle: signal(''),
  hasNext: signal(false),
};

function createHome() {
  vi.stubGlobal('location', { search: '', pathname: '/', href: 'http://localhost/' });
  TestBed.configureTestingModule({
    imports: [HomeComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: mockAuth },
      { provide: Title, useValue: mockTitleService },
      { provide: QueueService, useValue: mockQueueService },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });
  TestBed.overrideComponent(HomeComponent, { set: { template: '<div></div>', imports: [] } });
  return TestBed.createComponent(HomeComponent);
}

describe('HomeComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('browser title', () => {
    it('onPlaylistLoaded sets title when event has title', () => {
      const fixture = createHome();
      fixture.componentInstance.onPlaylistLoaded({ url: 'u', title: 'My Mix', tracks: [] });
      expect(mockSetTitle).toHaveBeenCalledWith('My Mix — CueFade');
    });

    it('onPlaylistLoaded with empty title does not set title', () => {
      const fixture = createHome();
      fixture.componentInstance.onPlaylistLoaded({ url: 'u', title: '', tracks: [] });
      expect(mockSetTitle).not.toHaveBeenCalled();
    });

    it('onClear resets title to default', () => {
      const fixture = createHome();
      fixture.componentInstance.onClear();
      expect(mockSetTitle).toHaveBeenCalledWith('CueFade — Create Your Own Mix');
    });

    it('onStartMix passes playlistTitle to queue', () => {
      const fixture = createHome();
      fixture.componentInstance.playlistTitle.set('Summer Set');
      const tracks = [makeTrack('a'), makeTrack('b')];
      fixture.componentInstance.onStartMix(tracks);
      expect(mockSetTracks).toHaveBeenCalledWith(tracks, 'Summer Set');
    });
  });

  it('calls refreshProfile when ?upgraded=1 in URL', () => {
    vi.stubGlobal('location', {
      search: '?upgraded=1',
      pathname: '/',
      href: 'http://localhost/?upgraded=1',
    });
    vi.stubGlobal('history', { replaceState: vi.fn() });

    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(HomeComponent, {
      set: { template: '<div></div>', imports: [] },
    });

    TestBed.createComponent(HomeComponent);
    expect(mockRefreshProfile).toHaveBeenCalledOnce();
  });

  it('does not call refreshProfile without upgraded param', () => {
    vi.stubGlobal('location', {
      search: '',
      pathname: '/',
      href: 'http://localhost/',
    });

    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(HomeComponent, {
      set: { template: '<div></div>', imports: [] },
    });

    TestBed.createComponent(HomeComponent);
    expect(mockRefreshProfile).not.toHaveBeenCalled();
  });

  it('does not call refreshProfile when upgraded param is not 1', () => {
    vi.stubGlobal('location', {
      search: '?upgraded=0',
      pathname: '/',
      href: 'http://localhost/?upgraded=0',
    });

    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(HomeComponent, {
      set: { template: '<div></div>', imports: [] },
    });

    TestBed.createComponent(HomeComponent);
    expect(mockRefreshProfile).not.toHaveBeenCalled();
  });
});
