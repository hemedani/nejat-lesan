import { useEffect } from 'react';

/**
 * Custom hook to prevent background scrolling when modals or overlays are open
 * @param isLocked - Boolean indicating whether scrolling should be locked
 */
export const useScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (!isLocked) return;

    // Save current scroll position
    const scrollY = window.scrollY;

    // Lock both <html> and <body> so scroll is blocked regardless of the
    // element that actually owns the scrollbar
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      // Restore scroll position when unlocked
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overscrollBehavior = '';
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
};
