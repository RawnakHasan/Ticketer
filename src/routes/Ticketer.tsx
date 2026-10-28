import { TicketPreview } from "@/components/ticket/TicketPreview";

export default function Ticketer() {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-4 lg:p-6">
      <TicketPreview />
    </div>
  );
}
