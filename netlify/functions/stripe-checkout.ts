// POST /api/stripe-checkout {plan}: Stripe Checkout for Pro or Team.
import type { Handler } from '@netlify/functions';
import { json, errorResponse, parseBody, siteUrl, HttpError } from '../../src/server/http';
import { requireUser, getSubscription, supabaseAdmin } from '../../src/server/supabase';
import { stripe, priceIdFor } from '../../src/server/stripe';
import { PAID_PLANS, PlanKey } from '../../src/lib/plans';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(event);
    const { plan } = parseBody<{ plan: PlanKey }>(event);
    if (!PAID_PLANS.includes(plan)) throw new HttpError(400, 'Pick a plan.');
    const price = priceIdFor(plan);
    if (!process.env.STRIPE_SECRET_KEY || !price) {
      throw new HttpError(503, 'Checkout for this plan is not open yet.');
    }

    const sub = await getSubscription(user.id);
    if (sub && (sub.status === 'active' || sub.status === 'trialing') && sub.plan !== 'free') {
      throw new HttpError(409, 'You already have a plan. Use Manage billing to switch.', { code: 'has_plan' });
    }

    let customerId = sub?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe().customers.create({ email: user.email, metadata: { gs_user_id: user.id } });
      customerId = customer.id;
      await supabaseAdmin()
        .from('gs_subscriptions')
        .upsert({ user_id: user.id, stripe_customer_id: customerId, updated_at: new Date().toISOString() });
    }

    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      subscription_data: { metadata: { gs_user_id: user.id } },
      allow_promotion_codes: true,
      success_url: `${siteUrl()}/app/?billing=success`,
      cancel_url: `${siteUrl()}/pricing/`,
    });
    return json(200, { url: session.url });
  } catch (err) {
    return errorResponse(err);
  }
};
