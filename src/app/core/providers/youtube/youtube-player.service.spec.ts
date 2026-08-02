import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { YouTubePlayerService } from './youtube-player.service';

const makePlayer = (overrides: Partial<YT.Player> = {}): YT.Player => ({
  destroy: vi.fn(),
  getCurrentTime: vi.fn().mockReturnValue(42),
  getDuration: vi.fn().mockReturnValue(300),
  getPlayerState: vi.fn().mockReturnValue(1),
  cueVideoById: vi.fn(),
  loadVideoById: vi.fn(),
  playVideo: vi.fn(),
  pauseVideo: vi.fn(),
  seekTo: vi.fn(),
  setVolume: vi.fn(),
  ...overrides,
} as unknown as YT.Player);

describe('YouTubePlayerService', () => {
  let service: YouTubePlayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(YouTubePlayerService);
  });

  it('activeSlot starts as A', () => {
    expect(service.activeSlot()).toBe('A');
  });

  it('resumeTime starts null', () => {
    expect(service.resumeTime).toBeNull();
  });

  it('savePlaybackState stores current time of active slot', () => {
    const player = makePlayer({ getCurrentTime: vi.fn().mockReturnValue(99) });
    (service as unknown as { players: Record<string, YT.Player> }).players['A'] = player;

    service.savePlaybackState();

    expect(service.resumeTime).toBe(99);
  });

  it('savePlaybackState uses activeSlot not hardcoded A', () => {
    const playerA = makePlayer({ getCurrentTime: vi.fn().mockReturnValue(10) });
    const playerB = makePlayer({ getCurrentTime: vi.fn().mockReturnValue(55) });
    const players = (service as unknown as { players: Record<string, YT.Player> }).players;
    players['A'] = playerA;
    players['B'] = playerB;

    service.activeSlot.set('B');
    service.savePlaybackState();

    expect(service.resumeTime).toBe(55);
  });

  it('createPlayer destroys existing player for that slot before creating new one', async () => {
    const oldPlayer = makePlayer();
    (service as unknown as { players: Record<string, YT.Player> }).players['A'] = oldPlayer;

    // Stub YT API so createPlayer resolves immediately
    const mockYT = {
      Player: function (this: Partial<YT.Player>, _id: string, opts: YT.PlayerOptions) {
        Promise.resolve().then(() => opts.events?.onReady?.({} as YT.PlayerEvent));
        Object.assign(this, makePlayer());
      },
    };
    vi.stubGlobal('YT', mockYT);
    (service as unknown as { apiReady: boolean }).apiReady = true;

    await service.createPlayer('A', 'yt-player-a');

    expect(oldPlayer.destroy).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('setVolume and loadTrack are no-ops when player does not exist', () => {
    expect(() => service.setVolume('A', 50)).not.toThrow();
    expect(() => service.loadTrack('A', 'vid123')).not.toThrow();
  });
});
