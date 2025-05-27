// src/components/SavedAnalyses.tsx
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { useAnalysisStore } from '../store/analysis';
import { Button } from './ui/Button';
import {
  Github,
  Code,
  Zap,
  Copy,
  Trash2,
  Download,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SavedAnalyses: React.FC = () => {
  const { user } = useAuthStore();
  const { analyses, loading, loadAnalyses, deleteAnalysis } =
    useAnalysisStore();
  const [filter, setFilter] = useState<
    'all' | 'structure' | 'code_summary' | 'ai_enhanced'
  >('all');

  useEffect(() => {
    if (user) {
      loadAnalyses(user.id);
    }
  }, [user, loadAnalyses]);

  const filteredAnalyses = analyses.filter(
    (analysis) => filter === 'all' || analysis.analysis_type === filter
  );

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'structure':
        return <Github className="h-4 w-4" />;
      case 'code_summary':
        return <Code className="h-4 w-4" />;
      case 'ai_enhanced':
        return <Zap className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  const copyAnalysis = (analysis: any) => {
    let content = '';

    if (analysis.analysis_type === 'structure' && analysis.content.tree) {
      content = generateCleanStructure(analysis.content.tree);
    } else if (analysis.content.structural) {
      content = analysis.content.aiEnhanced || analysis.content.structural;
    } else {
      content = JSON.stringify(analysis.content, null, 2);
    }

    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const generateCleanStructure = (tree: any[]) => {
    // Same function as in GitHubAnalyzer
    let structure = '';
    const processItems = (items: any[], prefix = '') => {
      items.forEach((item, index) => {
        const isLastItem = index === items.length - 1;
        const connector = isLastItem ? '└── ' : '├── ';
        const icon = item.type === 'dir' ? '📁' : '📄';
        structure += `${prefix}${connector}${icon} ${item.name}\n`;

        if (item.children && item.children.length > 0) {
          const nextPrefix = prefix + (isLastItem ? '    ' : '│   ');
          processItems(item.children, nextPrefix);
        }
      });
    };
    processItems(tree);
    return structure;
  };

  const exportAnalysis = (analysis: any) => {
    const blob = new Blob([JSON.stringify(analysis, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_${analysis.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Sign in to view your saved analyses</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Saved Analyses</h1>
          <p className="text-indigo-100">
            Manage your repository structures and code summaries
          </p>
        </div>

        <div className="p-6">
          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'all', label: 'All', icon: null },
              { key: 'structure', label: 'Repositories', icon: Github },
              { key: 'code_summary', label: 'Code Summaries', icon: Code },
              { key: 'ai_enhanced', label: 'AI Enhanced', icon: Zap },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-white text-indigo-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{label}</span>
                <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {key === 'all'
                    ? analyses.length
                    : analyses.filter((a) => a.analysis_type === key).length}
                </span>
              </button>
            ))}
          </div>

          {/* Analyses List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading your analyses...</p>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {filter === 'all' ? (
                  <Code className="h-16 w-16 mx-auto" />
                ) : (
                  getAnalysisIcon(filter)
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No analyses found
              </h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all'
                  ? 'Start analyzing repositories and code to see them here'
                  : `No ${filter.replace('_', ' ')} analyses found`}
              </p>
              <Button
                onClick={() =>
                  (window.location.href = '/tools/github-analyzer')
                }
              >
                Analyze Repository
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getAnalysisIcon(analysis.analysis_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {analysis.repository_url === 'code-snippet'
                            ? `Code Summary - ${
                                analysis.content.language || 'Unknown'
                              }`
                            : analysis.repository_url
                                .split('/')
                                .slice(-2)
                                .join('/')}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {analysis.analysis_type
                            .replace('_', ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}{' '}
                          •
                          <Calendar className="h-3 w-3 inline ml-1 mr-1" />
                          {formatDate(analysis.created_at)}
                        </p>
                        {analysis.content.repository?.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {analysis.content.repository.description}
                          </p>
                        )}
                        {analysis.content.stats && (
                          <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                            {analysis.content.stats.totalFiles && (
                              <span>
                                📄 {analysis.content.stats.totalFiles} files
                              </span>
                            )}
                            {analysis.content.stats.totalFolders && (
                              <span>
                                📁 {analysis.content.stats.totalFolders} folders
                              </span>
                            )}
                            {analysis.content.stats.tokensSaved && (
                              <span>
                                ⚡ ~{analysis.content.stats.tokensSaved} tokens
                                saved
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyAnalysis(analysis)}
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportAnalysis(analysis)}
                        title="Export as JSON"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              'Are you sure you want to delete this analysis?'
                            )
                          ) {
                            deleteAnalysis(analysis.id);
                            toast.success('Analysis deleted');
                          }
                        }}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                        title="Delete analysis"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedAnalyses;
