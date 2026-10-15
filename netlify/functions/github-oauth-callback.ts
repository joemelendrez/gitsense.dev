// GET /api/github-oauth-callback: GitHub redirects here after the user approves.
import type { Handler } from '@netlify/functions';
import { Octokit } from '@octokit/rest';
import { redirect, siteUrl } from '../../src/server/http';
import { verifyState, encrypt } from '../../src/server/crypto';
import { supabaseAdmin } from '../../src/server/supabase';

export const handler: Handler = async (event) => {
  const back = (status: string) => redirect(`${siteUrl()}/app/?github=${status}`);
  const { code, state, error } = event.queryStringParameters || {};
  if (error) return back('denied');

  const userId = verifyState(state || '');
  if (!userId || !code) return back('invalid');

  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${siteUrl()}/api/github-oauth-callback`,
      }),
    });
    const data = await res.json();
    if (!data.access_token) {
      console.error('GitHub token exchange failed', data.error, data.error_description);
      return back('failed');
    }

    const { data: me } = await new Octokit({ auth: data.access_token }).users.getAuthenticated();
    const { error: dbError } = await supabaseAdmin().from('gs_github_tokens').upsert({
      user_id: userId,
      github_login: me.login,
      scopes: data.scope || '',
      token_ciphertext: encrypt(data.access_token),
      updated_at: new Date().toISOString(),
    });
    if (dbError) throw dbError;
    return back('connected');
  } catch (err) {
    console.error('GitHub connect failed', err);
    return back('failed');
  }
};
