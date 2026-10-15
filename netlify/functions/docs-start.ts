// POST /api/docs-start: checks access and the monthly allowance, queues a
// document, and hands it to the background generator.
import type { Handler } from '@netlify/functions';
import { json, errorResponse, parseBody, siteUrl, HttpError } from '../../src/server/http';
import { requireUser, ensureProfile, getPlan, docsUsedThisMonth, supabaseAdmin } from '../../src/server/supabase';
import { parseRepo, openRepo } from '../../src/server/github';
import { DOC_KINDS, DocKind, PLANS, nextPlanUp } from '../../src/lib/plans';

const MAX_INSTRUCTIONS = 1000;
const MAX_REF = 200;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(event);
    const body = parseBody(event);
    const kind = body.kind as DocKind;
    if (!DOC_KINDS[kind]) throw new HttpError(400, 'Pick a document type.');

    const ref = parseRepo(String(body.repo || ''));
    if (!ref) throw new HttpError(400, 'Enter a GitHub repo as owner/name or a github.com URL.');

    const instructions = String(body.instructions || '');
    if (instructions.length > MAX_INSTRUCTIONS) {
      throw new HttpError(400, `Extra instructions can be up to ${MAX_INSTRUCTIONS} characters.`);
    }
    const gitRef = String(body.ref || '').trim().slice(0, MAX_REF) || undefined;
    const from = String(body.from || '').trim().slice(0, MAX_REF) || undefined;
    const audience = String(body.audience || '').trim().slice(0, 200) || undefined;

    const profile = await ensureProfile(user);
    const isAdmin = profile.role === 'admin';
    const plan = isAdmin ? PLANS.team : await getPlan(user.id);

    const repo = await openRepo(user.id, ref);
    if (repo.meta.private && !plan.privateRepos) {
      throw new HttpError(402, `Private repos need the ${PLANS.pro.name} plan.`, { code: 'upgrade', plan: 'pro' });
    }

    if (!isAdmin) {
      const used = await docsUsedThisMonth(user.id);
      if (used >= plan.docsPerMonth) {
        const next = nextPlanUp(plan.key);
        throw new HttpError(
          429,
          next
            ? `You've used all ${plan.docsPerMonth} documents this month. ${next.name} gives you ${next.docsPerMonth}.`
            : `You've used all ${plan.docsPerMonth} documents this month. Your allowance resets on the 1st.`,
          { code: 'limit', plan: next?.key }
        );
      }
    }

    const db = supabaseAdmin();
    const { data: doc, error } = await db
      .from('gs_docs')
      .insert({
        user_id: user.id,
        repo_full_name: repo.meta.full_name,
        repo_private: repo.meta.private,
        ref: gitRef || repo.meta.default_branch,
        kind,
        options: { from, audience, instructions: instructions || undefined, contextChars: plan.contextChars },
        status: 'queued',
      })
      .select('id')
      .single();
    if (error) throw error;

    // Two requests racing past the check above both get inserted; recount and
    // back this one out if it pushed the month over the allowance.
    if (!isAdmin && (await docsUsedThisMonth(user.id)) > plan.docsPerMonth) {
      await db.from('gs_docs').delete().eq('id', doc.id);
      throw new HttpError(429, `You've used all ${plan.docsPerMonth} documents this month.`, { code: 'limit' });
    }

    const trigger = await fetch(`${siteUrl()}/.netlify/functions/generate-docs-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-gs-internal': process.env.GS_INTERNAL_SECRET || '' },
      body: JSON.stringify({ docId: doc.id }),
    });
    if (trigger.status !== 202 && !trigger.ok) {
      await db.from('gs_docs').update({ status: 'failed', error: 'Could not start the generator.' }).eq('id', doc.id);
      throw new HttpError(503, 'Could not start the generator. Please try again.');
    }

    return json(200, { id: doc.id });
  } catch (err) {
    return errorResponse(err);
  }
};
