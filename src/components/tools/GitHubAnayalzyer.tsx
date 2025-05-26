import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { GitHubService } from '../../lib/github'
import { useAuthStore } from '../../store/auth'
import { useAnalysisStore } from '../../store/analysis'
import { Github, Download, Copy, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

interface AnalysisForm {
  repositoryUrl: string
  includePrivate: boolean
  maxDepth: number
}

export const GitHubAnalyzer: React.FC = () => {
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { user, profile } = useAuthStore()
  const { saveAnalysis } = useAnalysisStore()
  
  const { register, handleSubmit, formState: { errors } } = useForm<AnalysisForm>()

  const parseGitHubUrl = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\?\#]+)/)
    if (!match) throw new Error('Invalid GitHub URL')
    return { owner: match[1], repo: match[2] }
  }

  const analyzeRepository = async (data: AnalysisForm) => {
    if (!user) {
      toast.error('Please sign in to analyze repositories')
      return
    }

    setLoading(true)
    try {
      const { owner, repo } = parseGitHubUrl(data.repositoryUrl)
      const token = data.includePrivate ? profile?.github_token : undefined
      
      const github = new GitHubService(token)
      
      // Get repository info
      const repoInfo = await github.getRepository(owner, repo)
      
      // Get directory structure
      const tree = await github.getDirectoryTree(owner, repo, '', data.maxDepth)
      
      // Analyze structure
      const analysisResult = {
        repository: repoInfo,
        structure: tree,
        stats: {
          totalFiles: countFiles(tree),
          totalDirs: countDirectories(tree),
          languages: detectLanguages(tree),
          size: repoInfo.size
        },
        summary: generateSummary(repoInfo, tree)
      }
      
      setAnalysis(analysisResult)
      
      // Save to database
      await saveAnalysis({
        user_id: user.id,
        repository_url: data.repositoryUrl,
        analysis_type: 'structure',
        content: analysisResult
      })
      
      toast.success('Repository analyzed successfully!')
      
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const countFiles = (tree: any[]): number => {
    return tree.reduce((count, item) => {
      if (item.type === 'file') return count + 1
      if (item.children) return count + countFiles(item.children)
      return count
    }, 0)
  }

  const countDirectories = (tree: any[]): number => {
    return tree.reduce((count, item) => {
      if (item.type === 'dir') {
        const childCount = item.children ? countDirectories(item.children) : 0
        return count + 1 + childCount
      }
      return count
    }, 0)
  }

  const detectLanguages = (tree: any[]): string[] => {
    const extensions = new Set<string>()
    
    const extractExtensions = (items: any[]) => {
      items.forEach(item => {
        if (item.type === 'file' && item.name.includes('.')) {
          const ext = item.name.split('.').pop()
          if (ext) extensions.add(ext)
        }
        if (item.children) extractExtensions(item.children)
      })
    }
    
    extractExtensions(tree)
    return Array.from(extensions)
  }

  const generateSummary = (repo: any, tree: any[]) => {
    return `${repo.name}: ${repo.description || 'No description'}. 
Language: ${repo.language}, Files: ${countFiles(tree)}, 
Stars: ${repo.stargazers_count}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const exportAnalysis = () => {
    if (!analysis) return
    
    const blob = new Blob([JSON.stringify(analysis, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${analysis.repository.name}_analysis.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <Github className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">GitHub Repository Analyzer</h1>
              <p className="text-blue-100">Analyze repository structure for AI context optimization</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Input Section */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit(analyzeRepository)} className="space-y-4">
              <Input
                label="Repository URL"
                placeholder="https://github.com/owner/repository"
                {...register('repositoryUrl', {
                  required: 'Repository URL is required',
                  pattern: {
                    value: /github\.com\/[^\/]+\/[^\/\?\#]+/,
                    message: 'Invalid GitHub URL format'
                  }
                })}
                error={errors.repositoryUrl?.message}
              />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includePrivate"
                  {...register('includePrivate')}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="includePrivate" className="text-sm text-gray-700">
                  Include private repositories (requires GitHub token)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Analysis Depth
                </label>
                <select
                  {...register('maxDepth')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={1}>Shallow (1 level)</option>
                  <option value={2}>Medium (2 levels)</option>
                  <option value={3}>Deep (3 levels)</option>
                </select>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                disabled={!user}
              >
                {!user ? 'Sign in to analyze' : 'Analyze Repository'}
              </Button>
            </form>

            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  Sign in to save your analyses and access private repositories
                </p>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {analysis ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h3 className="font-medium text-green-900 mb-2">
                    {analysis.repository.name}
                  </h3>
                  <p className="text-sm text-green-700 mb-3">
                    {analysis.repository.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Files:</span> {analysis.stats.totalFiles}
                    </div>
                    <div>
                      <span className="font-medium">Dirs:</span> {analysis.stats.totalDirs}
                    </div>
                    <div>
                      <span className="font-medium">Language:</span> {analysis.repository.language}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {analysis.repository.size} KB
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-md p-4 font-mono text-sm max-h-96 overflow-y-auto">
                  <pre>{analysis.summary}</pre>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(analysis.summary)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportAnalysis}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 rounded-md p-8 text-center text-gray-500">
                <Github className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter a GitHub repository URL to start analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}