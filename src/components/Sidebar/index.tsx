import type { ComponentType } from "react";
import { Logo } from "@/components/Logo";
import { StepFooter } from "@/components/ticket/StepFooter";
import { DetailsStep } from "@/components/ticket/panels/DetailsStep";
import { ExportStep } from "@/components/ticket/panels/ExportStep";
import { StyleStep } from "@/components/ticket/panels/StyleStep";
import { UploadStep } from "@/components/ticket/panels/UploadStep";
import { STEPS, type StepId } from "@/components/ticket/steps";
import { TabsPanel } from "@/components/ui/Tabs";

const PANELS: Record<StepId, ComponentType> = {
  style: StyleStep,
  upload: UploadStep,
  details: DetailsStep,
  export: ExportStep,
};

type SidebarProps = {
  step: StepId;
  onStepChange: (step: StepId) => void;
};

// Beside the preview on desktop, under it on a phone
export default function Sidebar({ step, onStepChange }: SidebarProps) {
  return (
    <aside className="order-last flex h-[50dvh] shrink-0 flex-col lg:order-first lg:h-auto lg:w-96">
      <div className="hidden h-16 shrink-0 items-center px-6 lg:flex">
        <Logo className="size-8" />
        <span className="ml-3 text-xl font-black text-on-surface">Ticketer</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {STEPS.map(({ value }) => {
          const Panel = PANELS[value];
          return (
            <TabsPanel key={value} value={value} className="flex flex-col">
              <Panel />
            </TabsPanel>
          );
        })}
      </div>

      <StepFooter step={step} onStepChange={onStepChange} />
    </aside>
  );
}
