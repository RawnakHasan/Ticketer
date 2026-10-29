import { create } from "zustand";

import type { Settings } from "@/lib/ticket/settings";
import type { Sticker } from "@/lib/ticket/sticker";
import { useStickerStore } from "@/stores/stickerStore";
import { useTicketerStore } from "@/stores/ticketerStore";

// Undo and redo for everything that shapes the ticket: the settings and the stickers.
// Adding or removing a main or stub photo is not part of it, those have their own buttons.
type Snapshot = { settings: Settings; items: Sticker[] };

type HistoryState = {
  past: Snapshot[];
  future: Snapshot[];
  undo: () => void;
  redo: () => void;
};

const LIMIT = 100;
// Changes this close together (a slider being dragged, someone typing) count as one step
const MERGE_MS = 400;

const now = (): Snapshot => ({
  settings: useTicketerStore.getState().settings,
  items: useStickerStore.getState().items,
});

let applying = false;
let lastChange = 0;

function apply(snapshot: Snapshot) {
  applying = true;
  useTicketerStore.setState({ settings: snapshot.settings });
  useStickerStore.setState((s) => ({
    items: snapshot.items,
    selectedId: snapshot.items.some((item) => item.id === s.selectedId) ? s.selectedId : null,
  }));
  applying = false;
  // Whatever is changed next starts a new step
  lastChange = 0;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  past: [],
  future: [],
  undo: () => {
    const { past, future } = get();
    const previous = past.at(-1);
    if (!previous) return;
    set({ past: past.slice(0, -1), future: [now(), ...future] });
    apply(previous);
  },
  redo: () => {
    const { past, future } = get();
    const [next, ...rest] = future;
    if (!next) return;
    set({ past: [...past, now()].slice(-LIMIT), future: rest });
    apply(next);
  },
}));

// `before` is how things were just before this change
function record(before: Snapshot) {
  if (applying) return;
  const time = performance.now();
  const merging = time - lastChange < MERGE_MS;
  lastChange = time;
  if (merging) return;
  useHistoryStore.setState((h) => ({ past: [...h.past, before].slice(-LIMIT), future: [] }));
}

// Keys that mean something else inside a text box, where the browser's own undo should win
const TYPES_TEXT = new Set(["text", "search", "url", "email", "tel", "password", "number"]);

function onKeyDown(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
  const target = event.target as HTMLElement | null;
  if (
    target &&
    (target.isContentEditable ||
      target.tagName === "TEXTAREA" ||
      (target instanceof HTMLInputElement && TYPES_TEXT.has(target.type)))
  ) {
    return;
  }

  const key = event.key.toLowerCase();
  const { undo, redo } = useHistoryStore.getState();
  if (key === "z" && !event.shiftKey) {
    event.preventDefault();
    undo();
  } else if (key === "y" || (key === "z" && event.shiftKey)) {
    event.preventDefault();
    redo();
  }
}

// Call once at start-up, after saved stickers have been put back so that is not an undo step
export function startHistory() {
  useTicketerStore.subscribe((s, prev) => {
    if (s.settings !== prev.settings) {
      record({ settings: prev.settings, items: useStickerStore.getState().items });
    }
  });
  useStickerStore.subscribe((s, prev) => {
    if (s.items !== prev.items) {
      record({ settings: useTicketerStore.getState().settings, items: prev.items });
    }
  });
  window.addEventListener("keydown", onKeyDown);
}
