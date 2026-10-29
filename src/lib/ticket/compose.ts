import type { TemplateId } from "./ids";
import { getPreset, type Preset } from "./presets";
import { layoutGroup } from "./render/layout";
import { buildTicketState, type Photos, type ViewOptions } from "./render/state";
import { TEMPLATES } from "./render/templates";
import type { Settings } from "./settings";

// Picks a better-fitting template for the size: wide canvases get the wide museum pass,
// tall ones get the tall admit stub. Templates the person chose for that size are left alone.
export function resolveTemplate(settings: Settings, preset: Preset): TemplateId {
  if (!settings.recompose || preset.bare) return settings.tpl;
  if (settings.keep[`${preset.id}:${settings.tpl}`]) return settings.tpl;

  const ratio = preset.w / preset.h;
  const [w, h] = TEMPLATES[settings.tpl].size;
  const tall = h > w;
  if (ratio > 1.25 && tall) return "museum";
  if (ratio < 0.85 && !tall) return "admit";
  return settings.tpl;
}

// The ticket state and the output size for the current settings.
// "Ticket only" is sized to the layout instead of a fixed canvas.
export function composeTicket(
  settings: Settings,
  photos: Photos,
  view: Omit<ViewOptions, "tpl"> = {},
) {
  const base = getPreset(settings.presetId, settings.customW, settings.customH);
  const tpl = resolveTemplate(settings, base);
  const state = buildTicketState(settings, photos, { ...view, tpl });
  let preset: Preset = base;

  if (base.bare) {
    const { bounds } = layoutGroup(state.tpl, state.layout, state.tilt, state.dy);
    preset = { ...base, w: Math.round(bounds.w), h: Math.round(bounds.h) };
  }

  return { state, preset, tpl };
}
