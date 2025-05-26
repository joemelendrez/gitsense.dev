// src/lib/github.ts - Enhanced version
import { Octokit } from '@octokit/rest'

export class GitHubService {
  private octokit: Octokit
  private token ? : string
  
  constructor(token ? : string) {
    this.token = token || process.env.GITHUB_TOKEN
    this.octokit = new Octokit({
      auth: this.token,
    })
  }
  
  async testConnection() {
    try {
      const { data } = await this.octokit.users.getAuthenticated()
      return {
        success: true,
        user: data.login,
        scopes: data.permissions || 'Unknown'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  async getRepository(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      })
      return {
        success: true,
        repository: data,
        isPrivate: data.private
      }
    } catch (error) {
      if (error.status === 404) {
        throw new Error('Repository not found or you don\'t have access. For private repos, make sure you\'ve added your GitHub token.')
      }
      throw new Error(`Failed to fetch repository: ${error.message}`)
    }
  }
  
  async getContents(owner: string, repo: string, path: string = '') {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      })
      return data
    } catch (error) {
      if (error.status === 404) {
        throw new Error(`Path not found: ${path}`)
      }
      throw new Error(`Failed to fetch contents: ${error.message}`)
    }
  }
  
  async getDirectoryTree(owner: string, repo: string, path: string = '', maxDepth: number = 3) {
    const tree: any[] = []
    
    try {
      const contents = await this.getContents(owner, repo, path)
      const items = Array.isArray(contents) ? contents : [contents]
      
      for (const item of items.slice(0, 50)) { // Limit items to prevent API abuse
        if (item.type === 'dir' && maxDepth > 0) {
          try {
            const children = await this.getDirectoryTree(owner, repo, item.path, maxDepth - 1)
            tree.push({
              ...item,
              children
            })
          } catch (error) {
            // Skip directories we can't access
            tree.push({
              ...item,
              children: [],
              error: 'Access denied'
            })
          }
        } else {
          tree.push(item)
        }
      }
      
      return tree
    } catch (error) {
      console.warn(`Error fetching directory tree for ${path}:`, error)
      return []
    }
  }
  
  getRateLimit() {
    return this.octokit.rateLimit.get()
  }
}