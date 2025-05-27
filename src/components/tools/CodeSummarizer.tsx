// src/components/tools/CodeSummarizer.tsx
import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../store/auth';
import { useAnalysisStore } from '../../store/analysis';
import { Code, Copy, Download, Zap, Save, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

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
  };
}

export const CodeSummarizer: React.FC = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [includeAI, setIncludeAI] = useState(false);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'structural' | 'ai' | 'both'>('structural');
  const [savedSummaries, setSavedSummaries] = useState<any[]>([]);
  
  const { user } = useAuthStore();
  const { saveAnalysis } = useAnalysisStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const summarizeCode = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code to analyze');
      return;
    }

    setLoading(true);
    try {
      // Basic structural analysis
      const structuralSummary = await analyzeCodeStructure(code, language);
      
      let result: SummaryResult = {
        original: code,
        language: language === 'auto' ? detectLanguage(code) : language,
        structural: structuralSummary,
        stats: calculateStats(code, structuralSummary)
      };

      // AI enhancement if requested and user has access
      if (includeAI && user) {
        try {
          const aiSummary = await getAIEnhancement(structuralSummary);
          result.aiEnhanced = aiSummary;
        } catch (error) {
          console.warn('AI enhancement failed:', error);
          toast.error('AI enhancement failed, showing structural analysis only');
        }
      }

      setSummary(result);
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
      functions.forEach(func => {
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
      classes.forEach(cls => {
        summary += `  📋 ${cls.name}\n`;
        cls.methods.forEach(method => summary += `    ├─ ${method}\n`);
      });
      summary += '\n';
    }

    // Extract imports
    const imports = extractImports(code, detectedLang);
    if (imports.length > 0) {
      summary += `📦 DEPENDENCIES:\n`;
      imports.slice(0, 10).forEach(imp => summary += `  • ${imp}\n`);
      summary += '\n';
    }

    // Extract variables
    const variables = extractVariables(code, detectedLang);
    if (variables.length > 0) {
      summary += `📊 KEY VARIABLES:\n`;
      variables.slice(0, 8).forEach(variable => summary += `  • ${variable}\n`);
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

  // All the helper functions (detectLanguage, extractFunctions, etc.)
  const detectLanguage = (code: string): string => {
    if (code.includes('def ') && code.includes(':')) return 'python';
    if (code.includes('function ') || code.includes('=>')) return 'javascript';
    if (code.includes('public class') || code.includes('private ')) return 'java';
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
      javascript: /^(function\s+(\w+)\s*\(([^)]*)\)|const\s+(\w+)\s*=\s*(\([^)]*\))?\s*=>)/,
      python: /^def\s+(\w+)\s*\(([^)]*)\):/,
      java: /^(public|private|protected)?\s*(static\s+)?\w+\s+(\w+)\s*\(([^)]*)\)/,
      typescript: /^(function\s+(\w+)\s*\(([^)]*)\)|const\s+(\w+)\s*=\s*(\([^)]*\))?\s*=>)/
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
          if (logicLine && !logicLine.startsWith('//') && !logicLine.startsWith('*')) {
            if (logicLine.includes('return') || logicLine.includes('if') || logicLine.includes('=')) {
              keyLogic.push(logicLine.substring(0, 60) + (logicLine.length > 60 ? '...' : ''));
            }
          }
          if (keyLogic.length >= 2) break;
        }
        
        functions.push({
          name: name || 'anonymous',
          params: params.replace(/\s+/g, ' '),
          line: index + 1,
          description: index > 0 && lines[index - 1].trim().startsWith('//') 
            ? lines[index - 1].trim().substring(2).trim() 
            : null,
          keyLogic
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
      typescript: /^(export\s+)?(class\s+(\w+)|interface\s+(\w+))/
    };

    const pattern = patterns[language];
    if (!pattern) return classes;

    lines.forEach((line, index) => {
      const match = line.trim().match(pattern);
      if (match) {
        const name = match[3] || match[4] || match[2] || match[1];
        
        const methods: string[] = [];
        for (let i = index + 1; i < Math.min(index + 20, lines.length); i++) {
          const methodMatch = lines[i].trim().match(/^\s*(public\s+|private\s+)?(\w+)\s*\(/);
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
      javascript: [/^import\s+.+from\s+['"`].+['"`]/, /^const\s+.+=\s+require\(['"`].+['"`]\)/],
      python: [/^(import|from)\s+[\w.]+/],
      java: [/^import\s+[\w.]+;/],
      typescript: [/^import\s+.+from\s+['"`].+['"`]/]
    };

    const langPatterns = patterns[language] || patterns.javascript;

    lines.forEach(line => {
      const trimmed = line.trim();
      langPatterns.forEach(pattern => {
        if (pattern.test(trimmed)) {
          imports.push(trimmed);
        }
      });
    });

    return imports;
  };

  const extractVariables = (code: string, language: string) => {
    const variables: string[] = [];
    const lines = code.split('\n');

    const varPatterns: { [key: string]: RegExp[] } = {
      javascript: [/^(const|let|var)\s+([A-Z_][A-Z0-9_]*)\s*=/, /^(const|let|var)\s+(\w+)\s*=.*config/i],
      python: [/^[A-Z_][A-Z0-9_]*\s*=/, /^\w+\s*=.*Config/i],
      java: [/^(public\s+)?(static\s+)?(final\s+)?[A-Z_][A-Z0-9_\s]*\s+(\w+)\s*=/],
    };

    const patterns = varPatterns[language] || varPatterns.javascript;

    lines.forEach(line => {
      const trimmed = line.trim();
      patterns.forEach(pattern => {
        const match = trimmed.match(pattern);
        if (match) {
          variables.push(trimmed.substring(0, 80) + (trimmed.length > 80 ? '...' : ''));
        }
      });
    });

    return variables.slice(0, 8);
  };

  const assessComplexity = (code: string): string => {
    const complexityIndicators = (code.match(/(if|for|while|switch|try|catch|async|await)/g) || []).length;
    if (complexityIndicators > 15) return 'High';
    if (complexityIndicators > 8) return 'Medium';
    return 'Low';
  };

  const getComplexitySource = (code: string): string => {
    if (code.includes('async') || code.includes('await')) return 'asynchronous operations';
    if (code.includes('try') || code.includes('catch')) return 'error handling';
    if ((code.match(/if/g) || []).length > 5) return 'conditional logic';
    if ((code.match(/(for|while)/g) || []).length > 3) return 'loops and iteration';
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
      tokensSaved: Math.max(0, tokensSaved)
    };
  };

  const getAIEnhancement = async (structuralSummary: string) => {
    // Mock AI enhancement - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return `🤖 AI-Enhanced Analysis:

This code demonstrates good architectural patterns and follows modern development practices.

Key Insights:
- Primary functionality: Data processing and user interaction
- Architecture pattern: ${code.includes('class') ? 'Object-oriented' : 'Functional'} approach
- Complexity level: ${assessComplexity(code)} - appropriate for the task requirements
- Performance: Well-structured for typical use cases

Recommendations:
1. Consider adding error boundary handling for resilience
2. Implement input validation for enhanced security
3. Add unit tests for critical functions
4. Consider memoization for performance optimization

Best Practices Observed:
${code.includes('const') ? '✅ Uses const for immutable bindings' : ''}
${code.includes('try') ? '✅ Proper error handling' : ''}
${code.includes('function') || code.includes('=>') ? '✅ Modular function design' : ''}
${code.includes('//') ? '✅ Includes documentation' : ''}

This analysis is optimized for AI context and saves approximately 75% of original tokens while maintaining all essential information for productive AI conversations.`;
  };

  // Save summary to user profile
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
          created_at: new Date().toISOString()
        }
      });
      
      toast.success('Summary saved to your profile!');
    } catch (error) {
      toast.error('Failed to save summary');
    }
  };

  // Load file content
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
        'js': 'javascript', 'jsx': 'javascript',
        'ts': 'typescript', 'tsx': 'typescript',
        'py': 'python', 'java': 'java', 'cpp': 'cpp',
        'c': 'cpp', 'cs': 'csharp', 'php': 'php',
        'go': 'go', 'rs': 'rust', 'rb': 'ruby'
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
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_summary_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(cart.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  return (
    <div className="shopping-cart">
      <h2>Shopping Cart ({cart.length} items)</h2>
      
      {cart.map(item => (
        <div key={item.id} className="cart-item">
          <span>{item.name}</span>
          <span>\${item.price}</span>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
          />
          <button onClick={() => removeFromCart(item.id)}>Remove</button>
        </div>
      ))}
      
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <Code className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Code Summarizer</h1>
              <p className="text-purple-100">Extract key components and optimize for AI context</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Code Input</h3>
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
                 <label htmlFor="includeAI" className="text-sm text-gray-700">
                   AI Enhancement {!user && '(Pro)'}
                 </label>
               </div>
             </div>
           </div>

           <Button
             onClick={summarizeCode}
             loading={loading}
             className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
             disabled={!code.trim() || (includeAI && !user)}
           >
             <Zap className="h-4 w-4 mr-2" />
             {loading ? 'Analyzing...' : 'Analyze Code'}
           </Button>

           {includeAI && !user && (
             <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
               <p className="text-sm text-blue-800">
                 Sign up for Pro to unlock AI-enhanced summaries with intelligent insights and optimization recommendations.
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
                 <div>Est. Tokens: ~{Math.round(code.length / 4).toLocaleString()}</div>
               </div>
             </div>
           )}
         </div>

         {/* Results Section */}
         <div className="space-y-4">
           {summary ? (
             <>
               <div className="bg-green-50 border border-green-200 rounded-md p-4">
                 <h3 className="font-medium text-green-900 mb-2">Analysis Complete</h3>
                 <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                   <div>Original: {summary.stats.originalLines} lines</div>
                   <div>Summary: {summary.stats.summaryLines} lines</div>
                   <div>Compression: {summary.stats.compression}%</div>
                   <div>Tokens Saved: ~{summary.stats.tokensSaved.toLocaleString()}</div>
                 </div>
               </div>

               {/* View Mode Toggle */}
               <div className="flex space-x-2 mb-4">
                 <button
                   onClick={() => setViewMode('structural')}
                   className={`px-3 py-1 text-sm rounded ${
                     viewMode === 'structural'
                       ? 'bg-purple-600 text-white'
                       : 'bg-gray-200 text-gray-700'
                   }`}
                 >
                   Structural
                 </button>
                 {summary.aiEnhanced && (
                   <button
                     onClick={() => setViewMode('ai')}
                     className={`px-3 py-1 text-sm rounded ${
                       viewMode === 'ai'
                         ? 'bg-purple-600 text-white'
                         : 'bg-gray-200 text-gray-700'
                     }`}
                   >
                     AI Enhanced
                   </button>
                 )}
                 {summary.aiEnhanced && (
                   <button
                     onClick={() => setViewMode('both')}
                     className={`px-3 py-1 text-sm rounded ${
                       viewMode === 'both'
                         ? 'bg-purple-600 text-white'
                         : 'bg-gray-200 text-gray-700'
                     }`}
                   >
                     Both
                   </button>
                 )}
               </div>

               <div className="space-y-4">
                 {(viewMode === 'structural' || viewMode === 'both') && (
                   <div>
                     <h4 className="font-medium text-gray-900 mb-2">Structural Summary</h4>
                     <div className="bg-gray-50 rounded-md p-4 font-mono text-sm max-h-64 overflow-y-auto">
                       <pre className="whitespace-pre-wrap">{summary.structural}</pre>
                     </div>
                   </div>
                 )}

                 {summary.aiEnhanced && (viewMode === 'ai' || viewMode === 'both') && (
                   <div>
                     <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                       <Zap className="h-4 w-4 mr-1 text-purple-600" />
                       AI Enhancement
                     </h4>
                     <div className="bg-purple-50 rounded-md p-4 font-mono text-sm max-h-64 overflow-y-auto">
                       <pre className="whitespace-pre-wrap">{summary.aiEnhanced}</pre>
                     </div>
                   </div>
                 )}
               </div>

               <div className="flex flex-wrap gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     const content = viewMode === 'ai' && summary.aiEnhanced 
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
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={exportSummary}
                 >
                   <Download className="h-4 w-4 mr-1" />
                   Export JSON
                 </Button>
                 {user && (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={saveSummary}
                   >
                     <Save className="h-4 w-4 mr-1" />
                     Save to Profile
                   </Button>
                 )}
               </div>
             </>
           ) : (
             <div className="bg-gray-50 rounded-md p-8 text-center text-gray-500">
               <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p className="text-lg mb-2">Paste your code above to generate an optimized summary</p>
               <p className="text-sm">Perfect for AI context and documentation</p>
               <div className="mt-4 text-xs text-gray-400">
                 <p>✨ Extract functions, classes, and key components</p>
                 <p>🎯 Optimize for AI token efficiency</p>
                 <p>📊 Get detailed code metrics and insights</p>
               </div>
             </div>
           )}
         </div>
       </div>
     </div>
   </div>
 );
};

export default CodeSummarizer;
