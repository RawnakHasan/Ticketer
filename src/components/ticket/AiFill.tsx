import { Sparkles } from "lucide-react";
import { useState } from "react";

import { SegmentedField } from "@/components/ticket/controls";
import { Button } from "@/components/ui/Button";
import { TextArea, TextField } from "@/components/ui/TextField";
import {
  AI_PROVIDERS,
  AI_PROVIDER_IDS,
  AI_QUESTIONS,
  AiError,
  EMPTY_ANSWERS,
  buildPrompt,
  callAi,
  parseAiAnswer,
  photoToBase64,
  type AiMode,
} from "@/lib/ticket/ai";
import { useAiStore } from "@/stores/aiStore";
import { usePhotoStore } from "@/stores/photoStore";
import { useTicketerStore } from "@/stores/ticketerStore";

const KEY_HINTS = { claude: "sk-ant-…", gemini: "AIza…", openrouter: "sk-or-…" } as const;

// Writes the ticket text from a photo or a few answers, with a copy-and-paste way in for people without a key
export function AiFill() {
  const tpl = useTicketerStore((s) => s.settings.tpl);
  const setFields = useTicketerStore((s) => s.setFields);
  const main = usePhotoStore((s) => s.main);
  const { provider, keys, models, setProvider, setKey, setModel } = useAiStore();

  const [asking, setAsking] = useState(false);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [busy, setBusy] = useState<AiMode | null>(null);
  const [prompt, setPrompt] = useState("");
  const [paste, setPaste] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const info = AI_PROVIDERS[provider];
  const key = keys[provider] ?? "";

  function apply(raw: string) {
    const fields = parseAiAnswer(raw, tpl);
    setFields(fields);
    return Object.keys(fields).length;
  }

  async function run(mode: "photo" | "questions") {
    setBusy(mode);
    setStatus(null);
    try {
      if (!key.trim()) {
        throw new Error(
          provider === "claude"
            ? "Paste an Anthropic API key first, or use the copy-and-paste option below."
            : `Paste your free key first. You can get one at ${info.keyUrl}.`,
        );
      }
      const image = mode === "photo" && main ? photoToBase64(main) : undefined;
      const reply = await callAi(
        { provider, key, model: models[provider] ?? "" },
        buildPrompt(mode, answers, tpl),
        image,
      );
      const count = apply(reply);
      setStatus({
        ok: true,
        text: `Filled ${count} fields. Check them over and edit anything you like.`,
      });
    } catch (error) {
      const text =
        error instanceof AiError
          ? error.message +
            (error.status === 400 || error.status === 404
              ? " Check the model name under Model."
              : "") +
            (mode === "photo" && provider === "openrouter" ? " The model must accept images." : "")
          : error instanceof TypeError
            ? "Could not reach the AI. Check your connection and key."
            : error instanceof Error
              ? error.message
              : "Something went wrong.";
      setStatus({ ok: false, text });
    } finally {
      setBusy(null);
    }
  }

  async function copyPrompt() {
    const text = buildPrompt("copy", answers, tpl);
    setPrompt(text);
    try {
      await navigator.clipboard.writeText(text);
      setStatus({
        ok: true,
        text: "Prompt copied. Paste it into any AI chat (attach your photo if you like), then paste its answer below.",
      });
    } catch {
      setStatus({
        ok: true,
        text: "Select the prompt below and copy it, then paste it into any AI chat.",
      });
    }
  }

  function applyPasted() {
    try {
      const count = apply(paste);
      setStatus({
        ok: true,
        text: `Filled ${count} fields from the pasted answer. Check them over.`,
      });
    } catch (error) {
      setStatus({
        ok: false,
        text: error instanceof Error ? error.message : "Could not read that.",
      });
    }
  }

  return (
    <details className="group/ai rounded-2xl border border-outline-variant">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-medium text-on-surface [&::-webkit-details-marker]:hidden">
        <Sparkles aria-hidden="true" className="size-5 text-primary" />
        Fill with AI
      </summary>

      <div className="flex flex-col gap-4 px-4 pb-4">
        <p className="text-sm text-on-surface-variant">
          Writes the ticket text for you. Always check it before you export.
        </p>

        <SegmentedField
          label="AI provider"
          value={provider}
          options={AI_PROVIDER_IDS.map((id) => ({ value: id, label: AI_PROVIDERS[id].name }))}
          onChange={setProvider}
        />

        <TextField
          variant="outlined"
          type="password"
          autoComplete="off"
          label={provider === "claude" ? "Anthropic API key" : "Free API key"}
          placeholder={KEY_HINTS[provider]}
          value={key}
          onChange={(event) => setKey(provider, event.target.value)}
          supportingText={
            provider === "claude"
              ? `Needs a paid key from ${info.keyUrl}. Saved only in this browser.`
              : `Get one free at ${info.keyUrl}. Saved only in this browser. Free tiers may use what you send to improve their products, so skip the photo option for private pictures.`
          }
        />

        <details>
          <summary className="cursor-pointer text-sm font-medium text-primary">Model</summary>
          <div className="mt-2">
            <TextField
              variant="outlined"
              label="Model name"
              placeholder={info.model}
              value={models[provider] ?? ""}
              onChange={(event) => setModel(provider, event.target.value)}
              supportingText={
                provider === "openrouter"
                  ? "Photo reading needs a model that accepts images. Browse openrouter.ai/models and filter for free."
                  : "Change this if the provider renames its model."
              }
            />
          </div>
        </details>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="filled"
            size="xs"
            disabled={!main || busy !== null}
            onClick={() => run("photo")}
          >
            {busy === "photo" ? "Reading photo…" : "From my photo"}
          </Button>
          <Button variant="tonal" size="xs" onClick={() => setAsking((open) => !open)}>
            Answer a few questions
          </Button>
        </div>
        {!main && <p className="text-sm text-on-surface-variant">Add a main photo to read it.</p>}

        {asking && (
          <div className="flex flex-col gap-3">
            {AI_QUESTIONS.map(({ key: id, label, placeholder }) => (
              <TextField
                key={id}
                variant="outlined"
                label={label}
                placeholder={placeholder}
                value={answers[id]}
                onChange={(event) => setAnswers((a) => ({ ...a, [id]: event.target.value }))}
              />
            ))}
            <Button
              variant="filled"
              size="xs"
              className="self-start"
              disabled={busy !== null}
              onClick={() => run("questions")}
            >
              {busy === "questions" ? "Writing…" : "Write my ticket"}
            </Button>
          </div>
        )}

        {status && (
          <p
            role={status.ok ? "status" : "alert"}
            className={
              status.ok
                ? "rounded-xl bg-primary-container px-4 py-3 text-sm text-on-primary-container"
                : "rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container"
            }
          >
            {status.text}
          </p>
        )}

        <details>
          <summary className="cursor-pointer text-sm font-medium text-primary">
            No key? Use any AI chat
          </summary>
          <div className="mt-2 flex flex-col gap-3">
            <p className="text-sm text-on-surface-variant">
              Copy the prompt, paste it into any AI (attach your photo if you want it read), then
              paste the answer back here. It uses your answers above if you filled them in.
            </p>
            <Button variant="tonal" size="xs" className="self-start" onClick={copyPrompt}>
              Copy prompt
            </Button>
            {prompt && (
              <TextArea
                variant="outlined"
                label="Prompt to copy"
                readOnly
                rows={4}
                value={prompt}
                onFocus={(event) => event.target.select()}
              />
            )}
            <TextArea
              variant="outlined"
              label="Paste the answer here"
              rows={4}
              placeholder={'{"title": "…", "sub": "…"}'}
              value={paste}
              onChange={(event) => setPaste(event.target.value)}
            />
            <Button
              variant="filled"
              size="xs"
              className="self-start"
              disabled={!paste.trim()}
              onClick={applyPasted}
            >
              Use this answer
            </Button>
          </div>
        </details>
      </div>
    </details>
  );
}
