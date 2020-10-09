import * as React from "react";

import { isBrowser, isDev } from "./constants.macro";

export type Props = {
  ssrOnly?: boolean;
  whenIdle?: boolean | number;
  whenVisible?: boolean | IntersectionObserverInit;
  on?: (keyof HTMLElementEventMap)[] | keyof HTMLElementEventMap;
  promise?: Promise<any>;
  children?: React.ReactElement;
  style?: React.CSSProperties;
};

const defaultObserverOptions: IntersectionObserverInit = {
  rootMargin: "150px"
};

// React currently throws a warning when using useLayoutEffect on the server.
const useIsomorphicLayoutEffect = isBrowser
  ? React.useLayoutEffect
  : React.useEffect;

function LazyHydrate(props: Props): React.ReactElement {
  const { ssrOnly, whenIdle, whenVisible, on, promise, children } = props;
  const childRef = React.useRef<HTMLDivElement>(null);

  // Always render on server
  const [hydrated, setHydrated] = React.useState(!isBrowser);

  if (isDev && !ssrOnly && !whenIdle && !whenVisible && !on) {
    console.error(
      `LazyHydration: Enable atleast one trigger for hydration.\n` +
        `If you don't want to hydrate, use ssrOnly`
    );
  }

  useIsomorphicLayoutEffect(() => {
    const element = childRef.current;
    // No SSR Content
    if (!element || !element.hasChildNodes()) {
      setHydrated(true);
    }
  }, []);

  React.useEffect(() => {
    const element = childRef.current;
    if (ssrOnly || hydrated || !element) return;

    const cleanupFns: VoidFunction[] = [];

    function cleanup() {
      cleanupFns.forEach(fn => {
        fn();
      });
    }

    function hydrate() {
      setHydrated(true);
    }

    if (promise) {
      promise.then(hydrate);
    }

    if (whenIdle) {
      // @ts-ignore
      if (requestIdleCallback) {
        // @ts-ignore
        const idleCallbackId = requestIdleCallback(hydrate, { timeout: 500 });
        cleanupFns.push(() => {
          // @ts-ignore
          cancelIdleCallback(idleCallbackId);
        });
      } else {
        const timeout = typeof whenIdle !== "boolean" ? whenIdle : 2000;
        const id = setTimeout(hydrate, timeout);
        cleanupFns.push(() => {
          clearTimeout(id);
        });
      }
    }

    const events: typeof on = [].concat(on || []);

    if (whenVisible) {
      if (IntersectionObserver) {
        const options =
          typeof whenVisible !== "boolean"
            ? whenVisible
            : defaultObserverOptions;

        const io = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting || entry.intersectionRatio > 0) {
              hydrate();
            }
          });
        }, options);
        io.observe(element);

        cleanupFns.push(() => {
          io.disconnect();
        });
      } else {
        hydrate();
      }
    }

    events.forEach(event => {
      element.addEventListener(event, hydrate, {
        once: true,
        passive: true
      });
      cleanupFns.push(() => {
        element.removeEventListener(event, hydrate);
      });
    });

    return cleanup;
  }, [hydrated, on, promise, ssrOnly, whenIdle, whenVisible]);

  if (hydrated) {
    return isBrowser ? children : <div style={props.style}>{children}</div>;
  } else {
    return (
      <div
        ref={childRef}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: "" }}
      />
    );
  }
}

export default LazyHydrate;
