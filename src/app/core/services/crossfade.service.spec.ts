import { TestBed } from '@angular/core/testing';
import { CrossfadeService } from './crossfade.service';
import { QueueService } from './queue.service';
import { Track } from '../interfaces/track';
import { vi } from 'vitest';

const makeTrack = (id: string, cueOut?: number): Track => ({
  id,
  title: `Track ${id}`,
  thumbnailUrl: '',
  provider: 'youtube',
  cueOut,
});

describe('CrossfadeService', () => {
  let service: CrossfadeService;
  let queue: QueueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    queue = TestBed.inject(QueueService);
    service = TestBed.inject(CrossfadeService);
  });

  afterEach(() => {
    service.cancelFade();
  });

  it('should have default signal values', () => {
    expect(service.transitionDuration()).toBe(20);
    expect(service.transitionPoint()).toBe(30);
    expect(service.volumeA()).toBe(100);
    expect(service.volumeB()).toBe(0);
    expect(service.opacityA()).toBe(1);
    expect(service.opacityB()).toBe(0);
  });

  it('setTransitionDuration updates signal', () => {
    service.setTransitionDuration(12);
    expect(service.transitionDuration()).toBe(12);
  });

  it('cancelFade resets volumes and opacities', () => {
    service.volumeA.set(50);
    service.volumeB.set(50);
    service.cancelFade();
    expect(service.volumeA()).toBe(100);
    expect(service.volumeB()).toBe(0);
  });

  it('onTimeUpdate does not trigger fade if no next track', () => {
    queue.setTracks([makeTrack('a')]);
    const startSpy = vi.spyOn(service, 'startCrossfade');
    service.onTimeUpdate(270, 300);
    expect(startSpy).not.toHaveBeenCalled();
  });

  it('onTimeUpdate triggers fade at cueOut if set', () => {
    queue.setTracks([makeTrack('a', 100), makeTrack('b')]);
    const startSpy = vi.spyOn(service, 'startCrossfade');
    service.onTimeUpdate(100, 300);
    expect(startSpy).toHaveBeenCalled();
  });

  it('onTimeUpdate triggers fade at transitionPoint by default', () => {
    queue.setTracks([makeTrack('a'), makeTrack('b')]);
    service.transitionPoint.set(30);
    const startSpy = vi.spyOn(service, 'startCrossfade');
    service.onTimeUpdate(270, 300); // 300 - 30 = 270
    expect(startSpy).toHaveBeenCalled();
  });

  it('emits crossfadeEvents$ started when startCrossfade called', async () => {
    queue.setTracks([makeTrack('a'), makeTrack('b')]);
    const events: string[] = [];
    service.crossfadeEvents$.subscribe(e => events.push(e.type));
    service.startCrossfade();
    expect(events[0]).toBe('started');
  });
});
