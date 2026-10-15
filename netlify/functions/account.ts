// GET /api/account: plan, usage and GitHub connection for the signed-in user.
import type { Handler } from '@netlify/functions';
import { json, errorResponse } from '../../src/server/http';
import { requireUser, ensureProfile, getSubscription, docsUsedThisMonth, supabaseAdmin } from '../../src/server/supabase';
import { planFor, PLANS } from '../../src/lib/plans';

export const handler: Handler = async (event) => {
  try {
    const user = await requireUser(event);
    const [profile, sub, used, gh] = await Promise.all([
      ensureProfile(user),
      getSubscription(user.id),
      docsUsedThisMonth(user.id),
      supabaseAdmin().from('gs_github_tokens').select('github_login, scopes').eq('user_id', user.id).maybeSingle(),
    ]);
    const isAdmin = profile.role === 'admin';
    const plan = isAdmin ? PLANS.team : planFor(sub?.plan, sub?.status);
    return json(200, {
      profile: { id: user.id, email: user.email, full_name: profile.full_name, role: profile.role },
      plan: plan.key,
      status: sub?.status || 'inactive',
      currentPeriodEnd: sub?.current_period_end || null,
      hasBilling: !!sub?.stripe_customer_id,
      docsUsed: used,
      docsLimit: isAdmin ? null : plan.docsPerMonth,
      github: gh.data ? { login: gh.data.github_login, scopes: gh.data.scopes } : null,
    });
  } catch (err) {
    return errorResponse(err);
  }
};
