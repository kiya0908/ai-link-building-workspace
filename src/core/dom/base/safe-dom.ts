export function safeQuery<TElement extends Element>(
  root: ParentNode,
  selectors: string[]
): TElement | null {
  for (const selector of selectors) {
    try {
      const element = root.querySelector<TElement>(selector);
      if (element) {
        return element;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function safeQueryInput(root: ParentNode, selectors: string[]): HTMLInputElement | null {
  return safeQuery<HTMLInputElement>(root, selectors);
}

/**
 * Finds a submit control belonging to the form that owns the detected comment
 * field. This prevents unrelated forms (search, newsletter, etc.) from
 * winning a page-level submit selector match.
 */
export function findCommentFormSubmit(
  commentBox: HTMLElement | null,
  selectors: string[]
): HTMLElement | null {
  const form = getAssociatedForm(commentBox);
  if (!form) {
    return null;
  }

  for (const selector of selectors) {
    try {
      const candidates = Array.from(form.querySelectorAll<HTMLElement>(selector));
      const submit = candidates.find(isUsableSubmitControl);
      if (submit) {
        return submit;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function getAssociatedForm(element: HTMLElement | null): HTMLFormElement | null {
  if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
    return element.form ?? element.closest('form');
  }

  return element?.closest('form') ?? null;
}

function isUsableSubmitControl(element: HTMLElement): boolean {
  if (!element.isConnected || element instanceof HTMLInputElement && element.type === 'hidden') {
    return false;
  }

  return !(element instanceof HTMLButtonElement || element instanceof HTMLInputElement) || !element.disabled;
}

export function setElementValue(element: HTMLElement | null, value: string): void {
  if (!element) {
    return;
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.value = value;
    dispatchInputEvents(element);
    return;
  }

  if (element.isContentEditable) {
    element.textContent = value;
    dispatchInputEvents(element);
  }
}

export function isEditableCommentElement(element: Element | null): element is HTMLElement {
  return Boolean(
    element instanceof HTMLTextAreaElement ||
      element instanceof HTMLInputElement ||
      (element instanceof HTMLElement && element.isContentEditable)
  );
}

export function getAccessibleFrameDocuments(document: Document): Document[] {
  return Array.from(document.querySelectorAll('iframe'))
    .map((frame) => {
      try {
        return frame.contentDocument;
      } catch {
        return null;
      }
    })
    .filter((frameDocument): frameDocument is Document => frameDocument !== null);
}

export function highlightElement(element: HTMLElement | null): void {
  if (!element) {
    return;
  }

  element.dataset.aiLinkHighlight = 'true';
  element.style.outline = '2px solid #2563eb';
  element.style.outlineOffset = '3px';
}

export function scrollElementIntoView(element: HTMLElement | null): void {
  element?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  });
}

export function dispatchInputEvents(element: HTMLElement): void {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}
