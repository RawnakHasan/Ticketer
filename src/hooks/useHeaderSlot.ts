import { useOutletContext } from "react-router";

export type HeaderSlotContext = { headerSlot: HTMLElement | null };

// The element in the layout header that a page can portal its own controls into
export function useHeaderSlot() {
  return useOutletContext<HeaderSlotContext>().headerSlot;
}
