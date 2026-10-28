import { useState } from "react";
import { Outlet } from "react-router";
import Sidebar from "@/components/Sidebar";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { StepTabs } from "@/components/ticket/StepTabs";
import type { StepId } from "@/components/ticket/steps";
import { Tabs } from "@/components/ui/Tabs";

export default function AppLayout() {
  const [step, setStep] = useState<StepId>("style");

  return (
    // The tabs in the header and the panels in the sidebar share this one Tabs
    <Tabs
      value={step}
      onValueChange={(value) => setStep(value as StepId)}
      className="flex h-dvh flex-col overflow-hidden bg-surface-container lg:flex-row"
    >
      <Sidebar step={step} onStepChange={setStep} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-2 sm:gap-4 sm:px-4">
          <div className="min-w-0 flex-1">
            <StepTabs />
          </div>
          <ThemeSwitcher />
        </header>

        <main className="min-h-0 flex-1 overflow-hidden rounded-tl-3xl bg-surface">
          <Outlet />
        </main>
      </div>
    </Tabs>
  );
}
