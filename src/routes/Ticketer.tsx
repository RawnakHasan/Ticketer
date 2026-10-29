import { MockupPanel } from "@/components/ticket/MockupPanel";
import { TicketPreview } from "@/components/ticket/TicketPreview";

export default function Ticketer() {
  return (
    <div className="flex h-full items-start justify-center gap-6 overflow-y-auto p-4 lg:items-center lg:p-6">
      <TicketPreview />
      {/* Only where there is room beside the preview */}
      <aside aria-label="Previews" className="hidden w-80 shrink-0 2xl:block">
        <MockupPanel />
      </aside>
    </div>
  );
}
