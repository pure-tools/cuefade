import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FeatureGateService } from './feature-gate.service';
import { AuthService } from './auth.service';

describe('FeatureGateService', () => {
  const isPro = signal(false);
  const mockAuth = { isPro };

  beforeEach(() => {
    isPro.set(false);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: mockAuth }],
    });
  });

  it('all gates false when not pro', () => {
    const service = TestBed.inject(FeatureGateService);
    expect(service.canUseSpotify()).toBe(false);
    expect(service.canUseSoundCloud()).toBe(false);
    expect(service.canAddMultipleSources()).toBe(false);
    expect(service.canUseCuePoints()).toBe(false);
    expect(service.canExportMix()).toBe(false);
  });

  it('all gates true when pro', () => {
    isPro.set(true);
    const service = TestBed.inject(FeatureGateService);
    expect(service.canUseSpotify()).toBe(true);
    expect(service.canUseSoundCloud()).toBe(true);
    expect(service.canAddMultipleSources()).toBe(true);
    expect(service.canUseCuePoints()).toBe(true);
    expect(service.canExportMix()).toBe(true);
  });

  it('gates react to isPro signal change', () => {
    const service = TestBed.inject(FeatureGateService);
    expect(service.canUseSpotify()).toBe(false);
    TestBed.runInInjectionContext(() => isPro.set(true));
    expect(service.canUseSpotify()).toBe(true);
  });
});
