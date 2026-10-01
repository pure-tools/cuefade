import {
  DestroyRef, Injectable, Injector, effect, inject, makeEnvironmentProviders,
  provideEnvironmentInitializer, type EnvironmentProviders,
} from '@angular/core';
import { AnalyticsService } from '@pure-tools/slushalka';
import { filter } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CrossfadeService } from '../services/crossfade.service';

/**
 * App-wide analytics that don't belong to a single component:
 * identity, plan, crossfades (manual + automatic) and upgrade completion.
 */
@Injectable({ providedIn: 'root' })
export class CuefadeAnalytics {
  private readonly analytics = inject(AnalyticsService);
  private readonly auth = inject(AuthService);
  private readonly crossfade = inject(CrossfadeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  start(): void {
    let identifiedAs: string | null = null;
    effect(() => {
      if (this.auth.loading()) return;
      const userId = this.auth.user()?.id ?? null;
      const plan = this.auth.isPro() ? 'pro' : 'free';
      this.analytics.setSuperProps({ plan });
      if (userId) {
        this.analytics.identify(userId, { plan });
      } else if (identifiedAs) {
        // Reset only on logout — resetting anonymous visitors would rotate their id every load
        this.analytics.reset();
      }
      identifiedAs = userId;
    }, { injector: this.injector });

    const sub = this.crossfade.crossfadeEvents$
      .pipe(filter(e => e.type === 'started'))
      .subscribe(() =>
        this.analytics.track('crossfade_started', { durationSec: this.crossfade.transitionDuration() }),
      );
    this.destroyRef.onDestroy(() => sub.unsubscribe());

    // Stripe success redirect lands on /?upgraded=1
    if (window.location.search.includes('upgraded=1')) {
      this.analytics.track('checkout_completed');
    }
  }
}

/** Load the Umami tracker only when a website id is configured (production). */
export function loadUmami(websiteId: string, doc: Document = document): void {
  if (!websiteId) return;
  const script = doc.createElement('script');
  script.defer = true;
  script.src = 'https://cloud.umami.is/script.js';
  script.dataset['websiteId'] = websiteId;
  // Page views come from providePageViewTracking() — hash routes are invisible to auto-track
  script.dataset['autoTrack'] = 'false';
  doc.head.appendChild(script);
}

export function provideCuefadeAnalytics(umamiWebsiteId: string): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      loadUmami(umamiWebsiteId);
      inject(CuefadeAnalytics).start();
    }),
  ]);
}
