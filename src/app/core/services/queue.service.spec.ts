import { TestBed } from '@angular/core/testing';
import { QueueService } from './queue.service';
import { Track } from '../interfaces/track';

const makeTrack = (id: string): Track => ({
  id,
  title: `Track ${id}`,
  thumbnailUrl: '',
  provider: 'youtube',
});

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QueueService);
  });

  it('should initialise empty', () => {
    expect(service.tracks()).toEqual([]);
    expect(service.currentIndex()).toBe(0);
  });

  it('setTracks resets currentIndex', () => {
    const tracks = [makeTrack('a'), makeTrack('b'), makeTrack('c')];
    service.setTracks(tracks);
    service.advance();
    service.setTracks([makeTrack('x')]);
    expect(service.currentIndex()).toBe(0);
    expect(service.tracks().length).toBe(1);
  });

  it('advance increments currentIndex', () => {
    service.setTracks([makeTrack('a'), makeTrack('b')]);
    service.advance();
    expect(service.currentIndex()).toBe(1);
  });

  it('advance does not go past end', () => {
    service.setTracks([makeTrack('a')]);
    service.advance(); // no next
    expect(service.currentIndex()).toBe(0);
  });

  it('moveTrack reorders correctly', () => {
    service.setTracks([makeTrack('a'), makeTrack('b'), makeTrack('c')]);
    service.moveTrack(0, 2);
    expect(service.tracks().map(t => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('playNext inserts after current', () => {
    service.setTracks([makeTrack('a'), makeTrack('b'), makeTrack('c')]);
    service.playNext(2); // move 'c' to position 1
    expect(service.tracks()[1].id).toBe('c');
  });

  it('updateCuePoints sets cueIn/cueOut', () => {
    service.setTracks([makeTrack('a')]);
    service.updateCuePoints(0, 10, 200);
    expect(service.tracks()[0].cueIn).toBe(10);
    expect(service.tracks()[0].cueOut).toBe(200);
  });

  it('currentTrack and nextTrack computed correctly', () => {
    service.setTracks([makeTrack('a'), makeTrack('b')]);
    expect(service.currentTrack()?.id).toBe('a');
    expect(service.nextTrack()?.id).toBe('b');
  });
});
