import { getPreset, type Preset } from "./presets";
import { layoutGroup } from "./render/layout";
import { buildTicketState, type Photos } from "./render/state";
import type { Settings } from "./settings";

// The ticket state and the output size for the current settings.
// "Ticket only" is sized to the layout instead of a fixed canvas.
export function composeTicket(settings: Settings, photos: Photos) {
  const state = buildTicketState(settings, photos);
  const base = getPreset(settings.presetId, settings.customW, settings.customH);
  let preset: Preset = base;

  if (base.bare) {
    const { bounds } = layoutGroup(state.tpl, state.layout, state.tilt, state.dy);
    preset = { ...base, w: Math.round(bounds.w), h: Math.round(bounds.h) };
  }

  return { state, preset };
}
