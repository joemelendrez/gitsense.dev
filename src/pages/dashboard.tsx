import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Header } from '../components/layout/Header'
import { useAuthStore } from '../store/auth'
import { useAnalysisStore } from '../store/analysis'
import { Button } from '../components/ui/Button'
import { Github, Code, Zap, Calendar, Download, Trash2 } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const { analyses, loading, loadAnalyses, deleteAnalysis } = useAnalysisStore()

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    loadAnalyses(user.id)
  }, [user, loadAnalyses, router])

  if (!user) return null

  const getUsagePercentage = () => {
    if (!profile) return 0
    const limit = profile.subscription_tier === 'free' ? 10 : 1000
    return Math.min((profile.usage_count / limit) * 100, 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'structure': return <Github className="h-4 w-4" />
      case 'code_summary': return <Code className="h-4 w-4" />
      case 'ai_enhanced': return <Zap className="h-4 w-4" />
      default: return <Code className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {profile?.full_name || user.email}!
              </h1>
              <p className="text-gray-600">
                Manage your code analyses and optimize your AI development workflow
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {profile?.subscription_tier || 'free'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {profile?.usage_count || 0} analyses this month
              </p>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Github className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Repositories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyses.filter(a => a.analysis_type === 'structure').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Code className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Code Summaries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyses.filter(a => a.analysis_type === 'code_summary').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">AI Enhanced</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyses.filter(a => a.analysis_type === 'ai_enhanced').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile?.usage_count || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Bar */}
        {profile?.subscription_tier === 'free' && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-900">Monthly Usage</h3>
              <span className="text-sm text-gray-500">
                {profile.usage_count}/10 analyses
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getUsagePercentage()}%` }}
              />
            </div>
            {getUsagePercentage() > 80 && (
              <p className="text-sm text-orange-600 mt-2">
                You're approaching your monthly limit. 
                <Button variant="ghost" size="sm" className="ml-1 p-0 h-auto">
                  Upgrade to Pro
                </Button>
              </p>
            )}
          </div>
        )}

        {/* Recent Analyses */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recent Analyses</h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => router.push('/tools/github-analyzer')}>
                  <Github className="h-4 w-4 mr-1" />
                  New Repository
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/tools/code-summarizer')}>
                  <Code className="h-4 w-4 mr-1" />
                  Summarize Code
                </Button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                Loading your analyses...
              </div>
            ) : analyses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No analyses yet</h3>
                <p className="mb-4">Start by analyzing a GitHub repository or summarizing some code</p>
                <div className="flex justify-center space-x-2">
                  <Button onClick={() => router.push('/tools/github-analyzer')}>
                    Analyze Repository
                  </Button>
                </div>
              </div>
            ) : (
              analyses.slice(0, 10).map((analysis) => (
                <div key={analysis.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getAnalysisIcon(analysis.analysis_type)}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {analysis.repository_url === 'code-snippet' 
                            ? 'Code Snippet Analysis' 
                            : analysis.repository_url.split('/').slice(-2).join('/')
                          }
                        </h3>
                        <p className="text-sm text-gray-500">
                          {analysis.analysis_type.replace('_', ' ')} • {formatDate(analysis.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const content = typeof analysis.content === 'string' 
                            ? analysis.content 
                            : JSON.stringify(analysis.content, null, 2)
                          navigator.clipboard.writeText(content)
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAnalysis(analysis.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}