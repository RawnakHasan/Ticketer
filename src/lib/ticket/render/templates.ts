import type { TemplateId } from "../ids";
import { renderAdmit } from "./admit";
import { renderBoarding } from "./boarding";
import { renderCalendar } from "./calendar";
import { renderCinema } from "./cinema";
import { renderConcert } from "./concert";
import { renderMuseum } from "./museum";
import { renderPlayer } from "./player";
import { renderPolaroid } from "./polaroid";
import { renderReceipt } from "./receipt";
import { renderStamp } from "./stamp";
import type { Template } from "./types";

// Each template is one file that exports a render function, plus one entry here.
// Adding one: write render/<n>.ts, add its id to TEMPLATE_IDS in ids.ts, register it below.
export const TEMPLATES: Record<TemplateId, Template> = {
  admit: {
    id: "admit",
    label: "Admit One",
    description: "Classic stub",
    size: [600, 1000],
    photoBox: [568, 372, 0.6, 1.8],
    stubRatio: (sa) =>
      sa.layout === "square" ? 1 : sa.layout === "cover" ? 568 / 262 : 568 / sa.h,
    stubControls: "styles",
    usesStub: true,
    render: renderAdmit,
  },
  museum: {
    id: "museum",
    label: "Museum Pass",
    description: "Wide, photo-led",
    size: [1000, 420],
    // Width 0 means "whatever the stub photo leaves", see mainFrame
    photoBox: [0, 388, 0.8, 1.5],
    stubRatio: (sa) => sa.mw / 388,
    stubControls: "width",
    usesStub: true,
    render: renderMuseum,
  },
  player: {
    id: "player",
    label: "Player Card",
    description: "Music-player panel",
    size: [1000, 560],
    photoBox: [666, 528, 0.95, 1.4],
    stubRatio: (sa) => 246 / Math.min(210, sa.mw + 60),
    stubControls: "width",
    usesStub: true,
    render: renderPlayer,
  },
  boarding: {
    id: "boarding",
    label: "Boarding Pass",
    description: "Route and fields",
    size: [1000, 440],
    photoBox: [698, 190, 0.5, 2.2],
    stubRatio: (sa) => 238 / Math.min(230, sa.mw + 40),
    stubControls: "width",
    usesStub: true,
    render: renderBoarding,
  },
  concert: {
    id: "concert",
    label: "Concert Pass",
    description: "Full-bleed photo",
    size: [1000, 440],
    photoBox: [668, 408, 1, 1.5],
    stubRatio: () => 236 / 170,
    stubControls: "none",
    usesStub: true,
    render: renderConcert,
  },
  cinema: {
    id: "cinema",
    label: "Cinema Stub",
    description: "Poster and title",
    size: [1000, 380],
    photoBox: [300, 348, 1, 1.4],
    stubRatio: () => 1,
    stubControls: "none",
    usesStub: true,
    render: renderCinema,
  },
  polaroid: {
    id: "polaroid",
    label: "Polaroid Pass",
    description: "Instant photo",
    size: [600, 760],
    photoBox: [528, 470, 0.8, 1.5],
    stubRatio: () => 1,
    stubControls: "none",
    usesStub: true,
    render: renderPolaroid,
  },
  calendar: {
    id: "calendar",
    label: "Calendar Pass",
    description: "Month grid from your date",
    size: [1000, 600],
    // Never shorter than the month grid needs
    photoBox: [540, 568, 1, 1.4],
    stubRatio: () => 1,
    stubControls: "none",
    usesStub: false,
    render: renderCalendar,
  },
  stamp: {
    id: "stamp",
    label: "Stamp Pass",
    description: "Postmark and denomination",
    size: [600, 760],
    photoBox: [492, 520, 0.8, 1.4],
    stubRatio: () => 1,
    stubControls: "none",
    usesStub: false,
    render: renderStamp,
  },
  receipt: {
    id: "receipt",
    label: "Receipt",
    description: "Itemised memory",
    size: [560, 980],
    photoBox: [440, 300, 0.6, 1.4],
    stubRatio: () => 1,
    stubControls: "none",
    usesStub: false,
    render: renderReceipt,
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);
