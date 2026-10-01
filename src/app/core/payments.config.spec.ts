import { describe, it, expect } from 'vitest';
import { paymentsConfig, currentPlatform, type PaymentEnv } from './payments.config';

const env: PaymentEnv = {
  stripePublicKey: 'pk_live_x',
  stripePriceId: 'price_x',
  revenuecatAppleKey: 'appl_x',
  revenuecatGoogleKey: 'goog_x',
  iapProductId: 'pro_lifetime',
};

describe('paymentsConfig', () => {
  it('uses Stripe on the web', () => {
    expect(paymentsConfig(env, 'web')).toEqual({ provider: 'stripe', publicKey: 'pk_live_x', productId: 'price_x' });
  });

  it.each(['ios', 'android'] as const)('uses store billing on %s', (platform) => {
    const config = paymentsConfig(env, platform);
    expect(config.provider).toBe('in-app');
    expect(config.productId).toBe('pro_lifetime');
    expect(config.bridge).toBeDefined();
  });

  it('detects the browser as web', () => {
    expect(currentPlatform()).toBe('web');
    expect(paymentsConfig(env).provider).toBe('stripe');
  });
});
