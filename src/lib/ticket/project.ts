import { z } from "zod";

import { usePhotoStore } from "@/stores/photoStore";
import { useStickerStore } from "@/stores/stickerStore";
import { useTicketerStore } from "@/stores/ticketerStore";
import { materialShapeNames } from "../shapes/materialShapes";
import { loadPhoto } from "./photo";
import { settingsSchema, type Settings } from "./settings";
import type { Sticker } from "./sticker";
import type { Photo } from "./types";

// A whole ticket in one file: the settings, the photos and the stickers. It is a zip, so the
// pictures stay the ordinary image files they were. Anyone can open it in an archive tool.

const FORMAT_VERSION = 1;
// What a person's own project could plausibly need. Anything bigger is not one of ours.
const MAX_FILE_BYTES = 150 * 1024 * 1024;
const MAX_ENTRIES = 40;

const finite = z.number().refine(Number.isFinite);
const cropSchema = z.object({
  file: z.string().max(120),
  z: finite.pipe(z.number().min(0.1).max(10)),
  x: finite.pipe(z.number().min(-10).max(10)),
  y: finite.pipe(z.number().min(-10).max(10)),
  // Quarter turns. The rotate button just keeps counting up, so this is not limited to 0 to 3.
  rot: z.number().int().min(-1000).max(1000),
});

const stickerSchema = z.object({
  shape: z
    .string()
    .refine((name) => name === "cutout" || materialShapeNames.includes(name as never)),
  hasAlpha: z.boolean(),
  x: finite.pipe(z.number().min(-0.5).max(1.5)),
  y: finite.pipe(z.number().min(-0.5).max(1.5)),
  size: finite.pipe(z.number().min(0.02).max(1.5)),
  rot: finite.pipe(z.number().min(-360).max(360)),
  border: z.boolean(),
  flip: z.boolean(),
  side: z.enum(["front", "back", "both"]),
  art: z
    .object({
      id: z.string().max(40),
      color: z.tuple([
        z.number().min(0).max(255),
        z.number().min(0).max(255),
        z.number().min(0).max(255),
      ]),
    })
    .nullable(),
  photo: cropSchema,
});

const projectSchema = z.object({
  app: z.literal("ticketer"),
  version: z.number().int().max(FORMAT_VERSION),
  settings: z.unknown(),
  main: cropSchema.nullable(),
  stub: cropSchema.nullable(),
  stickers: z.array(stickerSchema).max(40),
});

const extensionOf = (type: string) =>
  type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "ticket";

// JSZip is only needed here, so it loads when a project is saved or opened
async function newZip() {
  const { default: JSZip } = await import("jszip");
  return new JSZip();
}

export async function saveProject(): Promise<{ blob: Blob; filename: string }> {
  const settings = useTicketerStore.getState().settings;
  const { main, stub } = usePhotoStore.getState();
  const { items } = useStickerStore.getState();

  const zip = await newZip();
  let count = 0;
  const addImage = (photo: Photo) => {
    const file = `images/${count++}.${extensionOf(photo.src.type)}`;
    zip.file(file, photo.src);
    return {
      file,
      z: photo.z,
      x: photo.x,
      y: photo.y,
      rot: photo.rot,
    };
  };

  const project = {
    app: "ticketer",
    version: FORMAT_VERSION,
    settings,
    main: main && addImage(main),
    stub: stub && addImage(stub),
    stickers: items.map(({ id: _id, photo, ...sticker }) => ({
      ...sticker,
      photo: addImage(photo),
    })),
  };
  zip.file("project.json", JSON.stringify(project));

  return {
    blob: await zip.generateAsync({ type: "blob", compression: "DEFLATE" }),
    filename: `${slug(settings.fields.title ?? "")}.ticketer`,
  };
}

// Reads a project file and replaces the current ticket with it. Throws a readable message if the
// file is not a ticketer project. Nothing is changed unless the whole file is good.
export async function openProject(file: File): Promise<void> {
  if (file.size > MAX_FILE_BYTES) throw new Error("That file is too large to be a project.");

  let zip: Awaited<ReturnType<typeof newZip>>;
  try {
    const base = await newZip();
    zip = await base.loadAsync(file);
  } catch {
    throw new Error("That is not a ticketer project file.");
  }
  if (Object.keys(zip.files).length > MAX_ENTRIES)
    throw new Error("That is not a ticketer project file.");

  const json = zip.file("project.json");
  if (!json) throw new Error("That is not a ticketer project file.");

  let project: z.infer<typeof projectSchema>;
  let settings: Settings;
  try {
    const raw = JSON.parse(await json.async("string"));
    project = projectSchema.parse(raw);
    settings = settingsSchema.parse(project.settings);
  } catch {
    throw new Error("That project file is damaged or from a newer version.");
  }

  const load = async (crop: z.infer<typeof cropSchema>): Promise<Photo> => {
    const entry = zip.file(crop.file);
    if (!entry) throw new Error("A picture is missing from that project.");
    const blob = await entry.async("blob");
    const type =
      blob.type ||
      (crop.file.endsWith(".png")
        ? "image/png"
        : crop.file.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg");
    const photo = await loadPhoto(
      new File([blob], crop.file.split("/").pop() ?? "image", { type }),
    );
    return { ...photo, z: crop.z, x: crop.x, y: crop.y, rot: crop.rot };
  };

  const [main, stub] = await Promise.all([
    project.main ? load(project.main) : null,
    project.stub ? load(project.stub) : null,
  ]);
  const stickers: Sticker[] = [];
  for (const saved of project.stickers) {
    stickers.push({
      ...saved,
      shape: saved.shape as Sticker["shape"],
      id: crypto.randomUUID(),
      photo: await load(saved.photo),
    });
  }

  // Everything loaded, now it replaces what is there
  useTicketerStore.setState({ settings });
  usePhotoStore.setState({ main, stub, error: "" });
  useStickerStore.setState({ items: stickers, selectedId: null, guides: null, error: "" });
}
