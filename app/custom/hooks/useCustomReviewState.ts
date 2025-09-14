"use client";

// Custom route disabled - placeholder only
export function useCustomReviewState(customWords?: any, reviewMode?: string) {
  // Return all properties that custom page expects
  return new Proxy({}, {
    get: () => () => {} // Return empty function for any property access
  }) as any;
}