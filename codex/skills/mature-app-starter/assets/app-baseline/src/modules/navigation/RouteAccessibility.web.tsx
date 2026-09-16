import { useEffect, useRef, type PropsWithChildren } from 'react';

/** The host supplies navigator focus; nested screens own their own heading. */
export function RouteAccessibility({ children, focused }: PropsWithChildren<{ focused: boolean }>) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!focused || !element) return;
    let frame = 0;
    let scheduled = false;
    const focusHeading = () => {
      const heading = Array.from(element.querySelectorAll<HTMLElement>('h1, [role="heading"][aria-level="1"]')).find(node => node.closest('[data-route-screen]') === element);
      if (scheduled || !heading || heading.closest('[data-route-screen]') !== element) return;
      scheduled = true;
      observer.disconnect();
      frame = requestAnimationFrame(() => {
        if (!heading.isConnected || heading.closest('[inert]')) return;
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      });
    };
    const observer = new MutationObserver(focusHeading);
    observer.observe(element, { childList: true, subtree: true });
    focusHeading();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [focused]);
  return <div ref={root} data-route-screen="" inert={!focused} aria-hidden={!focused} style={{ display: focused ? 'flex' : 'none', flex: 1, minHeight: 0, flexDirection: 'column' }}>{children}</div>;
}
