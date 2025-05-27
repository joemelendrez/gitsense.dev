// src/lib/ai-service.ts - Fixed version without React imports
import { toast } from 'react-hot-toast';

interface AIConfig {
  provider: 'openai' | 'claude';
  apiKey?: string; // Optional for user's own keys
  model?: string;
  useServerless?: boolean; // Use Netlify function or direct API
}

interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = {
      useServerless: true, // Default to using Netlify function
      ...config,
    };
  }

  async enhanceCodeSummary(
    structuralSummary: string,
    originalCode: string,
    language: string
  ): Promise<string> {
    try {
      if (this.config.useServerless) {
        return await this.callNetlifyFunction(
          structuralSummary,
          originalCode,
          language
        );
      } else {
        // Direct API call (requires user's API key)
        return await this.callDirectAPI(
          structuralSummary,
          originalCode,
          language
        );
      }
    } catch (error: any) {
      console.error('AI enhancement failed:', error);
      throw error;
    }
  }

  private async callNetlifyFunction(
    structuralSummary: string,
    originalCode: string,
    language: string
  ): Promise<string> {
    const response = await fetch('/.netlify/functions/ai-enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: this.config.provider,
        structuralSummary,
        originalCode,
        language,
        userApiKey: this.config.apiKey, // Optional user key
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to enhance code summary');
    }

    const data = await response.json();
    return this.formatEnhancement(data.enhancement);
  }

  private async callDirectAPI(
    structuralSummary: string,
    originalCode: string,
    language: string
  ): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('API key required for direct API calls');
    }

    const prompt = this.buildEnhancementPrompt(
      structuralSummary,
      originalCode,
      language
    );

    if (this.config.provider === 'openai') {
      return await this.callOpenAI(prompt);
    } else if (this.config.provider === 'claude') {
      return await this.callClaude(prompt);
    } else {
      throw new Error('Unsupported AI provider');
    }
  }

  private formatEnhancement(rawEnhancement: string): string {
    return `🤖 **AI-Enhanced Analysis**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${rawEnhancement}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ **Token Efficiency**: This analysis saves ~75% of original tokens while maintaining comprehensive context for AI conversations.

💡 **Usage Tip**: Copy this summary when asking AI tools about code improvements, debugging, or architectural decisions.`;
  }

  private buildEnhancementPrompt(
    structuralSummary: string,
    originalCode: string,
    language: string
  ): string {
    return `You are an expert code analyst. Based on the structural analysis below, provide an enhanced AI-optimized summary.

STRUCTURAL ANALYSIS:
${structuralSummary}

ORIGINAL CODE SNIPPET (first 500 chars):
${originalCode.substring(0, 500)}${originalCode.length > 500 ? '...' : ''}

LANGUAGE: ${language}

Please provide:
1. 🎯 **Purpose & Architecture**: What this code does and its architectural pattern
2. 🔧 **Key Components**: Most important functions/classes and their roles  
3. 📊 **Complexity Analysis**: Performance considerations and bottlenecks
4. 💡 **Best Practices**: Code quality observations (good and areas for improvement)
5. 🚀 **AI Context**: How to best use this summary for AI conversations
6. 📋 **Recommendations**: 3-5 specific improvement suggestions

Format your response to be:
- Concise but comprehensive
- Easy to scan with clear sections
- Optimized for AI token efficiency
- Actionable for developers

Keep the response under 400 words while maintaining high value.`;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert code analyst specializing in creating AI-optimized summaries.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI API error: ${error.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    return this.formatEnhancement(
      data.choices[0]?.message?.content || 'No response generated'
    );
  }

  private async callClaude(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: 800,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Claude API error: ${error.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    return this.formatEnhancement(
      data.content[0]?.text || 'No response generated'
    );
  }
}

// Updated helper functions
export const getAIEnhancement = async (
  structuralSummary: string,
  originalCode: string,
  language: string
): Promise<string> => {
  const configData = localStorage.getItem('gitsense_ai_config');
  if (!configData) {
    throw new Error(
      'AI configuration not found. Please configure AI settings first.'
    );
  }

  const config: AIConfig = JSON.parse(configData);
  const aiService = new AIService(config);

  return await aiService.enhanceCodeSummary(
    structuralSummary,
    originalCode,
    language
  );
};

export const isAIConfigured = (): boolean => {
  const configData = localStorage.getItem('gitsense_ai_config');
  if (!configData) return false;

  try {
    const config = JSON.parse(configData);
    // AI is configured if we have a provider and either serverless mode or API key
    return !!(
      config.provider &&
      (config.useServerless !== false || config.apiKey)
    );
  } catch {
    return false;
  }
};

// Cost estimation helper (updated for serverless)
export const estimateTokenCost = (
  text: string,
  provider: 'openai' | 'claude'
): number => {
  const tokenCount = Math.ceil(text.length / 4); // Rough estimation

  // Serverless rates (slightly higher than direct API to cover infrastructure)
  const serverlessRates = {
    openai: 0.2 / 1000000, // $0.20 per 1M tokens
    claude: 0.3 / 1000000, // $0.30 per 1M tokens
  };

  // Direct API rates
  const directRates = {
    openai: 0.15 / 1000000, // $0.15 per 1M tokens for gpt-4o-mini
    claude: 0.25 / 1000000, // $0.25 per 1M tokens for claude-3-haiku
  };

  const configData = localStorage.getItem('gitsense_ai_config');
  let useServerless = true;

  if (configData) {
    try {
      const config = JSON.parse(configData);
      useServerless = config.useServerless !== false;
    } catch {
      // Default to serverless
    }
  }

  const rates = useServerless ? serverlessRates : directRates;
  return tokenCount * rates[provider];
};

// Usage analytics helper
export const trackAIUsage = (
  provider: string,
  tokensUsed: number,
  cost: number,
  success: boolean
) => {
  // Track usage for analytics (optional)
  const usage = {
    timestamp: new Date().toISOString(),
    provider,
    tokensUsed,
    cost,
    success,
  };

  // Store in localStorage for user visibility
  const existingUsage = localStorage.getItem('gitsense_ai_usage') || '[]';
  try {
    const usageHistory = JSON.parse(existingUsage);
    usageHistory.push(usage);

    // Keep only last 100 records
    if (usageHistory.length > 100) {
      usageHistory.splice(0, usageHistory.length - 100);
    }

    localStorage.setItem('gitsense_ai_usage', JSON.stringify(usageHistory));
  } catch (error) {
    console.warn('Failed to track AI usage:', error);
  }
};

// Get usage statistics
export const getAIUsageStats = () => {
  try {
    const usageData = localStorage.getItem('gitsense_ai_usage');
    if (!usageData) return null;

    const usage = JSON.parse(usageData);
    const totalCost = usage.reduce(
      (sum: number, record: any) => sum + (record.cost || 0),
      0
    );
    const totalTokens = usage.reduce(
      (sum: number, record: any) => sum + (record.tokensUsed || 0),
      0
    );
    const successRate =
      usage.length > 0
        ? (usage.filter((r: any) => r.success).length / usage.length) * 100
        : 0;

    return {
      totalRequests: usage.length,
      totalCost: totalCost.toFixed(4),
      totalTokens,
      successRate: successRate.toFixed(1),
      lastUsed: usage.length > 0 ? usage[usage.length - 1].timestamp : null,
    };
  } catch {
    return null;
  }
};
