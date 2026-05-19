import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';
import type { SidebarArticleAnalysis } from '@/ui/sidebar/types';

interface ArticleAnalysisPanelProps {
  analysis: SidebarArticleAnalysis;
  isLoading: boolean;
}

export function ArticleAnalysisPanel({ analysis, isLoading }: ArticleAnalysisPanelProps) {
  return (
    <WorkspacePanel title="Article Analysis">
      {isLoading ? (
        <div className="ai-link-loading">Analyzing current page...</div>
      ) : (
        <div className="ai-link-analysis">
          <strong>{analysis.title}</strong>
          <p>{analysis.summary}</p>
          <dl>
            <div>
              <dt>Language</dt>
              <dd>{analysis.language}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{analysis.detectedProvider}</dd>
            </div>
            <div>
              <dt>Quality</dt>
              <dd>{analysis.qualityScore}/100</dd>
            </div>
          </dl>
        </div>
      )}
    </WorkspacePanel>
  );
}
