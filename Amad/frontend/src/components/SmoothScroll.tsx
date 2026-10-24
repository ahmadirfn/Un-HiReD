"use client";

import Lenis from "@studio-freight/lenis";
import { useEffect, type ReactNode } from "react";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    let lenis: Lenis | null = null;
    let activeWrapper: HTMLElement | null = null;

    const options = {
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    };

    // The onboarding page scrolls the document. The career workspace uses its
    // own scroll pane, so point Lenis at that pane while it is mounted.
    const syncScrollTarget = () => {
      const wrapper = document.querySelector<HTMLElement>("[data-lenis-wrapper]");
      if (wrapper === activeWrapper && lenis) return;

      lenis?.destroy();
      activeWrapper = wrapper;
      lenis = wrapper
        ? new Lenis({ ...options, wrapper, content: wrapper.querySelector<HTMLElement>("[data-lenis-content]") ?? wrapper })
        : new Lenis(options);
    };

    syncScrollTarget();
    const observer = new MutationObserver(syncScrollTarget);
    observer.observe(document.body, { childList: true, subtree: true });

    let animationFrame = 0;
    const raf = (time: number) => {
      lenis?.raf(time);
      animationFrame = window.requestAnimationFrame(raf);
    };

    animationFrame = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
