import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

interface SidebarErrorBoundaryProps {
  children: ReactNode;
}

interface SidebarErrorBoundaryState {
  message: string | null;
}

export class SidebarErrorBoundary extends Component<
  SidebarErrorBoundaryProps,
  SidebarErrorBoundaryState
> {
  override state: SidebarErrorBoundaryState = {
    message: null
  };

  static getDerivedStateFromError(error: Error): SidebarErrorBoundaryState {
    return {
      message: error.message
    };
  }

  override componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.error('AI Link sidebar failed to render.', error);
  }

  override render() {
    if (this.state.message) {
      return (
        <aside className="ai-link-sidebar ai-link-sidebar--error" role="alert">
          <div className="ai-link-sidebar__panel">
            <div className="ai-link-empty">
              <strong>Sidebar unavailable</strong>
              <span>{this.state.message}</span>
            </div>
          </div>
        </aside>
      );
    }

    return this.props.children;
  }
}
