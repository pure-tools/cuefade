import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from '@pure-tools/slushalka';
import { UpgradePromptService } from './upgrade-prompt.service';

const mockAnalytics = { track: vi.fn() };

describe('UpgradePromptService', () => {
  let service: UpgradePromptService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: AnalyticsService, useValue: mockAnalytics }],
    });
    service = TestBed.inject(UpgradePromptService);
  });

  it('open shows pricing and tracks the source', () => {
    service.open('cue_points');
    expect(service.showPricing()).toBe(true);
    expect(mockAnalytics.track).toHaveBeenCalledWith('upgrade_modal_shown', { source: 'cue_points' });
  });

  it('requireAuth swaps pricing for auth modal', () => {
    service.open('banner');
    service.requireAuth();
    expect(service.showPricing()).toBe(false);
    expect(service.showAuth()).toBe(true);
  });

  it('close hides both modals', () => {
    service.open('export');
    service.requireAuth();
    service.close();
    expect(service.showPricing()).toBe(false);
    expect(service.showAuth()).toBe(false);
  });
});
