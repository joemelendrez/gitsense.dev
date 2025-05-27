// src/components/modals/AISettingsModal.tsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface AIConfig {
  provider: 'openai' | 'claude';
  apiKey?: string;
  model?: string;
  useServerless?: boolean;
}

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AIConfig) => void;
  currentConfig?: AIConfig;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig,
}) => {
  const [provider, setProvider] = useState<'openai' | 'claude'>(
    currentConfig?.provider || 'openai'
  );
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [model, setModel] = useState(currentConfig?.model || '');
  const [useServerless, setUseServerless] = useState(
    currentConfig?.useServerless !== false // Default to true
  );

  const handleSave = () => {
    if (!useServerless && !apiKey.trim()) {
      toast.error('Please enter an API key or use serverless mode');
      return;
    }

    const config: AIConfig = {
      provider,
      apiKey: apiKey.trim() || undefined,
      model: model.trim() || undefined,
      useServerless,
    };

    // Save to localStorage for persistence
    localStorage.setItem('gitsense_ai_config', JSON.stringify(config));
    onSave(config);
    onClose();
    toast.success('AI settings saved!');
  };

  const getDefaultModel = () => {
    return provider === 'openai' ? 'gpt-4o-mini' : 'claude-3-haiku-20240307';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">AI Configuration</h3>

        <div className="space-y-4">
          {/* Usage Mode Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Usage Mode</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={useServerless}
                  onChange={() => setUseServerless(true)}
                  className="mr-2"
                />
                <div>
                  <div className="font-medium text-sm">
                    Serverless (Recommended)
                  </div>
                  <div className="text-xs text-gray-500">
                    Uses GitSense servers - no API key needed
                  </div>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!useServerless}
                  onChange={() => setUseServerless(false)}
                  className="mr-2"
                />
                <div>
                  <div className="font-medium text-sm">Direct API</div>
                  <div className="text-xs text-gray-500">
                    Use your own API key for direct calls
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) =>
                setProvider(e.target.value as 'openai' | 'claude')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="openai">OpenAI (ChatGPT)</option>
              <option value="claude">Anthropic (Claude)</option>
            </select>
          </div>

          {!useServerless && (
            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your API key is stored locally and never sent to our servers
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Model (Optional)
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={getDefaultModel()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              {useServerless ? 'Serverless Benefits:' : 'Recommended Models:'}
            </h4>
            <div className="text-xs text-blue-700 space-y-1">
              {useServerless ? (
                <>
                  <div>• No API key management required</div>
                  <div>• Automatic rate limiting and error handling</div>
                  <div>• Cost-effective shared infrastructure</div>
                  <div>• Always up-to-date with latest models</div>
                </>
              ) : provider === 'openai' ? (
                <>
                  <div>
                    • <strong>gpt-4o-mini</strong> - Best value ($0.15/1M
                    tokens)
                  </div>
                  <div>
                    • <strong>gpt-4o</strong> - Highest quality ($5/1M tokens)
                  </div>
                </>
              ) : (
                <>
                  <div>
                    • <strong>claude-3-haiku</strong> - Fastest & cheapest
                    ($0.25/1M tokens)
                  </div>
                  <div>
                    • <strong>claude-3-sonnet</strong> - Balanced ($3/1M tokens)
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
