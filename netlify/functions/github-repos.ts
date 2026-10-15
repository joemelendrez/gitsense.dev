// GET /api/github-repos: the connected user's repos, most recently pushed first.
import type { Handler } from '@netlify/functions';
import { Octokit } from '@octokit/rest';
import { json, errorResponse } from '../../src/server/http';
import { requireUser } from '../../src/server/supabase';
import { userGithubToken } from '../../src/server/github';

export const handler: Handler = async (event) => {
  try {
    const user = await requireUser(event);
    const token = await userGithubToken(user.id);
    if (!token) return json(200, { connected: false, repos: [] });
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.repos.listForAuthenticatedUser({ sort: 'pushed', per_page: 100 });
    return json(200, {
      connected: true,
      repos: data.map((r) => ({
        full_name: r.full_name,
        private: r.private,
        description: r.description,
        default_branch: r.default_branch,
        pushed_at: r.pushed_at,
      })),
    });
  } catch (err: any) {
    if (err.status === 401) return json(401, { error: 'Your GitHub connection expired. Reconnect GitHub.', code: 'github_reconnect' });
    return errorResponse(err);
  }
};
