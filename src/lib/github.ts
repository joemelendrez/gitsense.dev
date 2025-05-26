import { Octokit } from '@octokit/rest';

export class GitHubService {
  private octokit: Octokit;
  private token?: string;

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.octokit = new Octokit({
      auth: this.token,
    });
  }

  async testConnection() {
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      return {
        success: true,
        user: data.login,
        // Fix: Safely access permissions with fallback
        scopes: (data as any).permissions || 'Unknown',
        avatar: data.avatar_url,
        name: data.name || data.login,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Authentication failed',
        status: error.status,
      };
    }
  }

  async getRepository(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });
      return {
        success: true,
        repository: data,
        isPrivate: data.private,
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(
          "Repository not found or you don't have access. For private repos, make sure you've added your GitHub token."
        );
      }
      if (error.status === 403) {
        throw new Error(
          'Access forbidden. Check your GitHub token permissions.'
        );
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
      if (error.status === 403) {
        throw new Error(
          'Access forbidden. Check your GitHub token permissions.'
        );
      }
      throw new Error(`Failed to fetch contents: ${error.message}`);
    }
  }

  async getFileContent(owner: string, repo: string, path: string) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      if ('content' in data && !Array.isArray(data)) {
        return Buffer.from(data.content, 'base64').toString();
      }
      throw new Error('File content not found or is a directory');
    } catch (error: any) {
      throw new Error(`Failed to fetch file content: ${error.message}`);
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
      for (const item of items.slice(0, 50)) {
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

  // Helper method to check if token has specific permissions
  async checkPermissions(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });

      return {
        canRead: true,
        canWrite: data.permissions?.push || false,
        canAdmin: data.permissions?.admin || false,
        isPrivate: data.private,
      };
    } catch (error: any) {
      return {
        canRead: false,
        canWrite: false,
        canAdmin: false,
        isPrivate: true,
        error: error.message,
      };
    }
  }
}
