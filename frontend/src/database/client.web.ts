// The browser outbox uses the in-memory fallback in outbox.ts. Keeping this
// module free of expo-sqlite prevents Metro from bundling its native WebAssembly
// implementation into the web application.
export const database = null;

export function initializeDatabase() {}
