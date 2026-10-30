import { Shuffle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button, ToggleButton } from "@/components/ui/Button";
import { ColorRow } from "@/components/ticket/ColorRow";
import { Section, SegmentedField, SliderField, SwitchField } from "@/components/ticket/controls";
import { StickerSection } from "@/components/ticket/StickerSection";
import { TemplateThumb } from "@/components/ticket/TemplateThumb";
import { contrastRatio, mix } from "@/lib/ticket/color";
import { FOIL_IDS, TITLE_FONT_IDS } from "@/lib/ticket/ids";
import { photoChips } from "@/lib/ticket/palette";
import { TITLE_FONTS } from "@/lib/ticket/titleFonts";
import {
  BACKDROP_IDS,
  LAYOUT_IDS,
  STOCK_IDS,
  isAnimatedBackdrop,
  type BackdropId,
  type StockId,
} from "@/lib/ticket/ids";
import { getPreset } from "@/lib/ticket/presets";
import { buildTicketState } from "@/lib/ticket/render/state";
import { TEMPLATES, TEMPLATE_LIST } from "@/lib/ticket/render/templates";
import { cn } from "@/lib/utils";
import { usePhotoStore } from "@/stores/photoStore";
import { useStickerStore } from "@/stores/stickerStore";
import { useTicketerStore } from "@/stores/ticketerStore";
import { useViewStore } from "@/stores/viewStore";

const LAYOUT_LABELS = { single: "One ticket", twin: "Two, angled", var: "Variations" } as const;
const BACKDROP_LABELS = {
  grad: "Gradient",
  flow: "Flow ✦",
  aurora: "Aurora ✦",
  plain: "Plain",
  blur: "Blur",
} as const;
const STOCK_LABELS = {
  light: "Light",
  dark: "Dark",
  vellum: "Vellum",
  tint: "Tinted",
  kraft: "Kraft",
  navy: "Navy",
  sage: "Sage",
  rose: "Rose",
  photo: "From photo",
} as const;

const FOIL_LABELS = {
  off: "No foil",
  holo: "Holographic",
  gold: "Gold",
  silver: "Silver",
} as const;

// One tap sets paper, backdrop, grain and corners together
const LOOKS: readonly {
  label: string;
  stock: StockId;
  backdrop: BackdropId;
  grain: boolean;
  notched: boolean;
}[] = [
  { label: "Gallery", stock: "light", backdrop: "flow", grain: true, notched: false },
  { label: "Midnight", stock: "navy", backdrop: "aurora", grain: false, notched: true },
  { label: "Kraft", stock: "kraft", backdrop: "plain", grain: true, notched: false },
  { label: "Noir", stock: "dark", backdrop: "grad", grain: true, notched: true },
  { label: "Sage", stock: "sage", backdrop: "blur", grain: false, notched: false },
  { label: "Rosé", stock: "rose", backdrop: "flow", grain: true, notched: false },
];

export function StyleStep() {
  const settings = useTicketerStore((s) => s.settings);
  const update = useTicketerStore((s) => s.update);
  const updateStubArea = useTicketerStore((s) => s.updateStubArea);
  const updateMainShape = useTicketerStore((s) => s.updateMainShape);
  const setShow = useTicketerStore((s) => s.setShow);
  const dragStamp = useViewStore((s) => s.dragStamp);
  const setDragStamp = useViewStore((s) => s.setDragStamp);
  const thump = useViewStore((s) => s.thump);
  const reprint = useViewStore((s) => s.reprint);
  const main = usePhotoStore((s) => s.main);
  const stub = usePhotoStore((s) => s.stub);

  const { stubArea, mainShape } = settings;
  const stubControls = TEMPLATES[settings.tpl].stubControls;
  // The colours the ticket is actually using, including the ones taken from the photo
  const stickers = useStickerStore((s) => s.items);
  const { st } = buildTicketState(settings, { main, stub, stickers });
  const textContrast = contrastRatio(st.ink, st.paper);
  // With no second text colour the small print is the text colour, a little softer
  const ink2 = st.ink2 ?? mix(st.paper, st.ink, 0.74);
  const colourLocked =
    settings.paper !== null ||
    settings.ink !== null ||
    settings.ink2 !== null ||
    settings.accent !== null;

  return (
    <>
      <Section title="Looks" hint="Pick a look first. Your photos come next and drop right in.">
        <div className="flex flex-wrap gap-2">
          {LOOKS.map(({ label, ...look }) => (
            <ToggleButton
              key={label}
              variant="outlined"
              size="xs"
              // A look counts as picked while the four things it sets still match
              pressed={
                settings.stock === look.stock &&
                settings.backdrop === look.backdrop &&
                settings.grain === look.grain &&
                settings.notched === look.notched
              }
              onPressedChange={() => {
                update(look);
                reprint();
              }}
            >
              {label}
            </ToggleButton>
          ))}
          {/* An action, not a choice, so it stays a plain button and never looks selected */}
          <Button
            variant="text"
            size="xs"
            onClick={() => {
              const { label: _label, ...look } = LOOKS[Math.floor(Math.random() * LOOKS.length)];
              update({
                ...look,
                layout: LAYOUT_IDS[Math.floor(Math.random() * LAYOUT_IDS.length)],
              });
              reprint();
            }}
          >
            <Shuffle aria-hidden="true" />
            Surprise me
          </Button>
        </div>
      </Section>

      <Section title="Template">
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATE_LIST.map((template) => {
            const active = settings.tpl === template.id;
            return (
              <Card
                key={template.id}
                variant={active ? "filled" : "outlined"}
                aria-pressed={active}
                onClick={() =>
                  // Choosing a template by hand also stops "recompose" from swapping it for this size
                  update({
                    tpl: template.id,
                    keep: {
                      ...settings.keep,
                      [`${getPreset(settings.presetId, settings.customW, settings.customH).id}:${template.id}`]: true,
                    },
                  })
                }
                className={cn("gap-1 p-3", active && "ring-2 ring-primary")}
              >
                <div className="mb-2 grid h-28 place-items-center rounded-lg bg-surface-container-high">
                  <TemplateThumb tpl={template.id} />
                </div>
                <span className="text-sm font-medium">{template.label}</span>
                <span className="text-xs text-on-surface-variant">{template.description}</span>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section
        title="Layout"
        hint="Two, angled: the main photo leads one ticket and the stub photo leads the other. Variations: light, dark and photo-tinted side by side."
      >
        <SegmentedField
          label="Layout"
          value={settings.layout}
          options={LAYOUT_IDS.map((id) => ({ value: id, label: LAYOUT_LABELS[id] }))}
          onChange={(layout) => update({ layout })}
        />
        <SliderField
          label="Tilt"
          value={settings.tilt}
          min={-25}
          max={25}
          format={(v) => `${v}°`}
          onChange={(tilt) => update({ tilt })}
        />
        <SliderField
          label="Shadow"
          value={settings.shadow}
          min={0}
          max={100}
          onChange={(shadow) => update({ shadow })}
        />
        <SwitchField
          label="Notched corners"
          checked={settings.notched}
          onChange={(notched) => update({ notched })}
        />
      </Section>

      <Section
        title="Main photo shape"
        hint="Auto resizes the ticket to your main photo's shape, within what the template can hold."
      >
        <SwitchField
          label="Match the photo's aspect ratio"
          checked={mainShape.auto}
          onChange={(auto) => updateMainShape({ auto })}
        />
        {!mainShape.auto && (
          <SliderField
            label="Height"
            value={mainShape.h}
            min={60}
            max={180}
            format={(v) => `${v}%`}
            onChange={(h) => updateMainShape({ h })}
          />
        )}
        <SliderField
          label="Width"
          value={mainShape.w}
          min={60}
          max={100}
          format={(v) => `${v}%`}
          onChange={(w) => updateMainShape({ w })}
        />
        <SliderField
          label="Corner radius"
          value={mainShape.r}
          min={0}
          max={48}
          onChange={(r) => updateMainShape({ r })}
        />
        <SliderField
          label="Frame"
          value={mainShape.b}
          min={0}
          max={14}
          onChange={(b) => updateMainShape({ b })}
        />
        <SliderField
          label="Text shade"
          value={mainShape.s}
          min={0}
          max={150}
          format={(v) => `${v}%`}
          onChange={(s) => updateMainShape({ s })}
        />
      </Section>

      <Section
        title="Stub photo area"
        hint="Pick the shape that suits the photo. Panoramas suit a strip, portraits a square, and scenes a full stub. In Upload, “Fit whole photo” avoids cropping."
      >
        {stubControls === "styles" && (
          <SegmentedField
            label="Stub style"
            value={stubArea.layout}
            options={[
              { value: "band", label: "Strip" },
              { value: "square", label: "Square" },
              { value: "cover", label: "Full stub" },
            ]}
            onChange={(layout) => updateStubArea({ layout })}
          />
        )}
        {stubControls === "styles" && stubArea.layout === "band" && (
          <SliderField
            label="Strip height"
            value={stubArea.h}
            min={56}
            max={92}
            onChange={(h) => updateStubArea({ h })}
          />
        )}
        {stubControls === "styles" && stubArea.layout === "square" && (
          <SliderField
            label="Photo size"
            value={stubArea.sq}
            min={110}
            max={180}
            onChange={(sq) => updateStubArea({ sq })}
          />
        )}
        {stubControls === "width" && (
          <SliderField
            label="Photo width"
            value={stubArea.mw}
            min={70}
            max={260}
            onChange={(mw) => updateStubArea({ mw })}
          />
        )}
        <SliderField
          label="Corner radius"
          value={stubArea.r}
          min={0}
          max={40}
          onChange={(r) => updateStubArea({ r })}
        />
      </Section>

      <Section
        title="Title font"
        hint="The big text on the ticket: the event name, and the headings of some designs."
      >
        <div role="group" aria-label="Title font" className="flex flex-wrap gap-2">
          {TITLE_FONT_IDS.map((id) => {
            const font = TITLE_FONTS[id];
            return (
              <ToggleButton
                key={id}
                variant="outlined"
                size="sm"
                pressed={settings.titleFont === id}
                onPressedChange={() => update({ titleFont: id })}
                // Each one is shown in its own font, so the choice is visible before it is made
                style={{ fontFamily: font.family, fontWeight: font.weight }}
              >
                {font.label}
              </ToggleButton>
            );
          })}
        </div>
      </Section>

      <Section title="Paper">
        <div className="flex flex-wrap gap-2">
          {STOCK_IDS.map((id) => (
            <ToggleButton
              key={id}
              variant="outlined"
              size="xs"
              pressed={settings.stock === id}
              onPressedChange={() => update({ stock: id })}
            >
              {STOCK_LABELS[id]}
            </ToggleButton>
          ))}
        </div>
        <SwitchField
          label="Paper grain"
          checked={settings.grain}
          onChange={(grain) => update({ grain })}
        />
        <SwitchField
          label="Admit One stamp"
          checked={Boolean(settings.show.stamp)}
          onChange={(on) => {
            setShow("stamp", on);
            thump();
          }}
        />
        <div className="flex flex-wrap gap-2">
          <ToggleButton
            variant="outlined"
            size="xs"
            pressed={dragStamp}
            onPressedChange={setDragStamp}
          >
            Drag stamp on ticket
          </ToggleButton>
          <Button
            variant="tonal"
            size="xs"
            disabled={!settings.stampPos}
            onClick={() => {
              update({ stampPos: null });
              thump();
            }}
          >
            Reset stamp
          </Button>
        </div>
        {dragStamp && settings.layout !== "single" && (
          <p className="text-sm text-on-surface-variant">
            Dragging works with the One ticket layout, front side.
          </p>
        )}
      </Section>

      <Section
        title="Foil"
        hint="Holographic or metallic shine over the paper. The printing stays readable. Tilt the preview to move the shine."
      >
        <div role="group" aria-label="Foil" className="flex flex-wrap gap-2">
          {FOIL_IDS.map((id) => (
            <ToggleButton
              key={id}
              variant="outlined"
              size="xs"
              pressed={settings.foil === id}
              onPressedChange={() => update({ foil: id })}
            >
              {FOIL_LABELS[id]}
            </ToggleButton>
          ))}
        </div>
        {settings.foil !== "off" && (
          <>
            <SliderField
              label="Strength"
              value={settings.foilStrength}
              min={10}
              max={100}
              format={(v) => `${v}%`}
              onChange={(foilStrength) => update({ foilStrength })}
            />
            <SliderField
              label="Angle of the bands"
              value={settings.foilAngle}
              min={0}
              max={360}
              format={(v) => `${v}°`}
              onChange={(foilAngle) => update({ foilAngle })}
            />
          </>
        )}
      </Section>

      <StickerSection />

      <Section
        title="Colours"
        hint="Auto takes colours from your photos: the main photo for the ticket and accent, the stub photo for the second text colour. Pick a colour to lock it. Shuffle only changes the ones that are still on Auto."
        action={
          <div className="flex items-center gap-1">
            <Button
              variant="text"
              size="xs"
              // Shuffling needs the paper that follows the photos, so it switches to that
              onClick={() => update({ shuffle: settings.shuffle + 1, stock: "photo" })}
            >
              <Shuffle aria-hidden="true" />
              Shuffle
            </Button>
            <Button
              variant="text"
              size="xs"
              disabled={!colourLocked && settings.shuffle === 0}
              onClick={() =>
                update({ paper: null, ink: null, ink2: null, accent: null, shuffle: 0 })
              }
            >
              <Sparkles aria-hidden="true" />
              All auto
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-0.5">
          <ColorRow
            label="Ticket colour"
            value={st.paper}
            manual={settings.paper !== null}
            tile={{ fill: st.paper, text: st.ink }}
            contrast={textContrast}
            against="the text colour"
            lowMessage="Text may be hard to read on this ticket colour."
            onChange={(paper) => update({ paper })}
            onAuto={() => update({ paper: null })}
            chips={photoChips("paper", main, stub)}
          />
          <ColorRow
            label="Text colour"
            value={st.ink}
            manual={settings.ink !== null}
            tile={{ fill: st.paper, text: st.ink }}
            contrast={textContrast}
            against="the ticket colour"
            onChange={(ink) => update({ ink })}
            onAuto={() => update({ ink: null })}
            chips={photoChips("ink", main, stub)}
          />
          <ColorRow
            label="Second text colour"
            value={ink2}
            manual={settings.ink2 !== null}
            tile={{ fill: st.paper, text: ink2 }}
            contrast={contrastRatio(ink2, st.paper)}
            against="the ticket colour"
            lowMessage="Labels and small print may be hard to read."
            onChange={(next) => update({ ink2: next })}
            onAuto={() => update({ ink2: null })}
            chips={photoChips("ink2", main, stub)}
          />
          <ColorRow
            label="Accent"
            value={st.acc}
            manual={settings.accent !== null}
            tile={{ fill: st.acc, text: st.onacc }}
            contrast={contrastRatio(st.onacc, st.acc)}
            minContrast={3}
            against="the text on it"
            lowMessage="Labels on accent badges may be hard to read."
            onChange={(accent) => update({ accent })}
            onAuto={() => update({ accent: null })}
            chips={photoChips("accent", main, stub)}
          />
        </div>
      </Section>

      <Section title="Backdrop">
        <SegmentedField
          label="Backdrop"
          value={settings.backdrop}
          options={BACKDROP_IDS.map((id) => ({ value: id, label: BACKDROP_LABELS[id] }))}
          onChange={(backdrop) => update({ backdrop })}
        />
        {isAnimatedBackdrop(settings.backdrop) && (
          <>
            <SliderField
              label="Speed"
              value={settings.speed}
              min={0.2}
              max={3}
              step={0.1}
              format={(v) => `${v.toFixed(1)}×`}
              onChange={(speed) => update({ speed })}
            />
            <SwitchField
              label="Pause animation"
              checked={settings.paused}
              onChange={(paused) => update({ paused })}
            />
            <p className="text-sm text-on-surface-variant">
              Animated in the app. Exports capture the frame you see.
            </p>
          </>
        )}
      </Section>
    </>
  );
}
