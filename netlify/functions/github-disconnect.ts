// POST /api/github-disconnect: forget the stored GitHub token.
import type { Handler } from '@netlify/functions';
import { json, errorResponse } from '../../src/server/http';
import { requireUser, supabaseAdmin } from '../../src/server/supabase';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(event);
    await supabaseAdmin().from('gs_github_tokens').delete().eq('user_id', user.id);
    return json(200, { ok: true });
  } catch (err) {
    return errorResponse(err);
  }
};
