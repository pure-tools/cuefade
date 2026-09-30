import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FeatureGateService } from './feature-gate.service';
import { LicenseService } from '@pure-tools/monetka';

describe('FeatureGateService', () => {
  const isLicensed = signal(false);
  const mockLicense = { isLicensed };

  beforeEach(() => {
    isLicensed.set(false);
    TestBed.configureTestingModule({
      providers: [{ provide: LicenseService, useValue: mockLicense }],
    });
  });

  it('all gates false when not licensed', () => {
    const service = TestBed.inject(FeatureGateService);
    expect(service.canUseSpotify()).toBe(false);
    expect(service.canUseSoundCloud()).toBe(false);
    expect(service.canAddMultipleSources()).toBe(false);
    expect(service.canUseCuePoints()).toBe(false);
    expect(service.canExportMix()).toBe(false);
    expect(service.canUseFade()).toBe(false);
    expect(service.canAddToQueue()).toBe(false);
    expect(service.noAds()).toBe(false);
    expect(service.canExportPlaylist()).toBe(false);
  });

  it('all gates true when licensed', () => {
    isLicensed.set(true);
    const service = TestBed.inject(FeatureGateService);
    expect(service.canUseSpotify()).toBe(true);
    expect(service.canUseSoundCloud()).toBe(true);
    expect(service.canAddMultipleSources()).toBe(true);
    expect(service.canUseCuePoints()).toBe(true);
    expect(service.canExportMix()).toBe(true);
    expect(service.canUseFade()).toBe(true);
    expect(service.canAddToQueue()).toBe(true);
    expect(service.noAds()).toBe(true);
    expect(service.canExportPlaylist()).toBe(true);
  });

  it('gates react to isLicensed signal change', () => {
    const service = TestBed.inject(FeatureGateService);
    expect(service.canUseSpotify()).toBe(false);
    TestBed.runInInjectionContext(() => isLicensed.set(true));
    expect(service.canUseSpotify()).toBe(true);
  });
});
