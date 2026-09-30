import { Injectable, inject } from '@angular/core';
import { LicenseService } from '@pure-tools/monetka';

@Injectable({ providedIn: 'root' })
export class FeatureGateService {
  private license = inject(LicenseService);

  readonly canUseSpotify = this.license.isLicensed;
  readonly canUseSoundCloud = this.license.isLicensed;
  readonly canAddMultipleSources = this.license.isLicensed;
  readonly canUseCuePoints = this.license.isLicensed;
  readonly canExportMix = this.license.isLicensed;
  readonly canUseFade = this.license.isLicensed;
  readonly canAddToQueue = this.license.isLicensed;
  readonly canUseExtendedFadeDurations = this.license.isLicensed;
  readonly noAds = this.license.isLicensed;
  readonly canExportPlaylist = this.license.isLicensed;
}
