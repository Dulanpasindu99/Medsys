'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayedPath, setDisplayedPath] = useState(pathname);
  const [displayedContent, setDisplayedContent] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'idle' | 'exit' | 'enter'>('idle');
  const incomingContentRef = useRef<React.ReactNode | null>(null);

  useEffect(() => {
    if (pathname !== displayedPath) {
      incomingContentRef.current = children;
      setTransitionStage('exit');
    } else {
      setDisplayedContent(children);
    }
  }, [children, displayedPath, pathname]);

  useEffect(() => {
    if (transitionStage === 'exit') {
      const exitTimer = setTimeout(() => {
        setDisplayedContent(incomingContentRef.current ?? children);
        setDisplayedPath(pathname);
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
      className={`page-transition ${
        transitionStage === 'idle' ? '' : `page-transition--${transitionStage}`
      }`}
    >
      <div className="page-transition__content">{displayedContent}</div>
    </div>
  );
}
