// netlify/functions/ai-enhance.ts
import { Handler } from '@netlify/functions';

interface AIRequest {
  provider: 'openai' | 'claude';
  structuralSummary: string;
  originalCode: string;
  language: string;
  userApiKey?: string; // Optional: allow users to use their own keys
}

const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body: AIRequest = JSON.parse(event.body || '{}');
    const { provider, structuralSummary, originalCode, language, userApiKey } =
      body;

    if (!structuralSummary || !originalCode || !language) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Use user's API key or fallback to environment variables
    const apiKey =
      userApiKey ||
      (provider === 'openai'
        ? process.env.OPENAI_API_KEY
        : process.env.CLAUDE_API_KEY);

    if (!apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error:
            'API key not configured. Please provide your own API key or contact support.',
        }),
      };
    }

    const prompt = buildEnhancementPrompt(
      structuralSummary,
      originalCode,
      language
    );

    let enhancedSummary: string;
    let usage: any = {};

    if (provider === 'openai') {
      const result = await callOpenAI(prompt, apiKey);
      enhancedSummary = result.content;
      usage = result.usage;
    } else if (provider === 'claude') {
      const result = await callClaude(prompt, apiKey);
      enhancedSummary = result.content;
      usage = result.usage;
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Unsupported AI provider' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        enhancement: enhancedSummary,
        usage,
        provider,
      }),
    };
  } catch (error) {
    console.error('AI Enhancement Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal server error',
      }),
    };
  }
};

function buildEnhancementPrompt(
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

async function callOpenAI(prompt: string, apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
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
  return {
    content: data.choices[0]?.message?.content || 'No response generated',
    usage: data.usage,
  };
}

async function callClaude(prompt: string, apiKey: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
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
  return {
    content: data.content[0]?.text || 'No response generated',
    usage: data.usage,
  };
}

export { handler };
