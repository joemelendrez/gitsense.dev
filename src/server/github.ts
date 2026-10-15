// Reading repositories for the docs generator.
// A user's own GitHub token (connected through our OAuth app) is used when
// they have one. Without it we fall back to the server's GITHUB_TOKEN, but
// only for public repos: that token can see Joseph's private repos, so the
// fallback must never be used to read a private one.
import { Octokit } from '@octokit/rest';
import { supabaseAdmin } from './supabase';
import { decrypt } from './crypto';
import { HttpError } from './http';

export interface RepoRef {
  owner: string;
  repo: string;
}

export function parseRepo(input: string): RepoRef | null {
  const trimmed = (input || '').trim().replace(/\.git$/, '').replace(/\/+$/, '');
  const m =
    trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)/i) ||
    trimmed.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

export async function userGithubToken(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from('gs_github_tokens')
    .select('token_ciphertext')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data?.token_ciphertext) return null;
  try {
    return decrypt(data.token_ciphertext);
  } catch (err) {
    console.error('Could not decrypt GitHub token', err);
    return null;
  }
}

export interface ResolvedRepo {
  octokit: Octokit;
  usingUserToken: boolean;
  meta: {
    full_name: string;
    private: boolean;
    default_branch: string;
    description: string | null;
    language: string | null;
    topics: string[];
    html_url: string;
  };
}

// Opens a repo with the right credentials and returns its metadata.
export async function openRepo(userId: string, ref: RepoRef): Promise<ResolvedRepo> {
  const token = await userGithubToken(userId);
  if (token) {
    const octokit = new Octokit({ auth: token });
    try {
      const { data } = await octokit.repos.get({ owner: ref.owner, repo: ref.repo });
      return { octokit, usingUserToken: true, meta: pickMeta(data) };
    } catch (err: any) {
      if (err.status === 401) {
        throw new HttpError(401, 'Your GitHub connection expired. Reconnect GitHub and try again.', {
          code: 'github_reconnect',
        });
      }
      if (err.status !== 404) throw err;
      // 404 with the user's token: not visible to them. Fall through to the
      // public check so a typo still gets a clear message.
    }
  }

  const octokit = new Octokit(process.env.GITHUB_TOKEN ? { auth: process.env.GITHUB_TOKEN } : {});
  try {
    const { data } = await octokit.repos.get({ owner: ref.owner, repo: ref.repo });
    if (data.private) {
      throw new HttpError(404, 'Repository not found. Connect GitHub to use private repos.', {
        code: 'github_connect',
      });
    }
    return { octokit, usingUserToken: false, meta: pickMeta(data) };
  } catch (err: any) {
    if (err instanceof HttpError) throw err;
    if (err.status === 404) {
      throw new HttpError(
        404,
        token
          ? 'Repository not found, or your GitHub account can not see it.'
          : 'Repository not found. If it is private, connect GitHub first.',
        { code: token ? 'not_found' : 'github_connect' }
      );
    }
    throw err;
  }
}

function pickMeta(data: any): ResolvedRepo['meta'] {
  return {
    full_name: data.full_name,
    private: !!data.private,
    default_branch: data.default_branch,
    description: data.description,
    language: data.language,
    topics: data.topics || [],
    html_url: data.html_url,
  };
}

// ---------- Choosing which files to read ----------

const SKIP_DIRS =
  /(^|\/)(node_modules|vendor|dist|build|out|\.next|\.nuxt|\.git|coverage|__pycache__|\.venv|venv|target|bin|obj|\.idea|\.vscode|public\/assets|\.turbo|\.cache|Pods|DerivedData)(\/|$)/;
const SKIP_FILES =
  /(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|Cargo\.lock|poetry\.lock|Gemfile\.lock|composer\.lock|go\.sum|\.min\.(js|css)|\.map)$/i;
const BINARY_EXT =
  /\.(png|jpe?g|gif|webp|avif|ico|svg|pdf|zip|gz|tgz|tar|mp[34]|mov|wav|ogg|woff2?|ttf|otf|eot|jar|class|exe|dll|so|dylib|bin|wasm|psd|sketch|fig|db|sqlite|pyc)$/i;
const SOURCE_EXT =
  /\.(ts|tsx|js|jsx|mjs|cjs|py|rb|go|rs|java|kt|swift|php|cs|scala|ex|exs|vue|svelte|astro|sql|prisma|graphql|gql|proto|sh|tf|ya?ml|toml)$/i;

function scorePath(path: string): number {
  const p = path.toLowerCase();
  const base = p.split('/').pop() || p;
  const depth = p.split('/').length - 1;
  if (/^readme(\.\w+)?$/.test(p)) return 1000;
  if (/^(package\.json|pyproject\.toml|requirements\.txt|go\.mod|cargo\.toml|gemfile|composer\.json|pom\.xml|build\.gradle(\.kts)?|mix\.exs)$/.test(p)) return 950;
  if (/^(claude\.md|agents\.md|contributing\.md|architecture\.md)$/.test(p)) return 900;
  if (/\.env\.(example|sample|template)$|^\.env\.example$/.test(base)) return 880;
  if (/^(dockerfile|docker-compose\.ya?ml|compose\.ya?ml|makefile|procfile|netlify\.toml|vercel\.json|fly\.toml|render\.yaml|app\.json)$/.test(base) && depth <= 1) return 850;
  if (/^(next|vite|nuxt|svelte|astro|webpack|remix|tailwind)\.config\.\w+$|^tsconfig\.json$/.test(base) && depth <= 1) return 700;
  if (/^docs\/.*\.md$/.test(p)) return 650;
  if (/schema\.prisma$|(^|\/)migrations?\/.*\.sql$|(^|\/)schema\.(sql|graphql)$/.test(p)) return 620;
  if (/(^|\/)(index|main|app|server|cli|__init__|mod|lib)\.\w+$/.test(p) && depth <= 2) return 600;
  if (/(^|\/)(routes?|api|pages|app|controllers?|handlers?|services?|models?|store|lib|server|functions?)\//.test(p)) return 500 - depth * 20;
  if (/\.github\/workflows\/.*\.ya?ml$/.test(p)) return 450;
  if (/\.(test|spec)\.\w+$|(^|\/)(tests?|__tests__|spec)\//.test(p)) return 150 - depth * 5;
  if (SOURCE_EXT.test(p)) return 300 - depth * 25;
  if (/\.md$/.test(p)) return 250 - depth * 20;
  return 50 - depth * 10;
}

export interface RepoContext {
  ref: string;
  tree: string[];
  treeTruncated: boolean;
  files: { path: string; content: string; truncated: boolean }[];
  skipped: number;
}

const PER_FILE_CHARS = 14_000;

export async function buildRepoContext(
  repo: ResolvedRepo,
  ref: RepoRef,
  gitRef: string,
  budgetChars: number
): Promise<RepoContext> {
  const { octokit } = repo;
  const { data: tree } = await octokit.git.getTree({
    owner: ref.owner,
    repo: ref.repo,
    tree_sha: gitRef,
    recursive: 'true',
  });

  const blobs = (tree.tree || []).filter(
    (n: any) =>
      n.type === 'blob' &&
      n.path &&
      !SKIP_DIRS.test(n.path) &&
      !SKIP_FILES.test(n.path) &&
      !BINARY_EXT.test(n.path)
  );
  const treeList = blobs.map((n: any) => n.path as string).slice(0, 2500);

  const candidates = blobs
    .filter((n: any) => (n.size || 0) < 300_000)
    .map((n: any) => ({ path: n.path as string, size: n.size || 0, score: scorePath(n.path) }))
    .sort((a, b) => b.score - a.score || a.size - b.size);

  // Reserve room for the file tree itself.
  let remaining = budgetChars - Math.min(treeList.join('\n').length, 40_000);
  const picked: typeof candidates = [];
  for (const c of candidates) {
    if (remaining <= 2_000) break;
    const cost = Math.min(c.size, PER_FILE_CHARS) + 100;
    if (cost > remaining) continue;
    picked.push(c);
    remaining -= cost;
    if (picked.length >= 220) break;
  }

  const files: RepoContext['files'] = [];
  let index = 0;
  const worker = async () => {
    while (index < picked.length) {
      const item = picked[index++];
      try {
        const res = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
          owner: ref.owner,
          repo: ref.repo,
          path: item.path,
          ref: gitRef,
          mediaType: { format: 'raw' },
        });
        const text = typeof res.data === 'string' ? res.data : String(res.data ?? '');
        if (text.includes('\u0000')) continue; // binary that slipped past the filters
        files.push({
          path: item.path,
          content: text.length > PER_FILE_CHARS ? text.slice(0, PER_FILE_CHARS) : text,
          truncated: text.length > PER_FILE_CHARS,
        });
      } catch (err: any) {
        console.warn(`Skipped ${item.path}: ${err.status || err.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));

  // Keep the order deterministic (helps prompt caching across doc kinds).
  const order = new Map(picked.map((p, i) => [p.path, i]));
  files.sort((a, b) => (order.get(a.path) ?? 0) - (order.get(b.path) ?? 0));

  return {
    ref: gitRef,
    tree: treeList,
    treeTruncated: !!tree.truncated || blobs.length > treeList.length,
    files,
    skipped: candidates.length - files.length,
  };
}

// ---------- Changelog input ----------

export interface ChangelogInput {
  from: string;
  to: string;
  commits: { sha: string; message: string; author: string; date: string }[];
  changedFiles: string[];
  totalCommits: number;
}

export async function buildChangelogInput(
  repo: ResolvedRepo,
  ref: RepoRef,
  fromRef: string | undefined,
  toRef: string
): Promise<ChangelogInput> {
  const { octokit } = repo;
  let from = fromRef;
  if (!from) {
    try {
      const { data } = await octokit.repos.getLatestRelease({ owner: ref.owner, repo: ref.repo });
      from = data.tag_name;
    } catch {
      const { data: tags } = await octokit.repos.listTags({ owner: ref.owner, repo: ref.repo, per_page: 1 });
      from = tags[0]?.name;
    }
  }

  if (!from) {
    // No releases or tags: use the most recent 100 commits.
    const { data } = await octokit.repos.listCommits({ owner: ref.owner, repo: ref.repo, sha: toRef, per_page: 100 });
    return {
      from: '(first commit)',
      to: toRef,
      commits: data.map(mapCommit),
      changedFiles: [],
      totalCommits: data.length,
    };
  }

  const { data } = await octokit.repos.compareCommitsWithBasehead({
    owner: ref.owner,
    repo: ref.repo,
    basehead: `${from}...${toRef}`,
    per_page: 250,
  });
  return {
    from,
    to: toRef,
    commits: (data.commits || []).map(mapCommit),
    changedFiles: (data.files || []).map((f: any) => `${f.status} ${f.filename}`).slice(0, 300),
    totalCommits: data.total_commits,
  };
}

function mapCommit(c: any) {
  return {
    sha: (c.sha || '').slice(0, 7),
    message: (c.commit?.message || '').slice(0, 1500),
    author: c.author?.login || c.commit?.author?.name || 'unknown',
    date: c.commit?.author?.date || '',
  };
}
