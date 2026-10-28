import { STEPS } from "@/components/ticket/steps";
import { TabsList, TabsTab } from "@/components/ui/Tabs";

export function StepTabs() {
  return (
    <TabsList aria-label="Steps" className="max-w-md bg-transparent after:hidden">
      {STEPS.map(({ value, label, icon: Icon }) => (
        <TabsTab key={value} value={value} icon={<Icon />}>
          {label}
        </TabsTab>
      ))}
    </TabsList>
  );
}
