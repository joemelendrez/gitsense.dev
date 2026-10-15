// Background function (Netlify runs *-background functions for up to 15
// minutes and answers the caller with 202 right away). Reading a repo and
// writing a long document can take a few minutes, which a normal function
// can't wait for.
import type { Handler } from '@netlify/functions';
import { supabaseAdmin } from '../../src/server/supabase';
import { openRepo, buildRepoContext, buildChangelogInput, parseRepo } from '../../src/server/github';
import { generateDoc, repoContextText } from '../../src/server/generate';
import { timingSafeEqualStr } from '../../src/server/crypto';
import type { DocKind } from '../../src/lib/plans';

export const handler: Handler = async (event) => {
  const secret = process.env.GS_INTERNAL_SECRET || '';
  if (!secret || !timingSafeEqualStr(event.headers['x-gs-internal'] || '', secret)) {
    return { statusCode: 401, body: '' };
  }

  const { docId } = JSON.parse(event.body || '{}');
  if (!docId) return { statusCode: 400, body: '' };

  const db = supabaseAdmin();
  const { data: doc } = await db.from('gs_docs').select('*').eq('id', docId).maybeSingle();
  if (!doc || doc.status !== 'queued') return { statusCode: 200, body: '' };

  await db.from('gs_docs').update({ status: 'running', updated_at: new Date().toISOString() }).eq('id', docId);

  try {
    const ref = parseRepo(doc.repo_full_name)!;
    const repo = await openRepo(doc.user_id, ref);
    // Re-check at run time: a repo can't become readable just because the
    // server token can see it.
    if (repo.meta.private && !repo.usingUserToken) throw new Error('Private repo without a GitHub connection.');

    const kind = doc.kind as DocKind;
    const options = doc.options || {};
    const gitRef = doc.ref || repo.meta.default_branch;
    const budget = kind === 'changelog' ? 30_000 : Number(options.contextChars) || 120_000;

    const context = await buildRepoContext(repo, ref, gitRef, budget);
    const changelog =
      kind === 'changelog' ? await buildChangelogInput(repo, ref, options.from, gitRef) : undefined;

    const result = await generateDoc({
      kind,
      repoText: repoContextText(repo.meta, context),
      changelog,
      audience: options.audience,
      extraInstructions: options.instructions,
    });

    await db
      .from('gs_docs')
      .update({
        status: 'done',
        title: result.title,
        content: result.content,
        model: result.model,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', docId);
  } catch (err: any) {
    console.error(`Doc ${docId} failed`, err);
    // Failed docs don't count against the monthly allowance.
    await db
      .from('gs_docs')
      .update({
        status: 'failed',
        error: friendlyError(err),
        updated_at: new Date().toISOString(),
      })
      .eq('id', docId);
  }
  return { statusCode: 200, body: '' };
};

function friendlyError(err: any): string {
  if (err?.status === 404) return 'That branch, tag or commit was not found.';
  if (err?.status === 409) return 'This repository is empty.';
  if (err?.status === 403) return 'GitHub rate limit reached. Please try again in a few minutes.';
  if (typeof err?.message === 'string' && err.message.length < 200) return err.message;
  return 'Generation failed. This one does not count toward your monthly allowance.';
}
