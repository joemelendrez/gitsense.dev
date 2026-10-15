// POST /api/github-oauth-start: returns the GitHub authorize URL.
// Uses GitSense's own GitHub OAuth app (not Supabase's sign-in provider), so
// any account, however it signed in, can connect GitHub for repo access.
import type { Handler } from '@netlify/functions';
import { json, errorResponse, siteUrl } from '../../src/server/http';
import { requireUser } from '../../src/server/supabase';
import { signState } from '../../src/server/crypto';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(event);
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) return json(503, { error: 'GitHub connection is not configured yet.' });
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${siteUrl()}/api/github-oauth-callback`,
      // repo: read private repos and open docs pull requests. read:user: show the login.
      scope: 'repo read:user',
      state: signState(user.id),
      allow_signup: 'true',
    });
    return json(200, { url: `https://github.com/login/oauth/authorize?${params}` });
  } catch (err) {
    return errorResponse(err);
  }
};
