// src/components/tools/GitHubAnalyzer.tsx
import React, { useState } from 'react';
import { GitHubService } from '../../lib/github';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Github,
  Download,
  Copy,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const GitHubTokenInput = ({
  onTokenChange,
}: {
  onTokenChange: (token: string) => void;
}) => {
  const [token, setToken] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);

  const testToken = async () => {
    if (!token) return;

    setTesting(true);
    try {
      const github = new GitHubService(token);
      const result = await github.testConnection();

      if (result.success) {
        setIsValid(true);
        onTokenChange(token);
        toast.success(`Connected as ${result.user}`);
      } else {
        setIsValid(false);
        toast.error('Invalid token');
      }
    } catch (error) {
      setIsValid(false);
      toast.error('Token validation failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">

      <h4 className="font-medium text-gray-900">Private Repository Access</h4>
      <div className="flex space-x-2">
        <Input
          type="password"
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={testToken}
          loading={testing}
          disabled={!token}
          variant="outline"
          size="sm"
        >
          Test
        </Button>
      </div>

      {isValid === true && (
        <p className="text-sm text-green-600">
          ✅ Token valid - Private repos accessible
        </p>
      )}
      {isValid === false && (
        <p className="text-sm text-red-600">
          ❌ Invalid token or insufficient permissions
        </p>
      )}

      <details className="text-sm text-gray-600">
        <summary className="cursor-pointer">
          How to create a GitHub token
        </summary>
        <ol className="list-decimal ml-4 mt-2 space-y-1">
          <li>Go to GitHub Settings → Developer settings</li>
          <li>Click Personal access tokens → Tokens (classic)</li>
          <li>Generate new token with 'repo' scope</li>
          <li>Copy and paste the token above</li>
        </ol>
      </details>
    </div>
  );
};

export const GitHubAnalyzer: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [userToken, setUserToken] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analysisDepth, setAnalysisDepth] = useState(4);
  const [viewMode, setViewMode] = useState<'clean' | 'interactive' | 'raw'>(
    'clean'
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  // Helper function to count files in tree
  const countFiles = (tree: any[]): number => {
    return tree.reduce((count, item) => {
      if (item.type === 'file') return count + 1;
      if (item.children) return count + countFiles(item.children);
      return count;
    }, 0);
  };

  // Helper function to count folders in tree
  const countFolders = (tree: any[]): number => {
    return tree.reduce((count, item) => {
      if (item.type === 'dir') {
        count += 1;
        if (item.children) count += countFolders(item.children);
      }
      return count;
    }, 0);
  };

  // Generate clean structure display
  const generateCleanStructure = (apiData: any[]) => {
    let structure = '';

    const processItems = (items: any[], prefix = '', depth = 0) => {
      items.forEach((item, index) => {
        const isLastItem = index === items.length - 1;
        const connector = isLastItem ? '└── ' : '├── ';
        const icon = item.type === 'dir' ? '📁' : '📄';

        // Show file count for directories
        const childInfo =
          item.children && item.children.length > 0
            ? ` (${item.children.length} items)`
            : '';

        structure += `${prefix}${connector}${icon} ${item.name}${childInfo}\n`;

        if (item.children && item.children.length > 0) {
          const nextPrefix = prefix + (isLastItem ? '    ' : '│   ');
          processItems(item.children, nextPrefix, depth + 1);
        }
      });
    };

    processItems(apiData);
    return structure;
  };

  // Interactive structure component
  const InteractiveStructure: React.FC<{ items: any[]; prefix?: string }> = ({
    items,
    prefix = '',
  }) => {
    return (
      <div className="space-y-1">
        {items.map((item, index) => {
          const isExpanded = expandedFolders.has(item.path);

          return (
            <div key={item.path}>
              <div className="flex items-center space-x-1 hover:bg-gray-100 px-2 py-1 rounded">
                {item.type === 'dir' ? (
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedFolders);
                      if (isExpanded) {
                        newExpanded.delete(item.path);
                      } else {
                        newExpanded.add(item.path);
                      }
                      setExpandedFolders(newExpanded);
                    }}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <span>📁 {item.name}/</span>
                    {item.children && (
                      <span className="text-xs text-gray-500">
                        ({item.children.length})
                      </span>
                    )}
                  </button>
                ) : (
                  <span className="flex items-center space-x-1 text-gray-700 ml-4">
                    <span>📄 {item.name}</span>
                    {item.size && (
                      <span className="text-xs text-gray-400">
                        ({formatFileSize(item.size)})
                      </span>
                    )}
                  </span>
                )}
              </div>

              {item.type === 'dir' && isExpanded && item.children && (
                <div className="ml-4 border-l border-gray-200 pl-2">
                  <InteractiveStructure
                    items={item.children}
                    prefix={prefix + '  '}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Rate limit check function
  const checkRateLimit = async () => {
    try {
      const github = new GitHubService(userToken || undefined);
      const rateLimit = await github.getRateLimit();

      console.log('GitHub Rate Limit:', rateLimit);

      if (rateLimit.remaining === 0) {
        toast.error(
          `Rate limit exceeded. Resets at ${rateLimit.reset.toLocaleTimeString()}`
        );
      } else {
        toast.success(
          `Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`
        );
      }
    } catch (error) {
      console.error('Rate limit check failed:', error);
      toast.error('Failed to check rate limit');
    }
  };

  const analyzeRepository = async () => {
    if (!repoUrl.trim()) {
      toast.error('Please enter a repository URL');
      return;
    }

    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?\#]+)/);
    if (!match) {
      toast.error('Invalid GitHub URL format');
      return;
    }

    const [, owner, repo] = match;
    setLoading(true);

    try {
      // Always try to analyze, with or without token
      const github = new GitHubService(userToken || undefined);

      console.log('Analyzing repository:', {
        owner,
        repo,
        hasToken: !!userToken,
        depth: analysisDepth,
      });

      // Get repository info
      const repoResult = await github.getRepository(owner, repo);

      if (repoResult.success) {
        // Get directory structure with selected depth
        const tree = await github.getDirectoryTree(
          owner,
          repo,
          '',
          analysisDepth
        );

        const analysisResult = {
          repository: repoResult.repository,
          tree,
          stats: {
            totalFiles: countFiles(tree),
            totalFolders: countFolders(tree),
            isPrivate: repoResult.isPrivate,
          },
        };

        setAnalysis(analysisResult);
        setExpandedFolders(new Set()); // Reset expanded folders
        toast.success('Repository analyzed successfully!');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);

      // Better error messages
      if (error.message.includes('404')) {
        toast.error(
          "Repository not found. If it's private, add your GitHub token above."
        );
      } else if (error.message.includes('403')) {
        toast.error(
          'Access forbidden. Repository might be private or rate limited.'
        );
      } else {
        toast.error(error.message || 'Analysis failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyAnalysis = () => {
    if (analysis) {
      let content = '';

      if (viewMode === 'clean') {
        content = generateCleanStructure(analysis.tree);
      } else {
        content = JSON.stringify(analysis, null, 2);
      }

      navigator.clipboard.writeText(content);
      toast.success('Analysis copied to clipboard!');
    }
  };

  const exportAnalysis = () => {
    if (!analysis) return;

    const exportData = {
      repository: analysis.repository.name,
      url: analysis.repository.html_url,
      stats: analysis.stats,
      structure: generateCleanStructure(analysis.tree),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.repository.name}_analysis.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Test public repositories
  const testPublicRepo = (repoUrl: string) => {
    setRepoUrl(repoUrl);
    setUserToken(''); // Clear token to test public access
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <Github className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">GitHub Repository Analyzer</h1>
              <p className="text-blue-100">
                Analyze repository structure for AI context optimization
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Test buttons for public repos */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                testPublicRepo('https://github.com/facebook/react')
              }
            >
              Test: React
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                testPublicRepo('https://github.com/microsoft/vscode')
              }
            >
              Test: VS Code
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                testPublicRepo('https://github.com/vercel/next.js')
              }
            >
              Test: Next.js
            </Button>
            <Button variant="outline" size="sm" onClick={checkRateLimit}>
              Check Rate Limit
            </Button>
          </div>

          {/* Analysis Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Depth
              </label>
              <select
                value={analysisDepth}
                onChange={(e) => setAnalysisDepth(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2}>Shallow (2 levels) - Fast</option>
                <option value={3}>Medium (3 levels) - Balanced</option>
                <option value={4}>Deep (4 levels) - Detailed</option>
                <option value={5}>Very Deep (5 levels) - Complete</option>
                <option value={6}>Maximum (6 levels) - Slow</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <div className="flex space-x-2">
                {(['clean', 'interactive', 'raw'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-2 text-xs rounded-md transition-colors ${
                      viewMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repository URL
            </label>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={analyzeRepository}
                loading={loading}
                disabled={!repoUrl.trim()}
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
          </div>

          {/* Token Input */}
          <GitHubTokenInput onTokenChange={setUserToken} />

          {/* Results */}
          {analysis && (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {analysis.repository.name}
                  </h3>
                  <p className="text-gray-600">
                    {analysis.repository.description ||
                      'No description available'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={copyAnalysis}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportAnalysis}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Enhanced Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-6">
                <div className="bg-white p-3 rounded-lg text-center">
                  <div className="font-bold text-lg text-blue-600">
                    {analysis.stats.totalFiles}
                  </div>
                  <div className="text-gray-600">Files</div>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <div className="font-bold text-lg text-green-600">
                    {analysis.stats.totalFolders}
                  </div>
                  <div className="text-gray-600">Folders</div>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <div className="font-bold text-lg text-purple-600">
                    {analysis.repository.stargazers_count}
                  </div>
                  <div className="text-gray-600">Stars</div>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <div className="font-bold text-lg text-orange-600">
                    {analysis.repository.language || 'Mixed'}
                  </div>
                  <div className="text-gray-600">Language</div>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <div className="font-bold text-lg text-red-600">
                    {analysis.stats.isPrivate ? 'Private' : 'Public'}
                  </div>
                  <div className="text-gray-600">Visibility</div>
                </div>
              </div>

              {/* Display tree structure based on view mode */}
              {analysis.tree && analysis.tree.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Repository Structure ({analysisDepth} levels deep)
                  </h4>

                  {viewMode === 'clean' && (
                    <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
                      <pre>{generateCleanStructure(analysis.tree)}</pre>
                    </div>
                  )}

                  {viewMode === 'interactive' && (
                    <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                      <InteractiveStructure items={analysis.tree} />
                    </div>
                  )}

                  {viewMode === 'raw' && (
                    <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs max-h-96 overflow-y-auto">
                      <pre>{JSON.stringify(analysis.tree, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* AI Context Summary */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  🤖 AI Context Summary
                </h4>
                <p className="text-blue-800 text-sm">
                  This {analysis.repository.language || 'mixed-language'}{' '}
                  repository "{analysis.repository.name}" contains{' '}
                  {analysis.stats.totalFiles} files across{' '}
                  {analysis.stats.totalFolders} directories.
                  {analysis.repository.description &&
                    ` ${analysis.repository.description}`}
                  {analysis.stats.isPrivate
                    ? ' This is a private repository.'
                    : ' This is a public repository.'}
                  Use this structure summary when asking AI about the codebase
                  architecture and organization.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubAnalyzer;
