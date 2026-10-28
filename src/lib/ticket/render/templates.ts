import type { TemplateId } from "../ids";
import { renderAdmit } from "./admit";
import type { Template } from "./types";

// Each template is one file that exports a render function, plus one entry here.
// Adding one: write render/<name>.ts, add its id to TEMPLATE_IDS in ids.ts, register it below.
export const TEMPLATES: Record<TemplateId, Template> = {
  admit: {
    id: "admit",
    label: "Admit One",
    description: "Classic stub",
    size: [600, 1000],
    photoBox: [568, 372, 0.6, 1.8],
    stubRatio: (sa) =>
      sa.layout === "square" ? 1 : sa.layout === "cover" ? 568 / 262 : 568 / sa.h,
    render: renderAdmit,
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);
