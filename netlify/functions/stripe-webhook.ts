// POST /api/stripe-webhook: Stripe calls this server to server.
// The signature check is the authorization; the user id comes from metadata
// we set when creating the customer/subscription, never from the client.
import type { Handler } from '@netlify/functions';
import type Stripe from 'stripe';
import { stripe, planFromPriceId } from '../../src/server/stripe';
import { supabaseAdmin } from '../../src/server/supabase';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };
  const signature = event.headers['stripe-signature'] || '';
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : event.body || '';

  let evt: Stripe.Event;
  try {
    evt = stripe().webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    console.error('Stripe signature check failed', err.message);
    return { statusCode: 400, body: 'Bad signature' };
  }

  try {
    if (evt.type === 'checkout.session.completed') {
      const session = evt.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const sub = await stripe().subscriptions.retrieve(session.subscription as string);
        await saveSubscription(sub, session.client_reference_id || undefined);
      }
    } else if (
      evt.type === 'customer.subscription.created' ||
      evt.type === 'customer.subscription.updated' ||
      evt.type === 'customer.subscription.deleted'
    ) {
      await saveSubscription(evt.data.object as Stripe.Subscription);
    }
    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error('Stripe webhook failed', err);
    return { statusCode: 500, body: 'error' };
  }
};

async function saveSubscription(sub: Stripe.Subscription, fallbackUserId?: string) {
  const userId = sub.metadata?.gs_user_id || fallbackUserId;
  if (!userId) {
    console.error(`Subscription ${sub.id} has no gs_user_id`);
    return;
  }
  const item = sub.items.data[0];
  const plan = planFromPriceId(item?.price?.id) || 'free';
  const periodEnd = (item as any)?.current_period_end || (sub as any).current_period_end;
  const { error } = await supabaseAdmin()
    .from('gs_subscriptions')
    .upsert({
      user_id: userId,
      plan: sub.status === 'canceled' ? 'free' : plan,
      status: sub.status,
      stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}
