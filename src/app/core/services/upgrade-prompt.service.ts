import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UpgradePromptService {
  readonly showPricing = signal(false);
  readonly showAuth = signal(false);

  open(): void {
    this.showPricing.set(true);
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
