import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Section, SegmentedField, SliderField, SwitchField } from "@/components/ticket/controls";
import { composeTicket } from "@/lib/ticket/compose";
import {
  copyFile,
  downloadFile,
  renderAllSizes,
  renderPosterFile,
  shareFile,
} from "@/lib/ticket/export";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { clamp } from "@/lib/ticket/math";
import { PRESETS } from "@/lib/ticket/presets";
import { cn } from "@/lib/utils";
import { usePhotoStore } from "@/stores/photoStore";
import { useTicketerStore } from "@/stores/ticketerStore";

type Action = "save" | "share" | "copy" | "all";

export function ExportStep() {
  const settings = useTicketerStore((s) => s.settings);
  const update = useTicketerStore((s) => s.update);
  const main = usePhotoStore((s) => s.main);
  const stub = usePhotoStore((s) => s.stub);
  const [busy, setBusy] = useState<Action | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const { preset } = composeTicket(settings, { main, stub });
  const canCopy = typeof ClipboardItem !== "undefined";

  async function run(action: Action) {
    setBusy(action);
    setStatus(null);
    try {
      // Read at click time so the export always matches what is on screen
      const { settings: current } = useTicketerStore.getState();
      const photos = usePhotoStore.getState();
      const poster = { main: photos.main, stub: photos.stub };
      const file =
        action === "all"
          ? await renderAllSizes(current, poster)
          : await renderPosterFile(current, poster, action === "copy");

      if (action === "copy") {
        await copyFile(file);
        setStatus({ ok: true, text: "Copied to clipboard" });
      } else if (action === "share" && (await shareFile(file, current.fields.title ?? "Ticket"))) {
        setStatus({ ok: true, text: `Shared ${file.filename}` });
      } else {
        downloadFile(file);
        setStatus({ ok: true, text: `Saved ${file.filename}` });
      }
    } catch (error) {
      // Closing the share sheet is not an error
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setStatus({
          ok: false,
          text: `Export failed: ${error instanceof Error ? error.message : "unknown error"}.`,
        });
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Section title="Size">
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => {
            const active = p.id === settings.presetId;
            return (
              <Card
                key={p.id}
                variant={active ? "filled" : "outlined"}
                aria-pressed={active}
                onClick={() => update({ presetId: p.id })}
                className={cn("gap-0.5 p-3", active && "ring-2 ring-primary")}
              >
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-xs text-on-surface-variant">
                  {p.w}×{p.h}
                </span>
              </Card>
            );
          })}
        </div>

        {settings.presetId === "custom" && (
          <div className="flex gap-3">
            <TextField
              variant="outlined"
              type="number"
              label="Width (px)"
              min={200}
              max={4000}
              key={`w${settings.customW}`}
              defaultValue={settings.customW}
              onBlur={(e) => update({ customW: clamp(Number(e.target.value) || 1080, 200, 4000) })}
              className="min-w-0 flex-1"
            />
            <TextField
              variant="outlined"
              type="number"
              label="Height (px)"
              min={200}
              max={4000}
              key={`h${settings.customH}`}
              defaultValue={settings.customH}
              onBlur={(e) => update({ customH: clamp(Number(e.target.value) || 1350, 200, 4000) })}
              className="min-w-0 flex-1"
            />
          </div>
        )}

        <SwitchField
          label="Auto-recompose for each size"
          checked={settings.recompose}
          onChange={(recompose) => update({ recompose })}
        />
        <SwitchField
          label="Safe-area overlay"
          checked={settings.safeOverlay}
          onChange={(safeOverlay) => update({ safeOverlay })}
        />
        {preset.bare && (
          <SwitchField
            label="Transparent background (PNG)"
            checked={settings.transparent}
            onChange={(transparent) => update({ transparent })}
          />
        )}
      </Section>

      <Section title="File">
        <SegmentedField
          label="Format"
          value={settings.format}
          options={[
            { value: "png", label: "PNG" },
            { value: "jpg", label: "JPG" },
          ]}
          onChange={(format) => update({ format })}
        />
        {settings.format === "jpg" && (
          <SliderField
            label="Quality"
            value={settings.quality}
            min={50}
            max={100}
            onChange={(quality) => update({ quality })}
          />
        )}
        <SegmentedField
          label="Side"
          value={settings.exportSide}
          options={[
            { value: "front", label: "Front" },
            { value: "back", label: "Back" },
            { value: "both", label: "Both (.zip)" },
          ]}
          onChange={(exportSide) => update({ exportSide })}
        />
        <SegmentedField
          label="Scale"
          value={String(settings.scale) as "1" | "2"}
          options={[
            { value: "1", label: "1×" },
            { value: "2", label: "2×" },
          ]}
          onChange={(scale) => update({ scale: scale === "2" ? 2 : 1 })}
        />
        <p className="text-sm text-on-surface-variant">
          {preset.w * settings.scale}×{preset.h * settings.scale}px ·{" "}
          {settings.format.toUpperCase()}
        </p>
      </Section>

      <div className="flex flex-col gap-2 p-3">
        <Button
          variant="filled"
          size="md"
          disabled={!main || busy !== null}
          onClick={() => run("save")}
        >
          {busy === "save" ? (
            <>
              <LoadingIndicator size={28} aria-label="Printing" />
              Printing…
            </>
          ) : (
            "Download poster"
          )}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="tonal"
            className="flex-1"
            disabled={!main || busy !== null}
            onClick={() => run("share")}
          >
            Share
          </Button>
          <Button
            variant="tonal"
            className="flex-1"
            disabled={!main || busy !== null || !canCopy}
            onClick={() => run("copy")}
          >
            Copy
          </Button>
        </div>

        <Button variant="outlined" disabled={!main || busy !== null} onClick={() => run("all")}>
          {busy === "all" ? "Printing every size…" : "All sizes (.zip)"}
        </Button>

        {!main && (
          <p className="rounded-xl bg-secondary-container px-4 py-3 text-sm text-on-secondary-container">
            Add a main photo first. Everything stays on your device.
          </p>
        )}
        {status && (
          <p
            role={status.ok ? "status" : "alert"}
            className={cn(
              "rounded-xl px-4 py-3 text-sm",
              status.ok
                ? "bg-primary-container text-on-primary-container"
                : "bg-error-container text-on-error-container",
            )}
          >
            <span className="flex items-center justify-between gap-3">
              <span>{status.text}</span>
              {status.ok && (
                <span
                  key={status.text}
                  aria-hidden="true"
                  className="tk-stub h-7 w-11 shrink-0 rounded-md border-[1.5px] border-dashed border-current"
                />
              )}
            </span>
          </p>
        )}
      </div>
    </>
  );
}
