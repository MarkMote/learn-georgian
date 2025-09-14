"use client";

// Chunks route disabled - placeholder only
export function useChunkState(chunkId?: string, chunkSet?: any, reviewMode?: string) {
  // Return all properties that chunks page expects
  return new Proxy({}, {
    get: () => () => {} // Return empty function for any property access
  }) as any;
}