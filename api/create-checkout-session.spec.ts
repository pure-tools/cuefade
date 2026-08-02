import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mocks = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('stripe', () => ({
  default: function StripeConstructor() {
    return { checkout: { sessions: { create: mocks.create } } };
  },
}));

import handler from './create-checkout-session';

const makeReq = (method: string, body: Record<string, unknown> = {}, origin = 'https://cuefade.app'): VercelRequest =>
  ({ method, body, headers: { origin } }) as unknown as VercelRequest;

const makeRes = () => {
  const r = {} as VercelResponse;
  r.status = vi.fn().mockReturnValue(r) as unknown as VercelResponse['status'];
  r.json = vi.fn().mockReturnValue(r) as unknown as VercelResponse['json'];
  r.end = vi.fn().mockReturnValue(r) as unknown as VercelResponse['end'];
  return r;
};

describe('create-checkout-session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_test_123',
      id: 'cs_test_123',
    });
  });

  it('returns 405 for non-POST requests', async () => {
    const res = makeRes();
    await handler(makeReq('GET'), res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('returns 400 when productId is missing', async () => {
    const res = makeRes();
    await handler(makeReq('POST', { email: 'test@cuefade.app' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'productId is required' });
  });

  it('creates Stripe session with correct params', async () => {
    const res = makeRes();
    await handler(
      makeReq('POST', {
        productId: 'price_test_123',
        email: 'test@cuefade.app',
        userId: 'user-abc',
        successUrl: 'https://cuefade.app/?upgraded=1',
        cancelUrl: 'https://cuefade.app/',
      }),
      res
    );
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [{ price: 'price_test_123', quantity: 1 }],
        customer_email: 'test@cuefade.app',
        success_url: 'https://cuefade.app/?upgraded=1',
        cancel_url: 'https://cuefade.app/',
        metadata: expect.objectContaining({ supabase_user_id: 'user-abc' }),
      })
    );
  });

  it('returns url and sessionId on success', async () => {
    const res = makeRes();
    await handler(makeReq('POST', { productId: 'price_test_123' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      url: 'https://checkout.stripe.com/pay/cs_test_123',
      sessionId: 'cs_test_123',
    });
  });

  it('falls back to origin for success/cancel URL when not provided', async () => {
    const res = makeRes();
    await handler(makeReq('POST', { productId: 'price_test_123' }), res);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: 'https://cuefade.app/',
        cancel_url: 'https://cuefade.app/',
      })
    );
  });
});
