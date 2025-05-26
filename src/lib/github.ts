// src/lib/github.ts
import { Octokit } from '@octokit/rest'; // ← ADD THIS LINE!

export class GitHubService {
  private octokit: Octokit;
  private token?: string;

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN;

    // Fix: Create Octokit instance even without token
    this.octokit = new Octokit({
      auth: this.token || undefined, // Don't pass empty string
    });
  }

  async testConnection() {
    try {
      if (!this.token) {
        // For public access without token
        return {
          success: true,
          user: 'Anonymous',
          scopes: 'Public access only',
          rateLimit: '60 requests/hour',
        };
      }

      // With token - get authenticated user
      const { data } = await this.octokit.users.getAuthenticated();
      return {
        success: true,
        user: data.login,
        scopes: (data as any)?.permissions ?? 'Authenticated',
        avatar: data.avatar_url,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Connection failed',
      };
    }
  }

  async getRepository(owner: string, repo: string) {
    try {
      console.log(`Fetching repository: ${owner}/${repo}`);
      console.log(`Using token: ${this.token ? 'Yes' : 'No'}`);

      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });

      console.log('Repository data received:', {
        name: data.name,
        private: data.private,
        language: data.language,
      });

      return {
        success: true,
        repository: data,
        isPrivate: data.private,
      };
    } catch (error: any) {
      console.error('Repository fetch error:', {
        status: error.status,
        message: error.message,
        owner,
        repo,
      });

      if (error.status === 404) {
        throw new Error(
          `Repository '${owner}/${repo}' not found or is private. ${
            !this.token ? 'Try adding a GitHub token for private repos.' : ''
          }`
        );
      }
      if (error.status === 403) {
        throw new Error(
          'Access forbidden. You may have hit the rate limit or need a GitHub token.'
        );
      }
      if (error.status === 401) {
        throw new Error('Invalid GitHub token. Please check your token.');
      }

      throw new Error(`Failed to fetch repository: ${error.message}`);
    }
  }

  async getContents(owner: string, repo: string, path: string = '') {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      return data;
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Path not found: ${path}`);
      }
      throw new Error(`Failed to fetch contents: ${error.message}`);
    }
  }

  async getDirectoryTree(
    owner: string,
    repo: string,
    path: string = '',
    maxDepth: number = 3
  ) {
    if (maxDepth <= 0) return [];

    const tree: any[] = [];

    try {
      const contents = await this.getContents(owner, repo, path);
      const items = Array.isArray(contents) ? contents : [contents];

      // Limit items to prevent API abuse and timeout
      for (const item of items.slice(0, 20)) {
        if (item.type === 'dir' && maxDepth > 1) {
          try {
            const children = await this.getDirectoryTree(
              owner,
              repo,
              item.path,
              maxDepth - 1
            );
            tree.push({
              ...item,
              children,
            });
          } catch (error) {
            // Skip directories we can't access
            console.warn(`Skipping directory ${item.path}:`, error);
            tree.push({
              ...item,
              children: [],
              error: 'Access denied',
            });
          }
        } else {
          tree.push(item);
        }
      }

      return tree;
    } catch (error: any) {
      console.warn(`Error fetching directory tree for ${path}:`, error);
      return [];
    }
  }

  async getRateLimit() {
    try {
      const { data } = await this.octokit.rateLimit.get();
      return {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: new Date(data.rate.reset * 1000),
        used: data.rate.used,
      };
    } catch (error: any) {
      console.warn('Failed to get rate limit:', error);
      return {
        limit: 0,
        remaining: 0,
        reset: new Date(),
        used: 0,
      };
    }
  }
}
