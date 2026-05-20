import { useEffect, useState } from 'react';
import { createIndexedDBLinkAssetRepository } from '@/core/storage/repositories/link-asset-repository';
import type { LinkAsset } from '@/core/types/project';
import { createId } from '@/shared/id';
import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';

interface LinkAssetSettingsPanelProps {
  projectId: string;
  onSaved(message: string): void;
  onError(message: string): void;
}

export function LinkAssetSettingsPanel({
  projectId,
  onSaved,
  onError
}: LinkAssetSettingsPanelProps) {
  const [assetId, setAssetId] = useState<string | null>(null);
  const [anchorText, setAnchorText] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [plainUrl, setPlainUrl] = useState('');

  useEffect(() => {
    let isMounted = true;

    createIndexedDBLinkAssetRepository()
      .getDefaultForProject(projectId)
      .then((asset) => {
        if (!isMounted) {
          return;
        }

        setAssetId(asset?.id ?? null);
        setAnchorText(asset?.anchorText ?? '');
        setHtmlCode(asset?.htmlCode ?? '');
        setPlainUrl(asset?.plainUrl ?? '');
      })
      .catch((error: unknown) => {
        if (isMounted) {
          onError(error instanceof Error ? error.message : 'Unable to load link asset.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, onError]);

  const handleSave = () => {
    const asset: LinkAsset = {
      id: assetId ?? createId(),
      projectId,
      anchorText: anchorText.trim(),
      htmlCode: htmlCode.trim(),
      plainUrl: plainUrl.trim()
    };

    createIndexedDBLinkAssetRepository()
      .put(asset)
      .then(() => {
        setAssetId(asset.id);
        onSaved('Default link asset saved.');
      })
      .catch((error: unknown) => {
        onError(error instanceof Error ? error.message : 'Unable to save link asset.');
      });
  };

  return (
    <WorkspacePanel title="Link Asset">
      <div className="ai-link-settings">
        <label>
          <span>Anchor Text</span>
          <input
            type="text"
            value={anchorText}
            onChange={(event) => setAnchorText(event.currentTarget.value)}
            placeholder="playlist name generator"
          />
        </label>
        <label>
          <span>HTML Code</span>
          <input
            type="text"
            value={htmlCode}
            onChange={(event) => setHtmlCode(event.currentTarget.value)}
            placeholder='<a href="https://example.com">anchor text</a>'
          />
        </label>
        <label>
          <span>Plain URL</span>
          <input
            type="url"
            value={plainUrl}
            onChange={(event) => setPlainUrl(event.currentTarget.value)}
            placeholder="https://example.com"
          />
        </label>
        <button type="button" className="ai-link-button" onClick={handleSave}>
          Save Link Asset
        </button>
      </div>
    </WorkspacePanel>
  );
}
