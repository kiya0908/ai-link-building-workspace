export async function retry<T>(
  operation: () => T | Promise<T>,
  options: { attempts: number; delayMs: number }
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < options.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < options.attempts - 1) {
        await delay(options.delayMs);
      }
    }
  }

  throw lastError;
}

function delay(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}
