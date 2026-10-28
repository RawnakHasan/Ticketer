import { useEffect, useState } from "react";

import { TICKET_FONTS } from "@/lib/ticket/render/shared";

// Canvas text is drawn once, so the ticket fonts have to be loaded before the first draw
export function useFontsReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(TICKET_FONTS.map((font) => document.fonts.load(font)))
      .catch(() => {})
      .then(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
