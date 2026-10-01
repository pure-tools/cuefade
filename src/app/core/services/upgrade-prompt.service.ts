import { Injectable, inject, signal } from '@angular/core';
import { AnalyticsService } from '@pure-tools/slushalka';

/** Which gated feature (or UI element) opened the pricing modal — answers "what triggers upgrades?" */
export type UpgradeSource =
  | 'crossfade'
  | 'fade_duration'
  | 'cue_points'
  | 'add_to_queue'
  | 'export'
  | 'banner'
  | 'header'
  | 'ads'
  | 'url_input';

@Injectable({ providedIn: 'root' })
export class UpgradePromptService {
  private analytics = inject(AnalyticsService);

  readonly showPricing = signal(false);
  readonly showAuth = signal(false);

  open(source: UpgradeSource): void {
    this.showPricing.set(true);
    this.analytics.track('upgrade_modal_shown', { source });
  }

  requireAuth(): void {
    this.showPricing.set(false);
    this.showAuth.set(true);
  }

  close(): void {
    this.showPricing.set(false);
    this.showAuth.set(false);
  }
}
