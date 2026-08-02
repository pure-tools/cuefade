import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  from: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: function StripeConstructor() {
    return { webhooks: { constructEvent: mocks.constructEvent } };
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: function createClient() {
    return { from: mocks.from };
  },
}));

import handler from './stripe-webhook';

const makeReq = (method: string, body: unknown = '', sig?: string): VercelRequest =>
  ({ method, body, headers: { 'stripe-signature': sig } }) as unknown as VercelRequest;

const makeRes = () => {
  const r = {} as VercelResponse;
  r.status = vi.fn().mockReturnValue(r) as unknown as VercelResponse['status'];
  r.json = vi.fn().mockReturnValue(r) as unknown as VercelResponse['json'];
  r.end = vi.fn().mockReturnValue(r) as unknown as VercelResponse['end'];
  return r;
};

const completedEvent = (userId: string | undefined) => ({
  type: 'checkout.session.completed',
  data: {
    object: {
      customer: 'cus_test_123',
      metadata: { supabase_user_id: userId },
    },
  },
});

describe('stripe-webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eq.mockReturnValue({ eq: mocks.eq });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.from.mockReturnValue({ update: mocks.update });
  });

  it('returns 405 for non-POST requests', async () => {
    const res = makeRes();
    await handler(makeReq('GET'), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    const res = makeRes();
    await handler(makeReq('POST', 'raw-body', undefined), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing stripe-signature' });
  });

  it('returns 400 when signature verification fails', async () => {
    mocks.constructEvent.mockImplementation(() => { throw new Error('No signatures found'); });
    const res = makeRes();
    await handler(makeReq('POST', 'raw-body', 'invalid-sig'), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Webhook signature verification failed' });
  });

  it('updates is_pro on checkout.session.completed', async () => {
    mocks.constructEvent.mockReturnValue(completedEvent('user-123'));
    const res = makeRes();
    await handler(makeReq('POST', 'raw-body', 'valid-sig'), res);

    expect(mocks.from).toHaveBeenCalledWith('profiles');
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        is_pro: true,
        stripe_customer_id: 'cus_test_123',
      })
    );
    expect(mocks.eq).toHaveBeenCalledWith('id', 'user-123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('skips profile update when supabase_user_id missing in metadata', async () => {
    mocks.constructEvent.mockReturnValue(completedEvent(undefined));
    const res = makeRes();
    await handler(makeReq('POST', 'raw-body', 'valid-sig'), res);

    expect(mocks.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('ignores unknown event types without touching Supabase', async () => {
    mocks.constructEvent.mockReturnValue({ type: 'payment_intent.created', data: { object: {} } });
    const res = makeRes();
    await handler(makeReq('POST', 'raw-body', 'valid-sig'), res);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
