import { Component, input, output, signal, inject } from '@angular/core';
import { LicenseService, PaymentService } from '@pure-tools/monetka';
import { AnalyticsService } from '@pure-tools/slushalka';
import { HapticsService, NativeService, NotificationType } from '@pure-tools/mobilka/native';
import { AuthService } from '../../../../core/services/auth.service';
import { PRO_FEATURES } from '../../../../core/pro-features';

const KOFI_URL = 'https://ko-fi.com/TODO';

/** RevenueCat / StoreKit report a user-dismissed purchase sheet this way — not an error to show. */
function isUserCancelled(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { userCancelled?: boolean }).userCancelled === true;
}

@Component({
  selector: 'app-pricing-modal',
  standalone: true,
  templateUrl: './pricing-modal.html',
})
export class PricingModalComponent {
  private payment = inject(PaymentService);
  private auth = inject(AuthService);
  private analytics = inject(AnalyticsService);
  private license = inject(LicenseService);
  private haptics = inject(HapticsService);

  visible = input(false);
  close = output();
  requireAuth = output();

  /** Native apps: store billing, no external payment/donation links (App Store 3.1.1). */
  readonly isNativeApp = inject(NativeService).isNative();
  readonly canRestore = this.payment.canRestorePurchases;

  readonly kofiUrl = KOFI_URL;
  readonly loading = signal(false);
  readonly restoring = signal(false);
  readonly error = signal('');
  readonly info = signal('');

  readonly proFeatures = [
    'Add songs to the queue while mixing',
    'Set custom Cue In / Cue Out points per track',
    'All crossfade durations (up to 20 s)',
    'No ads',
    'Spotify & SoundCloud support',
    'Export mix as timestamped playlist',
  ];

  async unlock(): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this.close.emit();
      this.requireAuth.emit();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.info.set('');
    this.analytics.track('checkout_started');
    try {
      if (this.isNativeApp) {
        const result = await this.payment.openCheckout({ userId: this.auth.user()?.id });
        await this.onStorePurchase(result.entitlements ?? []);
      } else {
        await this.payment.openCheckout({
          userId: this.auth.user()?.id,
          email: this.auth.user()?.email,
          successUrl: `${window.location.origin}/?upgraded=1`,
          cancelUrl: window.location.href,
        });
      }
    } catch (e) {
      this.loading.set(false);
      if (isUserCancelled(e)) {
        this.analytics.track('checkout_cancelled');
        return;
      }
      this.error.set((e as Error).message ?? 'Checkout failed');
      this.analytics.track('checkout_failed');
    }
  }

  async restore(): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this.close.emit();
      this.requireAuth.emit();
      return;
    }
    this.restoring.set(true);
    this.error.set('');
    this.info.set('');
    try {
      const status = await this.payment.restorePurchases(this.auth.user()?.id);
      this.analytics.track('purchases_restored', { found: status.valid });
      if (status.valid) {
        await this.onStorePurchase(status.features);
      } else {
        this.info.set('No previous purchase found for this Apple / Google account.');
      }
    } catch (e) {
      this.error.set((e as Error).message ?? 'Restore failed');
    } finally {
      this.restoring.set(false);
    }
  }

  /**
   * The store confirmed the purchase: unlock immediately (optimistic), then wait for the
   * RevenueCat webhook to persist is_pro so the unlock survives reinstalls and other devices.
   */
  private async onStorePurchase(entitlements: string[]): Promise<void> {
    if (!entitlements.includes('pro')) {
      this.loading.set(false);
      this.error.set('Purchase went through but Pro is not active yet — try Restore in a minute.');
      return;
    }
    this.license.setLicensed(PRO_FEATURES);
    void this.haptics.notification(NotificationType.Success);
    this.analytics.track('checkout_completed', { store: 'in-app' });
    await this.auth.waitForPro();
    this.loading.set(false);
    this.close.emit();
  }
}
