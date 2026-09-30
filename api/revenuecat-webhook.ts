import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

/*
 * RevenueCat → cuefade: grants Pro for App Store / Google Play purchases.
 * RevenueCat dashboard → Integrations → Webhooks:
 *   URL:                  https://cuefade.app/api/revenuecat-webhook
 *   Authorization header: Bearer <REVENUECAT_WEBHOOK_AUTH>
 * The app configures RevenueCat with the Supabase user id as app_user_id (monetka revenueCatBridge).
 */

const supabase = createClient(
  process.env['SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!   // service role — bypasses RLS
);

const PRO_ENTITLEMENT = 'pro';

// Events that mean the user owns Pro. Sandbox purchases are accepted on purpose:
// App Review and TestFlight buy in sandbox against the production backend.
const GRANT_EVENTS = new Set(['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'TRANSFER']);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RevenueCatEvent {
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  transferred_to?: string[];
  entitlement_ids?: string[] | null;
  store?: string;
}

function authorized(header: string | undefined, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header ?? '');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Supabase user id among the ids RevenueCat knows for this customer (skips $RCAnonymousID:…). */
function supabaseUserId(e: RevenueCatEvent): string | undefined {
  const candidates = [
    ...(e.type === 'TRANSFER' ? e.transferred_to ?? [] : []),
    e.app_user_id,
    e.original_app_user_id,
    ...(e.aliases ?? []),
  ];
  return candidates.find((id): id is string => !!id && UUID.test(id));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const secret = process.env['REVENUECAT_WEBHOOK_AUTH'];
  if (!secret) return res.status(500).json({ error: 'Webhook not configured' });
  if (!authorized(req.headers['authorization'] as string | undefined, secret)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const event = (req.body as { event?: RevenueCatEvent } | undefined)?.event;
  if (!event?.type) return res.status(400).json({ error: 'Missing event' });

  // Refunds / expirations are not auto-revoked: a user may also own Pro via Stripe.
  // Handle those manually from the RevenueCat dashboard.
  if (!GRANT_EVENTS.has(event.type)) return res.status(200).json({ received: true });

  if (event.entitlement_ids && !event.entitlement_ids.includes(PRO_ENTITLEMENT)) {
    return res.status(200).json({ received: true });
  }

  const userId = supabaseUserId(event);
  if (!userId) return res.status(200).json({ received: true });

  const { error } = await supabase
    .from('profiles')
    .update({
      is_pro: true,
      pro_activated_at: new Date().toISOString(),
      pro_source: event.store === 'PLAY_STORE' ? 'play_store' : 'app_store',
    })
    .eq('id', userId);

  // 500 makes RevenueCat retry the delivery
  if (error) return res.status(500).json({ error: 'Profile update failed' });
  return res.status(200).json({ received: true });
}
