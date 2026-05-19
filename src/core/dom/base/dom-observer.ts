export interface DomObserverHandle {
  disconnect(): void;
}

export function observeDomChanges(
  root: Node,
  onChange: () => void,
  options: MutationObserverInit = { childList: true, subtree: true }
): DomObserverHandle {
  const observer = new MutationObserver(() => {
    onChange();
  });

  observer.observe(root, options);

  return {
    disconnect() {
      observer.disconnect();
    }
  };
}
