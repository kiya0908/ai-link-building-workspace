import { useEffect, useState } from 'react';
import {
  DEFAULT_OPENROUTER_MODEL,
  loadStoredOpenRouterConfig,
  saveOpenRouterConfig
} from '@/core/ai/adapters/openrouter-config';
import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';

interface AISettingsPanelProps {
  onSaved(message: string): void;
  onError(message: string): void;
}

export function AISettingsPanel({ onSaved, onError }: AISettingsPanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_OPENROUTER_MODEL);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadStoredOpenRouterConfig()
      .then((config) => {
        setApiKey(config.apiKey);
        setModel(config.model);
      })
      .catch((error: unknown) => {
        onError(error instanceof Error ? error.message : 'Unable to load OpenRouter settings.');
      });
  }, [onError]);

  const handleSave = () => {
    setIsSaving(true);
    saveOpenRouterConfig({
      apiKey: apiKey.trim(),
      model: model.trim() || DEFAULT_OPENROUTER_MODEL
    })
      .then(() => {
        onSaved('OpenRouter settings saved.');
      })
      .catch((error: unknown) => {
        onError(error instanceof Error ? error.message : 'Unable to save OpenRouter settings.');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <WorkspacePanel title="AI Settings">
      <div className="ai-link-settings">
        <label>
          <span>OpenRouter API Key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.currentTarget.value)}
            placeholder="sk-or-..."
            autoComplete="off"
          />
        </label>
        <label>
          <span>Model</span>
          <input
            type="text"
            value={model}
            onChange={(event) => setModel(event.currentTarget.value)}
            placeholder={DEFAULT_OPENROUTER_MODEL}
          />
        </label>
        <button type="button" className="ai-link-button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save AI Settings'}
        </button>
      </div>
    </WorkspacePanel>
  );
}
