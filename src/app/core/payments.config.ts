import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { revenueCatBridge, type PaymentConfig } from '@pure-tools/monetka';

export interface PaymentEnv {
  stripePublicKey: string;
  stripePriceId: string;
  revenuecatAppleKey: string;
  revenuecatGoogleKey: string;
  iapProductId: string;
}

type Platform = 'ios' | 'android' | 'web';

export function currentPlatform(): Platform {
  try {
    return Capacitor.getPlatform() as Platform;
  } catch {
    return 'web';
  }
}

/**
 * App Store and Google Play require store billing for digital unlocks, so the native
 * apps buy through RevenueCat; the website keeps Stripe Checkout.
 */
export function paymentsConfig(env: PaymentEnv, platform: Platform = currentPlatform()): PaymentConfig {
  if (platform === 'web') {
    return { provider: 'stripe', publicKey: env.stripePublicKey, productId: env.stripePriceId };
  }
  return {
    provider: 'in-app',
    publicKey: '',
    productId: env.iapProductId,
    bridge: revenueCatBridge(Purchases, {
      apiKey: platform === 'ios' ? env.revenuecatAppleKey : env.revenuecatGoogleKey,
    }),
  };
}
