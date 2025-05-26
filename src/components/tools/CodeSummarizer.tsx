import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/auth';
import { useAnalysisStore } from '../../store/analysis';
import { Code, Copy, Download, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface SummaryForm {
  code: string;
  language: string;
  includeAI: boolean;
}

export const CodeSummarizer: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { saveAnalysis } = useAnalysisStore();

  const { register, handleSubmit, watch, setValue } = useForm<SummaryForm>({
    defaultValues: {
      language: 'auto',
      includeAI: false,
    },
  });

  const codeValue = watch('code');
  const includeAI = watch('includeAI');

  const summarizeCode = async (data: SummaryForm) => {
    if (!data.code.trim()) {
      toast.error('Please enter some code to analyze');
      return;
    }

    setLoading(true);
    try {
      // Basic structural analysis
      const structuralSummary = await analyzeCodeStructure(
        data.code,
        data.language
      );

      let result = {
        original: data.code,
        language: data.language,
        structural: structuralSummary,
        aiEnhanced: null,
        stats: calculateStats(data.code, structuralSummary),
      };

      // AI enhancement if requested and user has access
      if (data.includeAI && user) {
        try {
          const aiSummary = await getAIEnhancement(structuralSummary);
          result.aiEnhanced = aiSummary;
        } catch (error) {
          console.warn('AI enhancement failed:', error);
          toast.error(
            'AI enhancement failed, showing structural analysis only'
          );
        }
      }

      setSummary(result);

      // Save analysis if user is logged in
      if (user) {
        await saveAnalysis({
          user_id: user.id,
          repository_url: 'code-snippet',
          analysis_type: data.includeAI ? 'ai_enhanced' : 'code_summary',
          content: result,
        });
      }

      toast.success('Code analyzed successfully!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeCodeStructure = async (code: string, language: string) => {
    const lines = code.split('\n');
    const detectedLang = language === 'auto' ? detectLanguage(code) : language;

    let summary = `🔍 CODE SUMMARY (${detectedLang.toUpperCase()})\n`;
    summary += `${'='.repeat(50)}\n\n`;

    // Extract functions
    const functions = extractFunctions(code, detectedLang);
    if (functions.length > 0) {
      summary += `⚙️ FUNCTIONS (${functions.length}):\n`;
      functions.forEach((func) => {
        summary += `  🔧 ${func.name}(${func.params})\n`;
        if (func.description) summary += `     ${func.description}\n`;
      });
      summary += '\n';
    }

    // Extract classes
    const classes = extractClasses(code, detectedLang);
    if (classes.length > 0) {
      summary += `🏗️ CLASSES (${classes.length}):\n`;
      classes.forEach((cls) => {
        summary += `  📋 ${cls.name}\n`;
        cls.methods.forEach((method) => (summary += `    ├─ ${method}\n`));
      });
      summary += '\n';
    }

    // Extract imports
    const imports = extractImports(code, detectedLang);
    if (imports.length > 0) {
      summary += `📦 DEPENDENCIES:\n`;
      imports.slice(0, 10).forEach((imp) => (summary += `  • ${imp}\n`));
      summary += '\n';
    }

    // Code metrics
    summary += `📊 METRICS:\n`;
    summary += `  • Lines: ${lines.length}\n`;
    summary += `  • Functions: ${functions.length}\n`;
    summary += `  • Classes: ${classes.length}\n`;
    summary += `  • Complexity: ${assessComplexity(code)}\n\n`;

    summary += `💡 AI CONTEXT:\n`;
    summary += `This ${detectedLang} code contains ${functions.length} functions and ${classes.length} classes. `;
    summary += `Use this summary as context when asking AI about specific implementations or debugging.`;

    return summary;
  };

  const detectLanguage = (code: string): string => {
    if (code.includes('def ') && code.includes(':')) return 'python';
    if (code.includes('function ') || code.includes('=>')) return 'javascript';
    if (code.includes('public class') || code.includes('private '))
      return 'java';
    if (code.includes('const ') && code.includes(': ')) return 'typescript';
    if (code.includes('#include') || code.includes('std::')) return 'cpp';
    return 'unknown';
  };

  const extractFunctions = (code: string, language: string) => {
    const functions: any[] = [];
    const lines = code.split('\n');

    const patterns: { [key: string]: RegExp } = {
      javascript:
        /^(function\s+(\w+)\s*\(([^)]*)\)|const\s+(\w+)\s*=\s*(\([^)]*\))?\s*=>)/,
      python: /^def\s+(\w+)\s*\(([^)]*)\):/,
      java: /^(public|private|protected)?\s*(static\s+)?\w+\s+(\w+)\s*\(([^)]*)\)/,
      typescript:
        /^(function\s+(\w+)\s*\(([^)]*)\)|const\s+(\w+)\s*=\s*(\([^)]*\))?\s*=>)/,
    };

    const pattern = patterns[language];
    if (!pattern) return functions;

    lines.forEach((line, index) => {
      const match = line.trim().match(pattern);
      if (match) {
        const name = match[2] || match[4] || match[3] || match[1];
        const params = match[3] || match[5] || match[4] || match[2] || '';

        functions.push({
          name,
          params: params.replace(/\s+/g, ' '),
          line: index + 1,
          description:
            index > 0 && lines[index - 1].trim().startsWith('//')
              ? lines[index - 1].trim().substring(2).trim()
              : null,
        });
      }
    });

    return functions;
  };

  const extractClasses = (code: string, language: string) => {
    const classes: any[] = [];
    const lines = code.split('\n');

    const patterns: { [key: string]: RegExp } = {
      javascript: /^class\s+(\w+)/,
      python: /^class\s+(\w+)(\([^)]*\))?:/,
      java: /^(public\s+)?class\s+(\w+)/,
      typescript: /^(export\s+)?(class\s+(\w+)|interface\s+(\w+))/,
    };

    const pattern = patterns[language];
    if (!pattern) return classes;

    lines.forEach((line, index) => {
      const match = line.trim().match(pattern);
      if (match) {
        const name = match[3] || match[4] || match[2] || match[1];

        // Extract methods for this class (simplified)
        const methods: string[] = [];
        for (let i = index + 1; i < Math.min(index + 20, lines.length); i++) {
          const methodMatch = lines[i]
            .trim()
            .match(/^\s*(public\s+|private\s+)?(\w+)\s*\(/);
          if (methodMatch) {
            methods.push(methodMatch[2] + '()');
          }
        }

        classes.push({ name, methods });
      }
    });

    return classes;
  };

  const extractImports = (code: string, language: string) => {
    const imports: string[] = [];
    const lines = code.split('\n');

    const patterns: { [key: string]: RegExp[] } = {
      javascript: [
        /^import\s+.+from\s+['"`].+['"`]/,
        /^const\s+.+=\s+require\(['"`].+['"`]\)/,
      ],
      python: [/^(import|from)\s+[\w.]+/],
      java: [/^import\s+[\w.]+;/],
      typescript: [/^import\s+.+from\s+['"`].+['"`]/],
    };

    const langPatterns = patterns[language] || patterns.javascript;

    lines.forEach((line) => {
      const trimmed = line.trim();
      langPatterns.forEach((pattern) => {
        if (pattern.test(trimmed)) {
          imports.push(trimmed);
        }
      });
    });

    return imports;
  };

  const assessComplexity = (code: string): string => {
    const complexityIndicators = (
      code.match(/(if|for|while|switch|try|catch)/g) || []
    ).length;
    if (complexityIndicators > 20) return 'High';
    if (complexityIndicators > 10) return 'Medium';
    return 'Low';
  };

  const calculateStats = (original: string, summary: string) => {
    const originalLines = original.split('\n').length;
    const summaryLines = summary.split('\n').length;
    const compression = Math.round((1 - summaryLines / originalLines) * 100);
    const tokensSaved = Math.round((originalLines - summaryLines) * 4);

    return {
      originalLines,
      summaryLines,
      compression: Math.max(0, compression),
      tokensSaved: Math.max(0, tokensSaved),
    };
  };

  const getAIEnhancement = async (structuralSummary: string) => {
    // This would call your AI API (OpenAI, Claude, etc.)
    // For now, returning a mock response
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

    return `🤖 AI-Enhanced Summary:

This code appears to be a ${detectLanguage(
      codeValue
    )} module focused on data processing and user interaction. 

Key insights:
- Primary purpose: Data transformation and API integration
- Architecture pattern: Functional/Object-oriented hybrid
- Complexity level: Medium - suitable for intermediate developers
- Potential improvements: Consider error handling optimization

Recommended AI questions:
1. "How can I optimize the performance of the main processing function?"
2. "What security considerations should I be aware of?"
3. "How would I add unit tests for this code?"

This summary provides optimal context for AI conversations while saving ~75% of original tokens.`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const exportSummary = () => {
    if (!summary) return;

    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_summary_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSampleCode = () => {
    const sampleCode = `// User authentication service
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

class AuthService {
  constructor(userRepository) {
    this.userRepo = userRepository
    this.saltRounds = 12
  }

  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds)
    } catch (error) {
      throw new Error('Password hashing failed')
    }
  }

  async validateUser(email, password) {
    const user = await this.userRepo.findByEmail(email)
    if (!user) throw new Error('User not found')
    
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new Error('Invalid credentials')
    
    return this.generateToken(user)
  }

  generateToken(user) {
    const payload = { userId: user.id, email: user.email }
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' })
  }
}

export default AuthService`;

    setValue('code', sampleCode);
    setValue('language', 'javascript');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <Code className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Code Summarizer</h1>
              <p className="text-purple-100">
                Extract key components and optimize for AI context
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Input Section */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit(summarizeCode)} className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Code Input
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={loadSampleCode}
                >
                  Load Sample
                </Button>
              </div>

              <textarea
                {...register('code', { required: 'Code is required' })}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm resize-vertical focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Paste your code here..."
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    {...register('language')}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="csharp">C#</option>
                    <option value="php">PHP</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center space-x-2 pb-2">
                    <input
                      type="checkbox"
                      id="includeAI"
                      {...register('includeAI')}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="includeAI"
                      className="text-sm text-gray-700"
                    >
                      AI Enhancement {!user && '(Pro)'}
                    </label>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                disabled={includeAI && !user}
              >
                <Zap className="h-4 w-4 mr-2" />
                {loading ? 'Analyzing...' : 'Analyze Code'}
              </Button>
            </form>

            {includeAI && !user && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  Sign up for Pro to unlock AI-enhanced summaries with
                  intelligent insights and optimization recommendations.
                </p>
              </div>
            )}

            {codeValue && (
              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="font-medium text-gray-900 mb-2">Code Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>Lines: {codeValue.split('\n').length}</div>
                  <div>Characters: {codeValue.length}</div>
                  <div>Language: {watch('language')}</div>
                  <div>Est. Tokens: ~{Math.round(codeValue.length / 4)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {summary ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h3 className="font-medium text-green-900 mb-2">
                    Analysis Complete
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                    <div>Original: {summary.stats.originalLines} lines</div>
                    <div>Summary: {summary.stats.summaryLines} lines</div>
                    <div>Compression: {summary.stats.compression}%</div>
                    <div>Tokens Saved: ~{summary.stats.tokensSaved}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Structural Summary
                    </h4>
                    <div className="bg-gray-50 rounded-md p-4 font-mono text-sm max-h-64 overflow-y-auto">
                      <pre>{summary.structural}</pre>
                    </div>
                  </div>

                  {summary.aiEnhanced && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Zap className="h-4 w-4 mr-1 text-purple-600" />
                        AI Enhancement
                      </h4>
                      <div className="bg-purple-50 rounded-md p-4 font-mono text-sm max-h-64 overflow-y-auto">
                        <pre>{summary.aiEnhanced}</pre>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(summary.aiEnhanced || summary.structural)
                    }
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Summary
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportSummary}>
                    <Download className="h-4 w-4 mr-1" />
                    Export JSON
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 rounded-md p-8 text-center text-gray-500">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Paste your code above to generate an optimized summary</p>
                <p className="text-sm mt-2">
                  Perfect for AI context and documentation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
