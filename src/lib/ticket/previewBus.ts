// The preview canvases, shared with the little feed / story / pin mockups beside it.
// They live outside React state because they change many times a second.
let version = 0;
const listeners = new Set<() => void>();

export const previewCanvases: {
  poster: HTMLCanvasElement | null;
  backdrop: HTMLCanvasElement | null;
} = { poster: null, backdrop: null };

// Call after the preview poster has been redrawn
export function notifyPreviewDrawn() {
  version++;
  listeners.forEach((listener) => listener());
}

export const subscribePreview = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const previewVersion = () => version;
