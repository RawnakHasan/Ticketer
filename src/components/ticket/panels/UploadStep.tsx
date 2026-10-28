import { Button } from "@/components/ui/Button";
import { Section, SegmentedField, SliderField, SwitchField } from "@/components/ticket/controls";
import { PhotoSlot } from "@/components/ticket/PhotoSlot";
import { FX_IDS } from "@/lib/ticket/ids";
import { mainFrame } from "@/lib/ticket/render/frame";
import { photoFilter } from "@/lib/ticket/render/state";
import { TEMPLATES } from "@/lib/ticket/render/templates";
import { DEFAULT_ADJUST } from "@/lib/ticket/settings";
import { usePhotoStore } from "@/stores/photoStore";
import { useTicketerStore } from "@/stores/ticketerStore";

const FX_LABELS = {
  none: "Original",
  warm: "Warm",
  cool: "Cool",
  film: "Film",
  noir: "Noir",
} as const;

export function UploadStep() {
  const settings = useTicketerStore((s) => s.settings);
  const updateAdjust = useTicketerStore((s) => s.updateAdjust);
  const main = usePhotoStore((s) => s.main);
  const stub = usePhotoStore((s) => s.stub);
  const error = usePhotoStore((s) => s.error);
  const swap = usePhotoStore((s) => s.swap);
  const copyMainToStub = usePhotoStore((s) => s.copyMainToStub);
  const dismissError = usePhotoStore((s) => s.dismissError);

  const template = TEMPLATES[settings.tpl];
  const [frameW, frameH] = mainFrame(
    template.photoBox,
    settings.mainShape,
    main,
    settings.stubArea.mw,
  );
  const { adjust } = settings;
  const filter = photoFilter(adjust);

  return (
    <>
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-xl bg-error-container py-2 ps-4 pe-2 text-sm text-on-error-container"
        >
          <span>{error}</span>
          <Button variant="text" size="xs" onClick={dismissError}>
            Dismiss
          </Button>
        </div>
      )}

      <PhotoSlot slot="main" label="Main photo" ratio={frameW / frameH} filter={filter} />
      <PhotoSlot
        slot="stub"
        label="Stub photo"
        ratio={template.stubRatio(settings.stubArea)}
        filter={filter}
        hint="uses main until added"
      />

      <div className="flex gap-2">
        <Button variant="tonal" className="flex-1" disabled={!main && !stub} onClick={swap}>
          Swap photos
        </Button>
        <Button variant="tonal" className="flex-1" disabled={!main} onClick={copyMainToStub}>
          Same photo for both
        </Button>
      </div>

      <Section title="Light adjustments">
        <SliderField
          label="Brightness"
          value={adjust.brightness}
          min={60}
          max={140}
          onChange={(brightness) => updateAdjust({ brightness })}
        />
        <SliderField
          label="Contrast"
          value={adjust.contrast}
          min={60}
          max={140}
          onChange={(contrast) => updateAdjust({ contrast })}
        />
        <SegmentedField
          label="Look"
          value={adjust.fx}
          options={FX_IDS.map((id) => ({ value: id, label: FX_LABELS[id] }))}
          onChange={(fx) => updateAdjust({ fx })}
        />
        <SwitchField
          label="Black and white"
          checked={adjust.grayscale}
          onChange={(grayscale) => updateAdjust({ grayscale })}
        />
        <Button variant="text" className="self-start" onClick={() => updateAdjust(DEFAULT_ADJUST)}>
          Reset adjustments
        </Button>
      </Section>
    </>
  );
}
