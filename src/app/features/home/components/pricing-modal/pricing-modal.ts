import { Component, input, output, signal, inject } from '@angular/core';
import { PaymentService } from '@puretools/monetka';
import { AuthService } from '../../../../core/services/auth.service';

const KOFI_URL = 'https://ko-fi.com/TODO';

@Component({
  selector: 'app-pricing-modal',
  standalone: true,
  templateUrl: './pricing-modal.html',
})
export class PricingModalComponent {
  private payment = inject(PaymentService);
  private auth = inject(AuthService);

  visible = input(false);
  close = output();
  requireAuth = output();

  readonly kofiUrl = KOFI_URL;
  readonly loading = signal(false);
  readonly error = signal('');

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
    try {
      await this.payment.openCheckout({
        userId: this.auth.user()?.id,
        email: this.auth.user()?.email,
        successUrl: `${window.location.origin}/?upgraded=1`,
        cancelUrl: window.location.href,
      });
    } catch (e) {
      this.error.set((e as Error).message ?? 'Checkout failed');
      this.loading.set(false);
    }
  }
}
