// src/components/tools/CodeSummarizer.tsx - Complete SSR-Safe Version
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/auth';
import { useAnalysisStore } from '../../store/analysis';
import {
  Code,
  Copy,
  Download,
  Zap,
  Save,
  Upload,
  FileText,
  Settings,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAIEnhancement,
  isAIConfigured,
  estimateTokenCost,
} from '../../lib/ai-service';
import { AISettingsModal } from '../modals/AISettingsModal';

interface SummaryResult {
  original: string;
  language: string;
  structural: string;
  aiEnhanced?: string;
  stats: {
    originalLines: number;
    summaryLines: number;
    compression: number;
    tokensSaved: number;
    estimatedCost?: number;
  };
}

export const CodeSummarizer: React.FC = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [includeAI, setIncludeAI] = useState(false);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [viewMode, setViewMode] = useState<'structural' | 'ai' | 'both'>(
    'structural'
  );
  const [mounted, setMounted] = useState(false);

  const { user } = useAuthStore();
  const { saveAnalysis } = useAnalysisStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Safe localStorage helper
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      if (typeof window === 'undefined') return null;
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    },
  };

  // Check AI configuration after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    setAiConfigured(isAIConfigured());
  }, []);

  const summarizeCode = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code to analyze');
      return;
    }

    if (includeAI && !aiConfigured) {
      toast.error('Please configure your AI API key first');
      setShowAISettings(true);
      return;
    }

    setLoading(true);
    try {
      // Basic structural analysis
      const structuralSummary = await analyzeCodeStructure(code, language);
      const detectedLanguage =
        language === 'auto' ? detectLanguage(code) : language;

      let result: SummaryResult = {
        original: code,
        language: detectedLanguage,
        structural: structuralSummary,
        stats: calculateStats(code, structuralSummary),
      };

      // AI enhancement if requested and configured
      if (includeAI && aiConfigured) {
        try {
          toast.loading('Getting AI enhancement...', { id: 'ai-loading' });

          const aiSummary = await getAIEnhancement(
            structuralSummary,
            code,
            detectedLanguage
          );

          result.aiEnhanced = aiSummary;

          // Calculate estimated cost (SSR-safe)
          if (mounted) {
            const configData = safeLocalStorage.getItem('gitsense_ai_config');
            if (configData) {
              const config = JSON.parse(configData);
              result.stats.estimatedCost = estimateTokenCost(
                code + structuralSummary,
                config.provider
              );
            }
          }

          toast.success('AI enhancement complete!', { id: 'ai-loading' });
        } catch (error: any) {
          console.warn('AI enhancement failed:', error);
          toast.error(`AI enhancement failed: ${error.message}`, {
            id: 'ai-loading',
          });

          // Continue with structural analysis only
          result.aiEnhanced = undefined;
        }
      }

      setSummary(result);

      if (!result.aiEnhanced && includeAI) {
        toast.success('Structural analysis complete (AI enhancement failed)');
      } else {
        toast.success('Code analyzed successfully!');
      }
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
        if (func.keyLogic.length > 0) {
          summary += `     Key: ${func.keyLogic.slice(0, 2).join('; ')}\n`;
        }
      });
      summary += '\n';
    }

    // Extract classes
    const classes = extractClasses(code, detectedLang);
    if (classes.length > 0) {
      summary += `🏗️ CLASSES (${classes.length}):\n`;
      classes.forEach((cls) => {
        summary += `  📋 ${cls.name}\n`;
        cls.methods.forEach(
          (method: string) => (summary += `    ├─ ${method}\n`)
        );
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
    summary += `Main complexity comes from ${getComplexitySource(code)}. `;
    summary += `Use this summary as context when asking AI about specific implementations, debugging, or optimization.`;

    return summary;
  };

  const detectLanguage = (code: string): string => {
    if (code.includes('def ') && code.includes(':')) return 'python';
    if (code.includes('function ') || code.includes('=>')) return 'javascript';
    if (code.includes('public class') || code.includes('private '))
      return 'java';
    if (code.includes('const ') && code.includes(': ')) return 'typescript';
    if (code.includes('#include') || code.includes('std::')) return 'cpp';
    if (code.includes('<?php')) return 'php';
    if (code.includes('func ') && code.includes('package ')) return 'go';
    if (code.includes('fn ') && code.includes('let ')) return 'rust';
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

        // Extract key logic from next few lines
        const keyLogic: string[] = [];
        for (let i = index + 1; i < Math.min(index + 5, lines.length); i++) {
          const logicLine = lines[i].trim();
          if (
            logicLine &&
            !logicLine.startsWith('//') &&
            !logicLine.startsWith('*')
          ) {
            if (
              logicLine.includes('return') ||
              logicLine.includes('if') ||
              logicLine.includes('=')
            ) {
              keyLogic.push(
                logicLine.substring(0, 60) +
                  (logicLine.length > 60 ? '...' : '')
              );
            }
          }
          if (keyLogic.length >= 2) break;
        }

        functions.push({
          name: name || 'anonymous',
          params: params.replace(/\s+/g, ' '),
          line: index + 1,
          description:
            index > 0 && lines[index - 1].trim().startsWith('//')
              ? lines[index - 1].trim().substring(2).trim()
              : null,
          keyLogic,
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

        const methods: string[] = [];
        for (let i = index + 1; i < Math.min(index + 20, lines.length); i++) {
          const methodMatch = lines[i]
            .trim()
            .match(/^\s*(public\s+|private\s+)?(\w+)\s*\(/);
          if (methodMatch) {
            methods.push(methodMatch[2] + '()');
          }
          if (methods.length >= 5) break;
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
      code.match(/(if|for|while|switch|try|catch|async|await)/g) || []
    ).length;
    if (complexityIndicators > 15) return 'High';
    if (complexityIndicators > 8) return 'Medium';
    return 'Low';
  };

  const getComplexitySource = (code: string): string => {
    if (code.includes('async') || code.includes('await'))
      return 'asynchronous operations';
    if (code.includes('try') || code.includes('catch')) return 'error handling';
    if ((code.match(/if/g) || []).length > 5) return 'conditional logic';
    if ((code.match(/(for|while)/g) || []).length > 3)
      return 'loops and iteration';
    return 'general logic flow';
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

  const handleAIConfigSave = (config: any) => {
    setAiConfigured(true);
    toast.success('AI configuration saved! You can now use AI enhancement.');
  };

  const loadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCode(content);

      // Auto-detect language from file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      const langMap: { [key: string]: string } = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        java: 'java',
        cpp: 'cpp',
        c: 'cpp',
        cs: 'csharp',
        php: 'php',
        go: 'go',
        rs: 'rust',
        rb: 'ruby',
      };

      if (extension && langMap[extension]) {
        setLanguage(langMap[extension]);
      }

      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
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

  const saveSummary = async () => {
    if (!user || !summary) {
      toast.error('Please sign in to save summaries');
      return;
    }

    try {
      await saveAnalysis({
        user_id: user.id,
        repository_url: 'code-snippet',
        analysis_type: includeAI ? 'ai_enhanced' : 'code_summary',
        content: {
          ...summary,
          title: `Code Summary - ${summary.language}`,
          created_at: new Date().toISOString(),
        },
      });

      toast.success('Summary saved to your profile!');
    } catch (error) {
      toast.error('Failed to save summary');
    }
  };

  const loadSampleCode = () => {
    const sampleCode = `// E-commerce cart management system
import React, { useState, useEffect } from 'react';
import { calculateTax, validateCartItem } from '../utils/cart';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

const ShoppingCart: React.FC = () => {
  const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);
  const [isLoading, setIsLoading] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Calculate total with tax and discount
  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = calculateTax(subtotal);
    const discountAmount = subtotal * (discount / 100);
    return subtotal + taxAmount - discountAmount;
  };

  // Add item to cart with validation
  const addToCart = async (newItem: CartItem) => {
    setIsLoading(true);
    try {
      if (!validateCartItem(newItem)) {
        throw new Error('Invalid cart item');
      }

      const existingItem = cart.find(item => item.id === newItem.id);
      
      if (existingItem) {
        setCart(cart.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        ));
      } else {
        setCart([...cart, newItem]);
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="shopping-cart">
      <h2>Shopping Cart ({cart.length} items)</h2>
      <div className="cart-total">
        <strong>Total: \${calculateTotal().toFixed(2)}</strong>
      </div>
    </div>
  );
};

export default ShoppingCart;`;

    setCode(sampleCode);
    setLanguage('typescript');
    toast.success('Sample code loaded!');
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Code className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Code Summarizer</h1>
                  <p className="text-purple-100">
                    Extract key components and optimize for AI context
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAISettings(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Settings className="h-4 w-4 mr-2" />
                AI Settings
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Input Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Code Input
                </h3>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Load File
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={loadSampleCode}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Sample
                  </Button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.php,.go,.rs,.rb"
                onChange={loadFile}
                className="hidden"
              />

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Paste your code here or load a file..."
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    <option value="ruby">Ruby</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center space-x-2 pb-2">
                    <input
                      type="checkbox"
                      id="includeAI"
                      checked={includeAI}
                      onChange={(e) => setIncludeAI(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label
                      htmlFor="includeAI"
                      className="text-sm text-gray-700"
                    >
                      AI Enhancement {!aiConfigured && '(Setup Required)'}
                    </label>
                  </div>
                </div>
              </div>

              <Button
                onClick={summarizeCode}
                loading={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={!code.trim() || (includeAI && !aiConfigured)}
              >
                <Zap className="h-4 w-4 mr-2" />
                {loading ? 'Analyzing...' : 'Analyze Code'}
              </Button>

              {/* AI Configuration Status */}
              {includeAI && !aiConfigured && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-800 font-medium mb-1">
                        AI Enhancement Requires Setup
                      </p>
                      <p className="text-sm text-amber-700 mb-3">
                        Configure your OpenAI or Claude API key to unlock
                        AI-powered insights and recommendations.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAISettings(true)}
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure AI
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cost Estimation - SSR Safe */}
              {includeAI && aiConfigured && code && mounted && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Estimated Cost
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    ~$
                    {(() => {
                      const configData =
                        safeLocalStorage.getItem('gitsense_ai_config');
                      if (configData) {
                        const config = JSON.parse(configData);
                        return estimateTokenCost(code, config.provider).toFixed(
                          4
                        );
                      }
                      return '0.0010';
                    })()}{' '}
                    per analysis
                  </p>
                </div>
              )}

              {code && (
                <div className="bg-gray-50 rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Code Stats</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>Lines: {code.split('\n').length}</div>
                    <div>Characters: {code.length.toLocaleString()}</div>
                    <div>Language: {language}</div>
                    <div>
                      Est. Tokens: ~
                      {Math.round(code.length / 4).toLocaleString()}
                    </div>
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
                      <div>
                        Tokens Saved: ~
                        {summary.stats.tokensSaved.toLocaleString()}
                      </div>
                      {summary.stats.estimatedCost && (
                        <div className="col-span-2">
                          Cost: ~${summary.stats.estimatedCost.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex space-x-2 mb-4">
                    <button
                      onClick={() => setViewMode('structural')}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        viewMode === 'structural'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Structural
                    </button>
                    {summary.aiEnhanced && (
                      <button
                        onClick={() => setViewMode('ai')}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          viewMode === 'ai'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Zap className="h-3 w-3 inline mr-1" />
                        AI Enhanced
                      </button>
                    )}
                    {summary.aiEnhanced && (
                      <button
                        onClick={() => setViewMode('both')}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          viewMode === 'both'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Both
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {(viewMode === 'structural' || viewMode === 'both') && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Structural Summary
                        </h4>
                        <div className="bg-gray-50 rounded-md p-4 font-mono text-sm max-h-64 overflow-y-auto border">
                          <pre className="whitespace-pre-wrap text-gray-800">
                            {summary.structural}
                          </pre>
                        </div>
                      </div>
                    )}

                    {summary.aiEnhanced &&
                      (viewMode === 'ai' || viewMode === 'both') && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            <Zap className="h-4 w-4 mr-1 text-purple-600" />
                            AI Enhancement
                          </h4>
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-md p-4 text-sm max-h-64 overflow-y-auto border border-purple-200">
                            <div className="prose prose-sm max-w-none">
                              <pre className="whitespace-pre-wrap text-gray-800 font-sans">
                                {summary.aiEnhanced}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const content =
                          viewMode === 'ai' && summary.aiEnhanced
                            ? summary.aiEnhanced
                            : viewMode === 'both' && summary.aiEnhanced
                            ? `${summary.structural}\n\n${summary.aiEnhanced}`
                            : summary.structural;
                        copyToClipboard(content);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Summary
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportSummary}>
                      <Download className="h-4 w-4 mr-1" />
                      Export JSON
                    </Button>
                    {user && (
                      <Button variant="outline" size="sm" onClick={saveSummary}>
                        <Save className="h-4 w-4 mr-1" />
                        Save to Profile
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 rounded-md p-8 text-center text-gray-500">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">
                    Paste your code above to generate an optimized summary
                  </p>
                  <p className="text-sm mb-4">
                    Perfect for AI context and documentation
                  </p>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>✨ Extract functions, classes, and key components</p>
                    <p>🎯 Optimize for AI token efficiency</p>
                    <p>📊 Get detailed code metrics and insights</p>
                    {aiConfigured && (
                      <p className="text-purple-600">
                        🤖 AI-powered analysis available
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Settings Modal - SSR Safe */}
      <AISettingsModal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        onSave={handleAIConfigSave}
        currentConfig={(() => {
          if (!mounted) return undefined;
          const configData = safeLocalStorage.getItem('gitsense_ai_config');
          return configData ? JSON.parse(configData) : undefined;
        })()}
      />
    </>
  );
};

export default CodeSummarizer;
