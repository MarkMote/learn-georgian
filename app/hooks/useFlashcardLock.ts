// app/hooks/useFlashcardLock.ts
// Hook to lock flashcard screens: no zoom, no scroll, no orientation flip

import { useEffect } from 'react';

export function useFlashcardLock(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    // Store original viewport content
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const originalContent = viewportMeta?.getAttribute('content') || '';

    // Set viewport to disable zoom
    if (viewportMeta) {
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }

    // Lock body scroll
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    // Try to lock orientation (works in some mobile browsers when in fullscreen/PWA)
    const lockOrientation = async () => {
      try {
        if (screen.orientation && 'lock' in screen.orientation) {
          await screen.orientation.lock('portrait');
        }
      } catch (e) {
        // Orientation lock not supported or not allowed - that's ok
      }
    };
    lockOrientation();

    // Prevent touchmove on document (allows buttons to still work)
    const preventTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // Allow touch on interactive elements
      if (!target.closest('button') && !target.closest('a') && !target.closest('[role="button"]') && !target.closest('input') && !target.closest('textarea')) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventTouchMove, { passive: false });

    // Prevent pinch zoom via gesturestart (Safari)
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener('gesturestart', preventGesture);
    document.addEventListener('gesturechange', preventGesture);
    document.addEventListener('gestureend', preventGesture);

    // Cleanup
    return () => {
      // Restore original viewport
      if (viewportMeta && originalContent) {
        viewportMeta.setAttribute('content', originalContent);
      }

      // Restore body styles
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';

      // Unlock orientation
      try {
        if (screen.orientation && 'unlock' in screen.orientation) {
          screen.orientation.unlock();
        }
      } catch (e) {
        // Ignore
      }

      // Remove event listeners
      document.removeEventListener('touchmove', preventTouchMove);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
    };
  }, [enabled]);
}
