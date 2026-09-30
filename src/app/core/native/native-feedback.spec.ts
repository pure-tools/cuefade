import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { HapticsService, ImpactStyle, KeyboardService, NetworkService } from '@pure-tools/mobilka/native';
import { NativeFeedback } from './native-feedback';
import { OfflineBanner } from './offline-banner';
import { CrossfadeService, type CrossfadeEvent } from '../services/crossfade.service';

describe('NativeFeedback', () => {
  const haptics = { impact: vi.fn().mockResolvedValue(undefined) };
  const isOpen = signal(false);
  let events$: Subject<CrossfadeEvent>;

  beforeEach(() => {
    vi.clearAllMocks();
    isOpen.set(false);
    events$ = new Subject();
    TestBed.configureTestingModule({
      providers: [
        { provide: HapticsService, useValue: haptics },
        { provide: KeyboardService, useValue: { isOpen } },
        { provide: CrossfadeService, useValue: { crossfadeEvents$: events$ } },
      ],
    });
    TestBed.inject(NativeFeedback).start();
    TestBed.tick();
  });

  afterEach(() => document.body.classList.remove('keyboard-open'));

  it('taps a light haptic when a crossfade starts, not when it completes', () => {
    events$.next({ type: 'started', fromIndex: 0, toIndex: 1 });
    events$.next({ type: 'completed', fromIndex: 0, toIndex: 1 });
    expect(haptics.impact).toHaveBeenCalledTimes(1);
    expect(haptics.impact).toHaveBeenCalledWith(ImpactStyle.Light);
  });

  it('mirrors keyboard state onto body.keyboard-open', () => {
    expect(document.body.classList.contains('keyboard-open')).toBe(false);
    isOpen.set(true);
    TestBed.tick();
    expect(document.body.classList.contains('keyboard-open')).toBe(true);
    isOpen.set(false);
    TestBed.tick();
    expect(document.body.classList.contains('keyboard-open')).toBe(false);
  });
});

describe('OfflineBanner', () => {
  const isOnline = signal(true);

  function render() {
    TestBed.configureTestingModule({
      imports: [OfflineBanner],
      providers: [{ provide: NetworkService, useValue: { isOnline } }],
    });
    const fixture = TestBed.createComponent(OfflineBanner);
    fixture.detectChanges();
    return fixture;
  }

  it('is hidden while online and appears when offline', () => {
    isOnline.set(true);
    const fixture = render();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('offline');

    isOnline.set(false);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent).toContain("You're offline");
  });
});
