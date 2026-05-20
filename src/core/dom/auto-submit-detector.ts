import { createRuntimeMessageClient } from '@/shared/messaging/runtime-client';

/**
 * Detects when a comment form is likely submitted and automatically
 * marks the current target as 'submitted'.
 */
export function startAutoSubmitDetector(document: Document, targetId: string | null): () => void {
  if (!targetId) {
    return () => {};
  }

  const runtimeClient = createRuntimeMessageClient();
  let submitted = false;

  const handleSubmit = () => {
    if (submitted) {
      return;
    }
    submitted = true;
    runtimeClient
      .send({
        type: 'QUEUE_UPDATE_STATUS',
        payload: { targetId, status: 'submitted' }
      })
      .catch(() => {
        // Ignore background errors
      });
  };

  // Listen for form submit events on the page
  document.addEventListener('submit', handleSubmit, true);

  // Watch for comment form removal (SPA navigation after submit)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.removedNodes)) {
        if (node instanceof Element && isCommentForm(node)) {
          // Wait briefly to confirm it's not a re-render
          setTimeout(() => {
            if (!document.body.contains(node)) {
              handleSubmit();
            }
          }, 500);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Also detect URL changes that might indicate successful submission
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  const handleUrlChange = () => {
    handleSubmit();
  };

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    handleUrlChange();
  };
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    handleUrlChange();
  };
  window.addEventListener('popstate', handleUrlChange);

  return () => {
    document.removeEventListener('submit', handleSubmit, true);
    observer.disconnect();
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener('popstate', handleUrlChange);
  };
}

function isCommentForm(element: Element): boolean {
  return (
    element instanceof HTMLFormElement &&
    (element.querySelector('textarea') !== null ||
      element.querySelector('input[type="text"]') !== null)
  );
}
