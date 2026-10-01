import { Component, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OfflineBanner } from './core/native/offline-banner';
import { AuthService } from './core/services/auth.service';
import { SessionTimeoutService } from '@pure-tools/babetka';
import { LicenseService } from '@pure-tools/monetka';
import { PRO_FEATURES } from './core/pro-features';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OfflineBanner],
  template: '<app-offline-banner /><router-outlet />',
  styles: [':host { display: block; height: 100vh; }'],
})
export class App {
  private auth = inject(AuthService);
  private sessionTimeout = inject(SessionTimeoutService);
  private license = inject(LicenseService);

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) this.sessionTimeout.start();
      else this.sessionTimeout.stop();
    });

    // Sync DB-backed pro status → LicenseService. Wait for auth init before revoking.
    effect(() => {
      if (this.auth.loading()) return;
      if (this.auth.isPro()) this.license.setLicensed(PRO_FEATURES);
      else this.license.revoke();
    });

    // After Stripe redirect with ?upgraded=1, refresh profile so isPro reflects payment.
    if (window.location.search.includes('upgraded=1')) {
      this.auth.refreshProfile();
    }
  }
}
