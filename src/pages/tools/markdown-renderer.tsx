// src/pages/tools/markdown-renderer.tsx
import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Markdown, Copy, Download, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

export default function MarkdownRenderer() {
  const [markdown, setMarkdown] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'edit'>(
    'split'
  );

  const sampleMarkdown = `# AI Response Example

Here's how AI responses typically look:

## Code Example
\`\`\`javascript
function analyzeCode(code) {
  return {
    functions: extractFunctions(code),
    complexity: assessComplexity(code)
  }
}
\`\`\`

## Key Points
- **Performance**: Optimized algorithms
- **Scalability**: Handles large codebases
- **Accuracy**: 95%+ precision

## Next Steps
1. Review the analysis
2. Apply recommendations
3. Test improvements`;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <Markdown className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Markdown to Rich Text</h1>
              <p className="text-green-100">
                Convert AI markdown responses to beautiful rich text
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-2">
            {[
              { key: 'edit', label: 'Edit' },
              { key: 'split', label: 'Split' },
              { key: 'preview', label: 'Preview' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as any)}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMarkdown(sampleMarkdown);
                toast.success('Sample loaded!');
              }}
            >
              Load Sample
            </Button>
          </div>
        </div>

        <div
          className={`grid ${
            viewMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'
          } gap-0`}
        >
          {/* Editor */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className="p-4 border-r border-gray-200">
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="w-full h-96 p-3 border border-gray-300 rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste your markdown here..."
              />
            </div>
          )}

          {/* Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="p-4">
              <div className="prose prose-lg max-w-none h-96 overflow-y-auto border border-gray-200 rounded p-4">
                <ReactMarkdown>
                  {markdown || 'Preview will appear here...'}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(markdown);
              toast.success('Markdown copied!');
            }}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy Markdown
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Copy rendered HTML
              const html = document.querySelector('.prose')?.innerHTML || '';
              navigator.clipboard.writeText(html);
              toast.success('HTML copied!');
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            Copy HTML
          </Button>
        </div>
      </div>
    </div>
  );
}
