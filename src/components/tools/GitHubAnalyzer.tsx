// src/components/tools/GitHubAnalyzer.tsx
import React, { useState } from 'react';
import { GitHubService } from '../../lib/github';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Github, Download, Copy } from 'lucide-react';
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
      const github = new GitHubService(userToken);

      // Get repository info
      const repoResult = await github.getRepository(owner, repo);

      if (repoResult.success) {
        // Get directory structure
        const tree = await github.getDirectoryTree(owner, repo, '', 2);

        const analysisResult = {
          repository: repoResult.repository,
          tree,
          stats: {
            totalFiles: countFiles(tree),
            isPrivate: repoResult.isPrivate,
          },
        };

        setAnalysis(analysisResult);
        toast.success('Repository analyzed successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const countFiles = (tree: any[]): number => {
    return tree.reduce((count, item) => {
      if (item.type === 'file') return count + 1;
      if (item.children) return count + countFiles(item.children);
      return count;
    }, 0);
  };

  const copyAnalysis = () => {
    if (analysis) {
      const summary = `Repository: ${analysis.repository.name}\nFiles: ${analysis.stats.totalFiles}\nPrivate: ${analysis.stats.isPrivate}`;
      navigator.clipboard.writeText(summary);
      toast.success('Analysis copied to clipboard!');
    }
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
                Analyze
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
                    {analysis.repository.description}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={copyAnalysis}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Files:</span>{' '}
                  {analysis.stats.totalFiles}
                </div>
                <div>
                  <span className="font-medium">Language:</span>{' '}
                  {analysis.repository.language}
                </div>
                <div>
                  <span className="font-medium">Stars:</span>{' '}
                  {analysis.repository.stargazers_count}
                </div>
                <div>
                  <span className="font-medium">Private:</span>{' '}
                  {analysis.stats.isPrivate ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubAnalyzer;
