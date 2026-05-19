export function buildStableSelector(element: Element): string {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  const name = element.getAttribute('name');
  if (name) {
    return `${element.localName}[name="${CSS.escape(name)}"]`;
  }

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    return `${element.localName}[aria-label="${CSS.escape(ariaLabel)}"]`;
  }

  return element.localName;
}
