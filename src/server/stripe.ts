import Stripe from 'stripe';
import { PLANS, PAID_PLANS, PlanKey } from '../lib/plans';

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export function priceIdFor(plan: PlanKey): string | undefined {
  const env = PLANS[plan].stripePriceEnv;
  return env ? process.env[env] : undefined;
}

// Which paid plan a Stripe subscription is on, by matching its price id.
export function planFromPriceId(priceId: string | undefined | null): PlanKey | null {
  if (!priceId) return null;
  return PAID_PLANS.find((key) => priceIdFor(key) === priceId) || null;
}
