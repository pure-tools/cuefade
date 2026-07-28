import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FeatureGateService {
  private auth = inject(AuthService);

  readonly canUseSpotify = computed(() => this.auth.isPro());
  readonly canUseSoundCloud = computed(() => this.auth.isPro());
  readonly canAddMultipleSources = computed(() => this.auth.isPro());
  readonly canUseCuePoints = computed(() => this.auth.isPro());
  readonly canExportMix = computed(() => this.auth.isPro());
}
