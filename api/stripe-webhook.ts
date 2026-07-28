import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!);
const supabase = createClient(
  process.env['SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!   // service role — bypasses RLS
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature' });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as string,
      sig,
      process.env['STRIPE_WEBHOOK_SECRET']!
    );
  } catch {
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.['supabase_user_id'];
    if (!userId) return res.status(200).json({ received: true });

    await supabase
      .from('profiles')
      .update({
        is_pro: true,
        stripe_customer_id: session.customer as string,
        pro_activated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  return res.status(200).json({ received: true });
}
