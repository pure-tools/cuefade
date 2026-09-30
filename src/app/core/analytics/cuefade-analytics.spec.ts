import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { AnalyticsService } from '@pure-tools/slushalka';
import { CuefadeAnalytics, loadUmami } from './cuefade-analytics';
import { AuthService } from '../services/auth.service';
import { CrossfadeService, type CrossfadeEvent } from '../services/crossfade.service';

const mockAnalytics = { track: vi.fn(), identify: vi.fn(), reset: vi.fn(), setSuperProps: vi.fn() };

describe('CuefadeAnalytics', () => {
  let user: ReturnType<typeof signal<{ id: string } | null>>;
  let loading: ReturnType<typeof signal<boolean>>;
  let isPro: ReturnType<typeof signal<boolean>>;
  let events$: Subject<CrossfadeEvent>;

  function start(): void {
    TestBed.configureTestingModule({
      providers: [
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: AuthService, useValue: { user, loading, isPro } },
        { provide: CrossfadeService, useValue: { crossfadeEvents$: events$, transitionDuration: signal(8) } },
      ],
    });
    TestBed.inject(CuefadeAnalytics).start();
    TestBed.tick();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    user = signal(null);
    loading = signal(false);
    isPro = signal(false);
    events$ = new Subject();
    vi.stubGlobal('location', { search: '' });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('tracks crossfade_started with duration, ignores completed', () => {
    start();
    events$.next({ type: 'started', fromIndex: 0, toIndex: 1 });
    events$.next({ type: 'completed', fromIndex: 0, toIndex: 1 });
    expect(mockAnalytics.track).toHaveBeenCalledTimes(1);
    expect(mockAnalytics.track).toHaveBeenCalledWith('crossfade_started', { durationSec: 8 });
  });

  it('identifies logged-in user with plan', () => {
    user.set({ id: 'u1' });
    isPro.set(true);
    start();
    expect(mockAnalytics.setSuperProps).toHaveBeenCalledWith({ plan: 'pro' });
    expect(mockAnalytics.identify).toHaveBeenCalledWith('u1', { plan: 'pro' });
  });

  it('does not reset anonymous visitors', () => {
    start();
    expect(mockAnalytics.identify).not.toHaveBeenCalled();
    expect(mockAnalytics.reset).not.toHaveBeenCalled();
    expect(mockAnalytics.setSuperProps).toHaveBeenCalledWith({ plan: 'free' });
  });

  it('resets on logout', () => {
    user.set({ id: 'u1' });
    start();
    user.set(null);
    TestBed.tick();
    expect(mockAnalytics.reset).toHaveBeenCalledTimes(1);
  });

  it('waits for auth to finish loading', () => {
    loading.set(true);
    user.set({ id: 'u1' });
    start();
    expect(mockAnalytics.identify).not.toHaveBeenCalled();
    loading.set(false);
    TestBed.tick();
    expect(mockAnalytics.identify).toHaveBeenCalledWith('u1', { plan: 'free' });
  });

  it('tracks checkout_completed on Stripe return', () => {
    vi.stubGlobal('location', { search: '?upgraded=1' });
    start();
    expect(mockAnalytics.track).toHaveBeenCalledWith('checkout_completed');
  });
});

describe('loadUmami', () => {
  it('injects tracker script with auto-track off', () => {
    const doc = document.implementation.createHTMLDocument();
    loadUmami('site-123', doc);
    const script = doc.head.querySelector('script')!;
    expect(script.src).toBe('https://cloud.umami.is/script.js');
    expect(script.dataset['websiteId']).toBe('site-123');
    expect(script.dataset['autoTrack']).toBe('false');
  });

  it('does nothing without a website id', () => {
    const doc = document.implementation.createHTMLDocument();
    loadUmami('', doc);
    expect(doc.head.querySelector('script')).toBeNull();
  });
});
