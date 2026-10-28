import { Download, ImagePlus, Palette, PenLine } from "lucide-react";

export const STEPS = [
  { value: "style", label: "Style", icon: Palette },
  { value: "upload", label: "Upload", icon: ImagePlus },
  { value: "details", label: "Details", icon: PenLine },
  { value: "export", label: "Export", icon: Download },
] as const;

export type StepId = (typeof STEPS)[number]["value"];
