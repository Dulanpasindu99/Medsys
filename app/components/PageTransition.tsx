'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { navigationItems } from './NavigationPanel';

const getNavigationIndex = (path: string) =>
  navigationItems.findIndex((item) => item.href === path);

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayedPath, setDisplayedPath] = useState(pathname);
  const [displayedContent, setDisplayedContent] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');
  const incomingContentRef = useRef<React.ReactNode | null>(null);
  const previousIndexRef = useRef<number | null>(getNavigationIndex(pathname));
  const pendingIndexRef = useRef<number | null>(getNavigationIndex(pathname));

  useEffect(() => {
    if (pathname !== displayedPath) {
      incomingContentRef.current = children;
      const nextIndex = getNavigationIndex(pathname);
      pendingIndexRef.current = nextIndex;
      const currentIndex = previousIndexRef.current;
      if (currentIndex !== null && nextIndex !== null && currentIndex !== nextIndex) {
        setTransitionDirection(nextIndex > currentIndex ? 'forward' : 'backward');
      }
      setTransitionStage('exit');
    } else {
      setDisplayedContent(children);
      previousIndexRef.current = getNavigationIndex(pathname);
      pendingIndexRef.current = previousIndexRef.current;
    }
  }, [children, displayedPath, pathname]);

  useEffect(() => {
    if (transitionStage === 'exit') {
      const exitTimer = setTimeout(() => {
        setDisplayedContent(incomingContentRef.current ?? children);
        setDisplayedPath(pathname);
        previousIndexRef.current = pendingIndexRef.current;
        setTransitionStage('enter');
      }, 240);

      return () => clearTimeout(exitTimer);
    }

    if (transitionStage === 'enter') {
      const enterTimer = setTimeout(() => setTransitionStage('idle'), 320);
      return () => clearTimeout(enterTimer);
    }

    return undefined;
  }, [children, pathname, transitionStage]);

  return (
    <div
      className={`page-transition page-transition--${transitionDirection} ${
        transitionStage === 'idle' ? '' : `page-transition--${transitionStage}`
      }`}
    >
      <div className="page-transition__content">{displayedContent}</div>
    </div>
  );
}
