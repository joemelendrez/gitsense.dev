import { Octokit } from '@octokit/rest'

export class GitHubService {
  private octokit: Octokit

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
    })
  }

  async getRepository(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      })
      return data
    } catch (error) {
      throw new Error(`Failed to fetch repository: ${error}`)
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
      throw new Error(`Failed to fetch contents: ${error}`)
    }
  }

  async getFileContent(owner: string, repo: string, path: string) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      })
      
      if ('content' in data) {
        return Buffer.from(data.content, 'base64').toString()
      }
      throw new Error('File content not found')
    } catch (error) {
      throw new Error(`Failed to fetch file content: ${error}`)
    }
  }

  async getDirectoryTree(owner: string, repo: string, path: string = '', maxDepth: number = 3) {
    const tree: any[] = []
    
    try {
      const contents = await this.getContents(owner, repo, path)
      const items = Array.isArray(contents) ? contents : [contents]
      
      for (const item of items) {
        if (item.type === 'dir' && maxDepth > 0) {
          const children = await this.getDirectoryTree(owner, repo, item.path, maxDepth - 1)
          tree.push({
            ...item,
            children
          })
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
}