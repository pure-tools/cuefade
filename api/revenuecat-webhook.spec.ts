import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  eq: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: function createClient() {
    return { from: mocks.from };
  },
}));

import handler from './revenuecat-webhook';

const SECRET = 'rc-secret';
const USER = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e';

/** auth: null = no Authorization header */
const makeReq = (method: string, body: unknown = {}, auth: string | null = `Bearer ${SECRET}`): VercelRequest =>
  ({ method, body, headers: auth === null ? {} : { authorization: auth } }) as unknown as VercelRequest;

const makeRes = () => {
  const r = {} as VercelResponse;
  r.status = vi.fn().mockReturnValue(r) as unknown as VercelResponse['status'];
  r.json = vi.fn().mockReturnValue(r) as unknown as VercelResponse['json'];
  r.end = vi.fn().mockReturnValue(r) as unknown as VercelResponse['end'];
  return r;
};

const event = (overrides: Record<string, unknown> = {}) => ({
  event: {
    type: 'NON_RENEWING_PURCHASE',
    app_user_id: USER,
    original_app_user_id: USER,
    aliases: [USER],
    entitlement_ids: ['pro'],
    store: 'APP_STORE',
    ...overrides,
  },
});

describe('revenuecat-webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('REVENUECAT_WEBHOOK_AUTH', SECRET);
    mocks.eq.mockResolvedValue({ error: null });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.from.mockReturnValue({ update: mocks.update });
  });

  afterEach(() => vi.unstubAllEnvs());

  it('returns 405 for non-POST requests', async () => {
    const res = makeRes();
    await handler(makeReq('GET'), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 500 when the webhook secret is not configured', async () => {
    vi.stubEnv('REVENUECAT_WEBHOOK_AUTH', '');
    const res = makeRes();
    await handler(makeReq('POST', event()), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([null, 'Bearer wrong', `Bearer ${SECRET}x`, SECRET])('rejects authorization %s', async (auth) => {
    const res = makeRes();
    await handler(makeReq('POST', event(), auth), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('returns 400 without an event', async () => {
    const res = makeRes();
    await handler(makeReq('POST', {}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('grants Pro for an App Store purchase', async () => {
    const res = makeRes();
    await handler(makeReq('POST', event()), res);

    expect(mocks.from).toHaveBeenCalledWith('profiles');
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ is_pro: true, pro_source: 'app_store' }));
    expect(mocks.eq).toHaveBeenCalledWith('id', USER);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('records Google Play as the source', async () => {
    await handler(makeReq('POST', event({ store: 'PLAY_STORE', type: 'INITIAL_PURCHASE' })), makeRes());
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ pro_source: 'play_store' }));
  });

  it('finds the Supabase id among aliases when app_user_id is anonymous', async () => {
    await handler(makeReq('POST', event({
      app_user_id: '$RCAnonymousID:abc',
      original_app_user_id: '$RCAnonymousID:abc',
      aliases: ['$RCAnonymousID:abc', USER],
    })), makeRes());
    expect(mocks.eq).toHaveBeenCalledWith('id', USER);
  });

  it('grants the receiving user on TRANSFER', async () => {
    const other = '11111111-2222-4333-8444-555555555555';
    await handler(makeReq('POST', event({ type: 'TRANSFER', transferred_to: [other], app_user_id: undefined })), makeRes());
    expect(mocks.eq).toHaveBeenCalledWith('id', other);
  });

  it('skips when no Supabase user id is known', async () => {
    const res = makeRes();
    await handler(makeReq('POST', event({ app_user_id: '$RCAnonymousID:x', original_app_user_id: undefined, aliases: [] })), res);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('ignores purchases of other entitlements', async () => {
    await handler(makeReq('POST', event({ entitlement_ids: ['soundpack'] })), makeRes());
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each(['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE', 'TEST'])('does not change Pro on %s', async (type) => {
    const res = makeRes();
    await handler(makeReq('POST', event({ type })), res);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 so RevenueCat retries when the update fails', async () => {
    mocks.eq.mockResolvedValue({ error: { message: 'db down' } });
    const res = makeRes();
    await handler(makeReq('POST', event()), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
