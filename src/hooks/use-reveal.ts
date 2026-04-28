import { useEffect, useRef, useState } from "react";

/**
 * Subtle reveal-on-scroll. Returns a ref + boolean.
 * Adds the visible state once the element enters the viewport.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.15 }
) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(entry.target);
        }
      });
    }, options);
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}
