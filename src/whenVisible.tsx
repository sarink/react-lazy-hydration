import * as React from "react";

import { isBrowser } from "./constants.macro";
import { defaultStyle, useHydrationState } from "./utils";

type Props = Omit<
  React.HTMLProps<HTMLDivElement>,
  "dangerouslySetInnerHTML"
> & {
  /**
   * Use a custom IntersectionObserver instance
   */
  observer?: IntersectionObserver;
};

const hydrationEvent = "hydrate";

const observerInstance =
  isBrowser && IntersectionObserver
    ? new IntersectionObserver(entries => {
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            hydrateComponent(entry);
          }
        }
      })
    : null;

function HydrateWhenVisible({ children, observer, ...rest }: Props) {
  const [childRef, hydrated, hydrate] = useHydrationState();

  React.useEffect(() => {
    if (hydrated) return;

    const cleanupFns: VoidFunction[] = [];

    function cleanup() {
      for (let i = 0; i < cleanupFns.length; i++) {
        cleanupFns[i]();
      }
    }

    const io = observer || observerInstance;

    if (io && childRef.current.childElementCount) {
      // As root node does not have any box model, it cannot intersect.
      const el = childRef.current.children[0];
      io.observe(el);

      cleanupFns.push(() => {
        io.unobserve(el);
      });

      childRef.current.addEventListener(hydrationEvent, hydrate, {
        once: true,
        capture: true,
        passive: true
      });

      cleanupFns.push(() => {
        childRef.current.removeEventListener(hydrationEvent, hydrate, {
          capture: true
        });
      });

      return cleanup;
    } else {
      hydrate();
    }
  }, [hydrated, hydrate, childRef, observer]);

  if (hydrated) {
    return (
      <div ref={childRef} style={defaultStyle} {...rest}>
        {children}
      </div>
    );
  } else {
    return (
      <div
        ref={childRef}
        style={defaultStyle}
        suppressHydrationWarning
        {...rest}
        dangerouslySetInnerHTML={{ __html: "" }}
      />
    );
  }
}

function hydrateComponent(entry: IntersectionObserverEntry) {
  entry.target.dispatchEvent(new CustomEvent(hydrationEvent));
}

export { HydrateWhenVisible, hydrateComponent };
