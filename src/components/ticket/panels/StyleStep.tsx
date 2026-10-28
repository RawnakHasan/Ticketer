import { Card } from "@/components/ui/Card";
import { ToggleButton } from "@/components/ui/Button";
import { ColorRow } from "@/components/ticket/ColorRow";
import { Section, SegmentedField, SliderField, SwitchField } from "@/components/ticket/controls";
import { TemplateThumb } from "@/components/ticket/TemplateThumb";
import { contrastRatio } from "@/lib/ticket/color";
import { BACKDROP_IDS, LAYOUT_IDS, STOCK_IDS } from "@/lib/ticket/ids";
import { buildTicketState } from "@/lib/ticket/render/state";
import { TEMPLATE_LIST } from "@/lib/ticket/render/templates";
import { cn } from "@/lib/utils";
import { usePhotoStore } from "@/stores/photoStore";
import { useTicketerStore } from "@/stores/ticketerStore";

const LAYOUT_LABELS = { single: "One ticket", twin: "Two, angled", var: "Variations" } as const;
const BACKDROP_LABELS = { grad: "Gradient", plain: "Plain", blur: "Blurred photo" } as const;
const STOCK_LABELS = {
  light: "Light",
  dark: "Dark",
  vellum: "Vellum",
  tint: "Tinted",
  kraft: "Kraft",
  navy: "Navy",
  sage: "Sage",
  rose: "Rose",
} as const;

export function StyleStep() {
  const settings = useTicketerStore((s) => s.settings);
  const update = useTicketerStore((s) => s.update);
  const updateStubArea = useTicketerStore((s) => s.updateStubArea);
  const updateMainShape = useTicketerStore((s) => s.updateMainShape);
  const setShow = useTicketerStore((s) => s.setShow);
  const main = usePhotoStore((s) => s.main);
  const stub = usePhotoStore((s) => s.stub);

  const { stubArea, mainShape } = settings;
  // The colours the ticket is actually using, including the ones taken from the photo
  const { st } = buildTicketState(settings, { main, stub });
  const textContrast = contrastRatio(st.ink, st.paper);

  return (
    <>
      <Section title="Template">
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATE_LIST.map((template) => {
            const active = settings.tpl === template.id;
            return (
              <Card
                key={template.id}
                variant={active ? "filled" : "outlined"}
                aria-pressed={active}
                onClick={() => update({ tpl: template.id })}
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
        hint="Panoramas suit a strip, portraits a square, scenes a full stub. In Upload, “Fit whole photo” avoids cropping."
      >
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
        {stubArea.layout === "band" && (
          <SliderField
            label="Strip height"
            value={stubArea.h}
            min={56}
            max={92}
            onChange={(h) => updateStubArea({ h })}
          />
        )}
        {stubArea.layout === "square" && (
          <SliderField
            label="Photo size"
            value={stubArea.sq}
            min={110}
            max={180}
            onChange={(sq) => updateStubArea({ sq })}
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
          onChange={(on) => setShow("stamp", on)}
        />
      </Section>

      <Section
        title="Colours"
        hint="Automatic follows your photo and paper. Pick a colour to override it."
      >
        <div className="flex flex-col gap-0.5">
          <ColorRow
            label="Text colour"
            value={st.ink}
            manual={settings.ink !== null}
            tile={{ fill: st.paper, text: st.ink }}
            contrast={textContrast}
            onChange={(ink) => update({ ink })}
            onAuto={() => update({ ink: null })}
          />
          <ColorRow
            label="Accent"
            value={st.acc}
            manual={settings.accent !== null}
            tile={{ fill: st.acc, text: st.onacc }}
            onChange={(accent) => update({ accent })}
            onAuto={() => update({ accent: null })}
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
      </Section>
    </>
  );
}
