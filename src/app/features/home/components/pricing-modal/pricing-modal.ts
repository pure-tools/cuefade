import { Component, input, output } from '@angular/core';

// TODO: replace with your Lemon Squeezy / Gumroad checkout URL
const PAYMENT_URL = 'https://buy.stripe.com/TODO';
const KOFI_URL = 'https://ko-fi.com/TODO';

@Component({
  selector: 'app-pricing-modal',
  standalone: true,
  templateUrl: './pricing-modal.html',
})
export class PricingModalComponent {
  visible = input(false);
  close = output();

  readonly paymentUrl = PAYMENT_URL;
  readonly kofiUrl = KOFI_URL;

  readonly proFeatures = [
    'Add songs to the queue while mixing',
    'Set custom Cue In / Cue Out points per track',
    'All crossfade durations (up to 20 s)',
    'No ads',
    'Spotify & SoundCloud support (when available)',
    'Export mix as timestamped playlist',
  ];
}
