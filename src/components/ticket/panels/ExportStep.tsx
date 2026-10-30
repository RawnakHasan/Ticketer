import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/Button/variant";
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
import { renderPrintSheet, type SheetOptions } from "@/lib/ticket/printSheet";
import { openProject, saveProject } from "@/lib/ticket/project";
import { shareUrl } from "@/lib/ticket/share";
import { PRESETS } from "@/lib/ticket/presets";
import { cn } from "@/lib/utils";
import { usePhotoStore } from "@/stores/photoStore";
import { useStickerStore } from "@/stores/stickerStore";
import { useTicketerStore } from "@/stores/ticketerStore";

type Action = "save" | "share" | "copy" | "all";

export function ExportStep() {
  const settings = useTicketerStore((s) => s.settings);
  const update = useTicketerStore((s) => s.update);
  const main = usePhotoStore((s) => s.main);
  const stub = usePhotoStore((s) => s.stub);
  const [busy, setBusy] = useState<Action | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  // Print sheet options. They only matter for the sheet, so they are not saved with the ticket.
  const [sheet, setSheet] = useState<SheetOptions>({
    paper: "a4",
    ticketWidthMm: 70,
    copies: 6,
    cropMarks: true,
  });
  const [printing, setPrinting] = useState(false);

  const { preset } = composeTicket(settings, { main, stub });
  const canCopy = typeof ClipboardItem !== "undefined";

  async function run(action: Action) {
    setBusy(action);
    setStatus(null);
    try {
      // Read at click time so the export always matches what is on screen
      const { settings: current } = useTicketerStore.getState();
      const photos = usePhotoStore.getState();
      // No selected sticker here, so the dashed outline never reaches an export
      const poster = {
        main: photos.main,
        stub: photos.stub,
        stickers: useStickerStore.getState().items,
      };
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

      <Section
        title="Share this style"
        hint="Copies a link to this ticket's look and text. Photos and stickers are not in it, whoever opens it adds their own."
      >
        <div>
          <Button
            variant="tonal"
            size="xs"
            onClick={async () => {
              try {
                const { settings: current } = useTicketerStore.getState();
                await navigator.clipboard.writeText(await shareUrl(current));
                setStatus({ ok: true, text: "Link copied." });
              } catch {
                setStatus({ ok: false, text: "The link could not be copied." });
              }
            }}
          >
            Copy link
          </Button>
        </div>
      </Section>

      <Section
        title="Print sheet"
        hint="Tickets at their real size on A4 or Letter, with crop marks to cut along. Uses the Side setting above: with both, the pages alternate front and back so double-sided printing (flip on the long edge) lines them up."
      >
        <SegmentedField
          label="Paper"
          value={sheet.paper}
          options={[
            { value: "a4", label: "A4" },
            { value: "letter", label: "Letter" },
          ]}
          onChange={(paper) => setSheet((s) => ({ ...s, paper }))}
        />
        <SliderField
          label="Ticket width"
          value={sheet.ticketWidthMm}
          min={40}
          max={150}
          format={(v) => `${v} mm`}
          onChange={(ticketWidthMm) => setSheet((s) => ({ ...s, ticketWidthMm }))}
        />
        <SliderField
          label="Copies"
          value={sheet.copies}
          min={1}
          max={48}
          onChange={(copies) => setSheet((s) => ({ ...s, copies }))}
        />
        <SwitchField
          label="Crop marks"
          checked={sheet.cropMarks}
          onChange={(cropMarks) => setSheet((s) => ({ ...s, cropMarks }))}
        />
        <div>
          <Button
            variant="tonal"
            size="xs"
            disabled={!main || printing}
            onClick={async () => {
              setPrinting(true);
              setStatus(null);
              try {
                const { settings: current } = useTicketerStore.getState();
                const photos = usePhotoStore.getState();
                const file = await renderPrintSheet(
                  current,
                  {
                    main: photos.main,
                    stub: photos.stub,
                    stickers: useStickerStore.getState().items,
                  },
                  sheet,
                );
                downloadFile(file);
                setStatus({ ok: true, text: "Print sheet ready." });
              } catch (error) {
                setStatus({
                  ok: false,
                  text:
                    error instanceof Error ? error.message : "The print sheet could not be made.",
                });
              } finally {
                setPrinting(false);
              }
            }}
          >
            {printing ? "Making the sheet…" : "Download print sheet (PDF)"}
          </Button>
        </div>
      </Section>

      <Section
        title="Project"
        hint="Save the whole ticket (settings, photos and stickers) as one file to come back to later, or open one you saved."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="tonal"
            size="xs"
            onClick={async () => {
              try {
                const file = await saveProject();
                downloadFile({ ...file, type: "application/zip" });
                setStatus({ ok: true, text: `Saved ${file.filename}.` });
              } catch {
                setStatus({ ok: false, text: "The project could not be saved." });
              }
            }}
          >
            Save project
          </Button>
          <label
            className={cn(
              buttonVariants({ variant: "tonal", size: "xs" }),
              "cursor-pointer",
              "has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-secondary",
            )}
          >
            Open project
            <input
              type="file"
              accept=".ticketer,application/zip"
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                const hasWork = main !== null || useStickerStore.getState().items.length > 0;
                if (
                  hasWork &&
                  !window.confirm(
                    "Opening a project replaces the ticket you are working on. Continue?",
                  )
                ) {
                  return;
                }
                try {
                  await openProject(file);
                  setStatus({ ok: true, text: "Project opened." });
                } catch (error) {
                  setStatus({
                    ok: false,
                    text:
                      error instanceof Error ? error.message : "That project could not be opened.",
                  });
                }
              }}
            />
          </label>
        </div>
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
