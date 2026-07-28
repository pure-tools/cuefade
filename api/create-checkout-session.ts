import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productId, email, successUrl, cancelUrl, metadata } = req.body as {
    productId?: string;
    email?: string;
    successUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, string>;
  };

  if (!productId) {
    return res.status(400).json({ error: 'productId is required' });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: productId, quantity: 1 }],
    customer_email: email,
    success_url: successUrl ?? `${req.headers.origin}/success`,
    cancel_url: cancelUrl ?? `${req.headers.origin}/`,
    metadata,
  });

  return res.status(200).json({ url: session.url, sessionId: session.id });
}
