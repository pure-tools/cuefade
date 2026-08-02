import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MobileService } from '@pure-tools/mobilka';
import { PlayerComponent } from './player';
import { QueueService } from '../../core/services/queue.service';
import { Track } from '../../core/interfaces/track';

const makeTrack = (id: string): Track => ({ id, title: `Track ${id}`, thumbnailUrl: '', provider: 'youtube' });

describe('PlayerComponent — browser title effect', () => {
  let mockSetTitle: ReturnType<typeof vi.fn>;
  let mockCurrentTrack: ReturnType<typeof signal<Track | null>>;
  let mockPlaylistTitle: ReturnType<typeof signal<string>>;

  beforeEach(() => {
    mockSetTitle = vi.fn();
    mockCurrentTrack = signal<Track | null>(null);
    mockPlaylistTitle = signal('');

    TestBed.configureTestingModule({
      imports: [PlayerComponent],
      providers: [
        { provide: Title, useValue: { setTitle: mockSetTitle } },
        {
          provide: QueueService,
          useValue: {
            currentTrack: mockCurrentTrack,
            playlistTitle: mockPlaylistTitle,
            currentIndex: signal(0),
            tracks: signal([]),
            hasNext: signal(false),
            nextTrack: signal(null),
          },
        },
        { provide: MobileService, useValue: { isMobile: signal(false) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(PlayerComponent, { set: { template: '<div></div>', imports: [] } });
  });

  it('sets title to current track name', () => {
    mockCurrentTrack.set(makeTrack('a'));
    TestBed.createComponent(PlayerComponent);
    TestBed.flushEffects();
    expect(mockSetTitle).toHaveBeenCalledWith('Track a — CueFade');
  });

  it('falls back to playlist title when no track playing', () => {
    mockPlaylistTitle.set('Summer Mix');
    TestBed.createComponent(PlayerComponent);
    TestBed.flushEffects();
    expect(mockSetTitle).toHaveBeenCalledWith('Summer Mix — CueFade');
  });

  it('does nothing when neither track nor playlist', () => {
    TestBed.createComponent(PlayerComponent);
    TestBed.flushEffects();
    expect(mockSetTitle).not.toHaveBeenCalled();
  });

  it('prefers track title over playlist title', () => {
    mockCurrentTrack.set(makeTrack('b'));
    mockPlaylistTitle.set('Summer Mix');
    TestBed.createComponent(PlayerComponent);
    TestBed.flushEffects();
    expect(mockSetTitle).toHaveBeenCalledWith('Track b — CueFade');
    expect(mockSetTitle).not.toHaveBeenCalledWith('Summer Mix — CueFade');
  });

  it('updates title reactively when track changes', () => {
    TestBed.createComponent(PlayerComponent);
    TestBed.flushEffects();
    expect(mockSetTitle).not.toHaveBeenCalled();

    mockCurrentTrack.set(makeTrack('c'));
    TestBed.flushEffects();
    expect(mockSetTitle).toHaveBeenCalledWith('Track c — CueFade');
  });
});
