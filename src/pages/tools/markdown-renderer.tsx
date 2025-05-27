import React, { useState, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Header } from '../../components/layout/Header';
import {
  Book,
  Copy,
  Download,
  Eye,
  Upload,
  Code,
  Trash2,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Head from 'next/head';
import Link from 'next/link';

interface MarkdownRendererProps {
  initialContent?: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  initialContent = '',
  className = '',
}) => {
  const [markdown, setMarkdown] = useState(initialContent);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [fileName, setFileName] = useState('document.md');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simple markdown parser (lightweight alternative)
  const parseMarkdown = (text: string): string => {
    if (!text) return '';

    return (
      text
        // Headers
        .replace(
          /^### (.*$)/gim,
          '<h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">$1</h3>'
        )
        .replace(
          /^## (.*$)/gim,
          '<h2 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h2>'
        )
        .replace(
          /^# (.*$)/gim,
          '<h1 class="text-3xl font-bold mt-8 mb-6 text-gray-900 border-b-2 border-blue-200 pb-3">$1</h1>'
        )

        // Code blocks
        .replace(
          /```(\w+)?\n([\s\S]*?)```/gim,
          '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6 border border-gray-200"><code class="text-sm">$2</code></pre>'
        )
        .replace(
          /`([^`]+)`/gim,
          '<code class="bg-blue-50 text-blue-800 px-2 py-1 rounded text-sm font-mono border">$1</code>'
        )

        // Bold and italic
        .replace(
          /\*\*([^*]+)\*\*/gim,
          '<strong class="font-semibold text-gray-900">$1</strong>'
        )
        .replace(/\*([^*]+)\*/gim, '<em class="italic text-gray-700">$1</em>')

        // Links
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/gim,
          '<a href="$2" class="text-blue-600 hover:text-blue-800 hover:underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>'
        )

        // Lists
        .replace(
          /^\* (.+$)/gim,
          '<li class="ml-6 mb-2 text-gray-700">• $1</li>'
        )
        .replace(/^- (.+$)/gim, '<li class="ml-6 mb-2 text-gray-700">• $1</li>')

        // Blockquotes
        .replace(
          /^> (.+$)/gim,
          '<blockquote class="border-l-4 border-blue-500 bg-blue-50 pl-6 py-3 my-4 italic text-gray-700 rounded-r-lg">$1</blockquote>'
        )

        // Line breaks
        .replace(
          /\n\n/gim,
          '</p><p class="mb-4 text-gray-700 leading-relaxed">'
        )
        .replace(/\n/gim, '<br />')
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      toast.error('Please upload a markdown (.md) or text (.txt) file');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setMarkdown(content);
      setFileName(file.name);
      toast.success('File uploaded successfully!');
      setIsLoading(false);
    };
    reader.onerror = () => {
      toast.error('Error reading file');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success('Markdown copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Markdown downloaded!');
  };

  const clearContent = () => {
    setMarkdown('');
    setFileName('document.md');
    toast.success('Content cleared!');
  };

  const insertTemplate = () => {
    const template = `# GitSense Markdown Renderer

## Perfect for AI-Optimized Documentation

Transform your documentation workflow with **GitSense Markdown Renderer** - designed for developers who want to create beautiful, AI-friendly content.

### ✨ Key Features

- **Live Preview**: Toggle between edit and preview modes
- **File Upload**: Import existing markdown files instantly  
- **Export Options**: Download your rendered content
- **Clean Syntax**: Optimized for AI conversations

### 🚀 Code Examples

Here's a simple function that demonstrates our approach:

\`\`\`javascript
function optimizeForAI(content) {
  return {
    summary: generateSummary(content),
    tokens: calculateTokens(content),
    context: extractContext(content)
  };
}
\`\`\`

You can also use inline code like \`const result = processMarkdown(input)\` for quick references.

### 📊 Benefits

| Feature | Traditional | GitSense |
|---------|-------------|----------|
| Token Usage | High | **80% Reduced** |
| Context Quality | Variable | **Optimized** |
| AI Compatibility | Basic | **Enhanced** |

### 💡 Pro Tips

> **Remember**: Well-structured markdown creates better AI conversations. Use clear headings, concise paragraphs, and meaningful code blocks.

Ready to optimize your development workflow? **[Get Started with GitSense](https://gitsense.dev)** today!

---

*Built with ❤️ for the developer community*
`;
    setMarkdown(template);
    toast.success('Template inserted!');
  };

  return (
    <>
      <Head>
        <title>
          Markdown Renderer - GitSense.dev | AI-Optimized Documentation Tool
        </title>
        <meta
          name="description"
          content="Create beautiful markdown documentation optimized for AI conversations. Live preview, export options, and seamless integration with your development workflow."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
 
        <Header />

        <div className={`max-w-7xl mx-auto pt-20 pb-12 px-4 ${className}`}>
          {/* Hero Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Book className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Markdown Renderer
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {' '}
                for AI
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create beautiful documentation optimized for AI conversations.
              Perfect for ChatGPT, Claude, and your development workflow.
            </p>
          </div>

          {/* Controls Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  placeholder="File name..."
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-48"
                />

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".md,.txt"
                  className="hidden"
                />

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isLoading ? 'Loading...' : 'Upload'}
                </Button>

                <Button
                  onClick={insertTemplate}
                  variant="outline"
                  size="sm"
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  AI Template
                </Button>
              </div>

              <div className="flex-1" />

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  variant="outline"
                  size="sm"
                  className={
                    isPreviewMode
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : ''
                  }
                >
                  {isPreviewMode ? (
                    <>
                      <Code className="w-4 h-4 mr-2" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </>
                  )}
                </Button>

                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  disabled={!markdown.trim()}
                  className="border-green-200 text-green-600 hover:bg-green-50"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>

                <Button
                  onClick={downloadMarkdown}
                  size="sm"
                  disabled={!markdown.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>

                <Button
                  onClick={clearContent}
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
            {/* Editor */}
            {!isPreviewMode && (
              <div className="flex flex-col min-h-[600px]">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full min-h-[600px]">
                  <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-700 flex items-center">
                      <Code className="w-4 h-4 mr-2" />
                      Editor
                    </h3>
                    <span className="text-sm text-gray-500">
                      {markdown.length.toLocaleString()} characters
                    </span>
                  </div>
                  <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    placeholder="# Start writing your markdown here...

Transform your ideas into beautiful documentation:

- Use **bold** and *italic* text
- Add `code snippets` and code blocks
- Create > blockquotes for emphasis
- Build [links](https://gitsense.dev) to resources

Perfect for AI conversations and documentation!"
                    className="flex-1 w-full p-6 bg-white text-gray-900 font-mono text-sm 
                              resize-none focus:outline-none placeholder-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            <div
              className={`flex flex-col min-h-[600px] ${
                !isPreviewMode ? '' : 'lg:col-span-2'
              }`}
            >
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full min-h-[600px]">
                <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-700 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </h3>
                  {markdown.trim() && (
                    <span className="text-sm text-green-600 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Live
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-auto">
                  {markdown.trim() ? (
                    <div className="p-8">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: `<div class="leading-relaxed">${parseMarkdown(
                            markdown
                          )}</div>`,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <Book className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <h4 className="text-lg font-medium mb-2">
                          Ready to create?
                        </h4>
                        <p className="text-sm">
                          Start writing markdown to see the live preview
                        </p>
                        <Button
                          onClick={insertTemplate}
                          variant="outline"
                          size="sm"
                          className="mt-4 border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Try Template
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Footer */}
          {markdown.trim() && (
            <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span>{markdown.length.toLocaleString()} characters</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span>
                      {markdown.trim().split(/\s+/).length.toLocaleString()}{' '}
                      words
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>
                      {markdown.split('\n').length.toLocaleString()} lines
                    </span>
                  </div>
                </div>
                <div className="flex items-center text-green-600 font-medium">
                  <Zap className="w-4 h-4 mr-2" />
                  AI-Optimized Ready
                </div>
              </div>
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Love the Markdown Renderer?
              </h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Explore our other AI-optimized tools for complete code analysis,
                GitHub repository insights, and intelligent summaries.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/tools/github-analyzer">
                  <Button
                    variant="secondary"
                    className="bg-gray-200 text-blue-600 hover:bg-gray-100"
                  >
                    GitHub Analyzer
                  </Button>
                </Link>
                <Link href="/tools/code-summarizer">
                  <Button
                    variant="secondary"
                    className="bg-gray-200 text-purple-600 hover:bg-gray-100"
                  >
                    Code Summarizer
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarkdownRenderer;
