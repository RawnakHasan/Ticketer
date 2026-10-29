import { FIELDS, type FieldKey } from "./fields";
import type { TemplateId } from "./ids";
import type { Photo } from "./types";

export const AI_PROVIDERS = {
  claude: { name: "Claude", model: "claude-sonnet-5-5", keyUrl: "console.anthropic.com" },
  gemini: {
    name: "Gemini",
    model: "gemini-flash-latest",
    keyUrl: "aistudio.google.com/app/apikey",
  },
  openrouter: {
    name: "OpenRouter",
    model: "openrouter/free",
    keyUrl: "openrouter.ai/keys",
  },
} as const;

export type AiProvider = keyof typeof AI_PROVIDERS;
export const AI_PROVIDER_IDS = Object.keys(AI_PROVIDERS) as AiProvider[];

export type AiMode = "photo" | "questions" | "copy";

export const AI_QUESTIONS = [
  { key: "what", label: "What is it for?", placeholder: "a gig, a road trip, a birthday" },
  { key: "who", label: "Who is it for?", placeholder: "a name, or my friends" },
  { key: "where", label: "Where and when?", placeholder: "a place, a date, a time" },
  { key: "mood", label: "What is the mood?", placeholder: "cosy, loud, nostalgic" },
] as const;

export type AiAnswers = Record<(typeof AI_QUESTIONS)[number]["key"], string>;
export const EMPTY_ANSWERS: AiAnswers = { what: "", who: "", where: "", mood: "" };

const SYSTEM =
  "You write short, evocative copy for tickets. Reply with a single JSON object and nothing else: no preamble and no Markdown.";

// What each field should look like, so the answer fits on the ticket
const FIELD_HINTS: Partial<Record<FieldKey, string>> = {
  title: "event title, max 26 characters",
  sub: "subtitle, max 38 characters",
  name: "a person name, max 22 characters",
  date: "date like 14 NOV 2026",
  time: "24-hour time like 19:30",
  place: "venue, city, max 34 characters",
  tier: "short tier label, max 14 characters",
  price: "price or short label, max 8 characters",
  fine: "one line of fine print, max 60 characters",
  cap: "short handwritten caption in lowercase, max 38 characters",
  handle: "a hashtag or @handle, max 20 characters",
  from: "3-letter code, a middle dot, then a city",
  to: "3-letter code, a middle dot, then a city",
  x1: "Label: value, max 16 characters",
  x2: "Label: value, max 16 characters",
  x3: "Label: value, max 16 characters",
  lines: "two short lines separated by |, each max 26 characters",
  dur: "track length like 3:47",
};

// The fields the AI may fill for this template
export const aiFieldKeys = (tpl: TemplateId): FieldKey[] =>
  FIELDS.filter((f) => FIELD_HINTS[f.key] && (!("only" in f) || f.only === tpl)).map((f) => f.key);

export function buildPrompt(mode: AiMode, answers: AiAnswers, tpl: TemplateId) {
  const spec = aiFieldKeys(tpl)
    .map((key) => `"${key}": ${FIELD_HINTS[key]}`)
    .join("\n");
  const hasAnswers = AI_QUESTIONS.some(({ key }) => answers[key].trim());

  let source: string;
  if (mode === "photo") {
    source =
      "Base the text on what the attached photo shows: the setting, mood, colours and any visible text. Do not name real people.";
  } else if (hasAnswers) {
    const lines = AI_QUESTIONS.map(
      ({ key, label }) => `${label} ${answers[key].trim() || "(blank)"}`,
    ).join("\n");
    source = `Base the text on these answers, and invent plausible details only for anything left blank:\n${lines}${
      mode === "copy" ? "\nIf I attached a photo, use it too." : ""
    }`;
  } else if (mode === "copy") {
    source = "Base the text on the photo I attached to this message. Do not name real people.";
  } else {
    source = "No details were given, so invent a plausible, charming event.";
  }

  return `Write the text for a keepsake ticket. Today is ${new Date().toDateString()}. ${source}\nReturn only a JSON object with exactly these keys:\n${spec}`;
}

// Pulls the JSON object out of an AI reply and keeps only the fields this template has
export function parseAiAnswer(raw: string, tpl: TemplateId) {
  const match = String(raw).match(/\{[\s\S]*\}/);
  let json: Record<string, unknown> | null = null;
  try {
    json = match ? (JSON.parse(match[0]) as Record<string, unknown>) : null;
  } catch {
    json = null;
  }
  if (!json) throw new Error("That does not look like the JSON answer. Paste the whole reply.");

  const out: Partial<Record<FieldKey, string>> = {};
  for (const key of aiFieldKeys(tpl)) {
    const value = json[key];
    if (typeof value === "string" && value.trim()) out[key] = value.trim().slice(0, 80);
  }
  if (Object.keys(out).length === 0) throw new Error("The answer had no matching fields.");
  return out;
}

// A small JPEG of the photo, as base64, for the providers that read images
export function photoToBase64(photo: Photo) {
  const k = Math.min(1, 768 / Math.max(photo.w, photo.h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(photo.w * k);
  canvas.height = Math.round(photo.h * k);
  canvas.getContext("2d")!.drawImage(photo.bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
}

export class AiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

type Config = { provider: AiProvider; key: string; model: string };

async function post(url: string, headers: Record<string, string>, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.error?.message ?? data?.error;
    throw new AiError(
      typeof detail === "string" ? detail : `The AI request failed (${response.status}).`,
      response.status,
    );
  }
  return data;
}

// One request to the chosen provider. The key stays in the browser and is sent only to that provider.
export async function callAi({ provider, key, model }: Config, text: string, image?: string) {
  const name = model.trim() || AI_PROVIDERS[provider].model;
  const apiKey = key.trim();

  if (provider === "claude") {
    const data = await post(
      "https://api.anthropic.com/v1/messages",
      {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      {
        model: name,
        max_tokens: 1000,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: image
              ? [
                  {
                    type: "image",
                    source: { type: "base64", media_type: "image/jpeg", data: image },
                  },
                  { type: "text", text },
                ]
              : text,
          },
        ],
      },
    );
    return (data.content ?? []).map((part: { text?: string }) => part.text ?? "").join("");
  }

  if (provider === "gemini") {
    const data = await post(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(name)}:generateContent`,
      { "x-goog-api-key": apiKey },
      {
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [
          {
            role: "user",
            parts: [
              ...(image ? [{ inline_data: { mime_type: "image/jpeg", data: image } }] : []),
              { text },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      },
    );
    return (data.candidates?.[0]?.content?.parts ?? [])
      .map((part: { text?: string }) => part.text ?? "")
      .join("");
  }

  const data = await post(
    "https://openrouter.ai/api/v1/chat/completions",
    { Authorization: `Bearer ${apiKey}` },
    {
      model: name,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: image
            ? [
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
                { type: "text", text },
              ]
            : text,
        },
      ],
    },
  );
  return data.choices?.[0]?.message?.content ?? "";
}
