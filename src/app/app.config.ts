import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withHashLocation,
  withComponentInputBinding,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { MUSIC_PROVIDERS } from './core/providers/provider.token';
import { YouTubeProvider } from './core/providers/youtube/youtube.provider';
import { SpotifyProvider } from './core/providers/spotify/spotify.provider';
import { SoundCloudProvider } from './core/providers/soundcloud/soundcloud.provider';
import { provideResponsive } from '@pure-tools/mobilka';
import { providePayments } from '@pure-tools/monetka';
import { provideTheme } from '@pure-tools/paletka';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation(), withComponentInputBinding()),
    provideHttpClient(),

    // Music providers — order matters for URL resolution
    { provide: MUSIC_PROVIDERS, useClass: YouTubeProvider, multi: true },
    { provide: MUSIC_PROVIDERS, useClass: SpotifyProvider, multi: true },
    { provide: MUSIC_PROVIDERS, useClass: SoundCloudProvider, multi: true },

    provideResponsive({ strategy: 'combination' }),
    providePayments({ provider: 'stripe', publicKey: environment.stripePublicKey, productId: environment.stripePriceId }),
    provideTheme(),
  ],
};
