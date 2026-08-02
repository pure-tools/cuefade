import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { YouTubeStageComponent } from './youtube-stage';
import { YouTubePlayerService, PlayerSlot } from '../youtube-player.service';
import { CrossfadeService } from '../../../services/crossfade.service';
import { QueueService } from '../../../services/queue.service';
import { ProviderRegistryService } from '../../../services/provider-registry.service';
import { Track } from '../../../interfaces/track';

const makeTrack = (id: string, cueIn?: number): Track => ({
  id, title: `Track ${id}`, thumbnailUrl: '', provider: 'youtube', cueIn,
});

describe('YouTubeStageComponent', () => {
  interface MockYtPlayer {
    activeSlot: ReturnType<typeof signal<PlayerSlot>>;
    resumeTime: number | null;
    createPlayer: ReturnType<typeof vi.fn>;
    savePlaybackState: ReturnType<typeof vi.fn>;
    startPolling: ReturnType<typeof vi.fn>;
    stopPolling: ReturnType<typeof vi.fn>;
    playTrack: ReturnType<typeof vi.fn>;
    loadTrack: ReturnType<typeof vi.fn>;
    setVolume: ReturnType<typeof vi.fn>;
    play: ReturnType<typeof vi.fn>;
    timeUpdate$: Subject<unknown>;
  }

  let mockYtPlayer: MockYtPlayer;
  let crossfadeEvents$: Subject<{ type: string }>;
  let mockCurrentTrack: ReturnType<typeof signal<Track | null>>;
  let mockNextTrack: ReturnType<typeof signal<Track | null>>;

  beforeEach(() => {
    crossfadeEvents$ = new Subject();
    mockCurrentTrack = signal<Track | null>(null);
    mockNextTrack = signal<Track | null>(null);

    mockYtPlayer = {
      activeSlot: signal<PlayerSlot>('A'),
      resumeTime: null,
      createPlayer: vi.fn().mockResolvedValue(undefined),
      savePlaybackState: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
      playTrack: vi.fn(),
      loadTrack: vi.fn(),
      setVolume: vi.fn(),
      play: vi.fn(),
      timeUpdate$: new Subject(),
    };

    TestBed.configureTestingModule({
      imports: [YouTubeStageComponent],
      providers: [
        { provide: YouTubePlayerService, useValue: mockYtPlayer },
        {
          provide: CrossfadeService,
          useValue: {
            opacityA: signal(1),
            opacityB: signal(0),
            volumeA: signal(100),
            volumeB: signal(0),
            onTimeUpdate: vi.fn(),
            crossfadeEvents$,
            transitionDuration: signal(8),
          },
        },
        {
          provide: QueueService,
          useValue: {
            currentTrack: mockCurrentTrack,
            nextTrack: mockNextTrack,
            currentIndex: signal(0),
          },
        },
        { provide: ProviderRegistryService, useValue: { resolve: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(YouTubeStageComponent, { set: { template: '<div></div>', imports: [] } });
  });

  const flush = () => new Promise<void>(r => setTimeout(r, 0));

  it('ngOnDestroy calls savePlaybackState and stopPolling', async () => {
    const fixture = TestBed.createComponent(YouTubeStageComponent);
    await flush();
    fixture.destroy();
    expect(mockYtPlayer.savePlaybackState).toHaveBeenCalled();
    expect(mockYtPlayer.stopPolling).toHaveBeenCalled();
  });

  it('loadCurrentTrack plays from resumeTime when set', async () => {
    mockYtPlayer.resumeTime = 42;
    mockCurrentTrack.set(makeTrack('a', 5));

    TestBed.createComponent(YouTubeStageComponent);
    await flush();

    expect(mockYtPlayer.playTrack).toHaveBeenCalledWith('A', 'a', 42);
    expect(mockYtPlayer.resumeTime).toBeNull();
  });

  it('loadCurrentTrack plays from cueIn when resumeTime is null', async () => {
    mockCurrentTrack.set(makeTrack('b', 15));

    TestBed.createComponent(YouTubeStageComponent);
    await flush();

    expect(mockYtPlayer.playTrack).toHaveBeenCalledWith('A', 'b', 15);
  });

  it('loadCurrentTrack defaults to 0 when no resumeTime and no cueIn', async () => {
    mockCurrentTrack.set(makeTrack('c'));

    TestBed.createComponent(YouTubeStageComponent);
    await flush();

    expect(mockYtPlayer.playTrack).toHaveBeenCalledWith('A', 'c', 0);
  });

  it('ngOnInit resets activeSlot to A when resumeTime is null (fresh load)', async () => {
    mockYtPlayer.activeSlot.set('B');
    mockYtPlayer.resumeTime = null;

    TestBed.createComponent(YouTubeStageComponent);
    await flush();

    expect(mockYtPlayer.activeSlot()).toBe('A');
  });

  it('ngOnInit preserves activeSlot when resumeTime is set (resume)', async () => {
    mockYtPlayer.activeSlot.set('B');
    mockYtPlayer.resumeTime = 30;

    TestBed.createComponent(YouTubeStageComponent);
    await flush();

    expect(mockYtPlayer.activeSlot()).toBe('B');
  });

  it('crossfade completed event switches activeSlot to hidden slot', async () => {
    TestBed.createComponent(YouTubeStageComponent);
    await flush();

    crossfadeEvents$.next({ type: 'completed' });

    expect(mockYtPlayer.activeSlot()).toBe('B');
  });

  it('crossfade completed switches back to A when active was B', async () => {
    mockYtPlayer.activeSlot.set('B');
    mockYtPlayer.resumeTime = 1; // prevent reset to A on init
    TestBed.createComponent(YouTubeStageComponent);
    await flush();

    crossfadeEvents$.next({ type: 'completed' });

    expect(mockYtPlayer.activeSlot()).toBe('A');
  });

  it('crossfade started plays hidden slot', async () => {
    TestBed.createComponent(YouTubeStageComponent);
    await flush();

    crossfadeEvents$.next({ type: 'started' });

    expect(mockYtPlayer.play).toHaveBeenCalledWith('B');
  });
});
