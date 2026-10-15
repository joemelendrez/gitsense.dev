// POST /api/stripe-portal: Stripe Billing Portal to switch plans or cancel.
import type { Handler } from '@netlify/functions';
import { json, errorResponse, siteUrl, HttpError } from '../../src/server/http';
import { requireUser, getSubscription } from '../../src/server/supabase';
import { stripe } from '../../src/server/stripe';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(event);
    const sub = await getSubscription(user.id);
    if (!sub?.stripe_customer_id) throw new HttpError(400, 'No billing account yet.');
    const session = await stripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${siteUrl()}/app/`,
    });
    return json(200, { url: session.url });
  } catch (err) {
    return errorResponse(err);
  }
};
