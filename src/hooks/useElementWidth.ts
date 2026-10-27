import { useLayoutEffect, useState, type RefObject } from "react";

// Width of an element in px, kept up to date. It's 0 until the element has been measured, which
// happens before the first paint.
export const useElementWidth = (ref: RefObject<HTMLElement | null>) => {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.clientWidth);
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
};
