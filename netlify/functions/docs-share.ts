// POST /api/docs-share {id, enabled}: turn a public share link on or off (paid plans).
// GET  /api/docs-share?t=<token>: read a shared document (no sign-in).
import type { Handler } from '@netlify/functions';
import { json, errorResponse, parseBody, HttpError } from '../../src/server/http';
import { requireUser, ensureProfile, getPlan, supabaseAdmin } from '../../src/server/supabase';
import { randomToken } from '../../src/server/crypto';

export const handler: Handler = async (event) => {
  try {
    const db = supabaseAdmin();
    if (event.httpMethod === 'GET') {
      const token = event.queryStringParameters?.t || '';
      if (token.length < 16) return json(404, { error: 'This link is not valid.' });
      const { data } = await db
        .from('gs_docs')
        .select('title, content, repo_full_name, kind, updated_at')
        .eq('share_token', token)
        .eq('status', 'done')
        .maybeSingle();
      if (!data) return json(404, { error: 'This link is not valid or was turned off.' });
      return json(200, data);
    }

    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
    const user = await requireUser(event);
    const { id, enabled } = parseBody(event);
    const profile = await ensureProfile(user);
    const plan = await getPlan(user.id);
    if (enabled && !plan.shareLinks && profile.role !== 'admin') {
      throw new HttpError(402, 'Share links are on the Pro plan.', { code: 'upgrade', plan: 'pro' });
    }
    const share_token = enabled ? randomToken() : null;
    const { data, error } = await db
      .from('gs_docs')
      .update({ share_token })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'done')
      .select('share_token')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, 'Document not found.');
    return json(200, { shareToken: data.share_token });
  } catch (err) {
    return errorResponse(err);
  }
};
