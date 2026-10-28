import { Button } from "@/components/ui/Button";
import { STEPS, type StepId } from "@/components/ticket/steps";

export function StepFooter({
  step,
  onStepChange,
}: {
  step: StepId;
  onStepChange: (step: StepId) => void;
}) {
  const index = STEPS.findIndex((s) => s.value === step);
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];

  return (
    <footer className="flex items-center justify-between gap-2 border-t border-outline-variant p-3">
      <Button
        variant="text"
        disabled={!previous}
        onClick={() => previous && onStepChange(previous.value)}
      >
        Back
      </Button>
      {next && (
        <Button variant="filled" onClick={() => onStepChange(next.value)}>
          Next: {next.label}
        </Button>
      )}
    </footer>
  );
}
