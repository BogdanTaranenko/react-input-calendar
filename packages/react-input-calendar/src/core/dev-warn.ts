function isProduction(): boolean {
  // Read `process.env.NODE_ENV` verbatim so bundlers can replace it; a `typeof process`
  // check would stay false in the browser and silence warnings in development too.
  try {
    return process.env.NODE_ENV === 'production';
  } catch {
    // No `process` at all (unbundled ESM in a browser): treat as development.
    return false;
  }
}

/** `console.warn` with the library prefix, skipped in production builds. */
export function devWarn(message: string): void {
  if (isProduction()) return;
  console.warn(`[react-input-calendar] ${message}`);
}
