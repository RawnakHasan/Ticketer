// components/StepNav.tsx
import { NavLink } from "react-router";
import { cn } from "@/lib/utils";

const steps = [
  { to: "style", label: "Style" },
  { to: "upload", label: "Upload" },
  { to: "details", label: "Details" },
  { to: "export", label: "Export" },
];

export function StepNav() {
  return (
    <nav aria-label="Steps">
      <ol className="flex items-center gap-1">
        {steps.map((step, i) => (
          <li key={step.to}>
            <NavLink
              to={step.to}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium outline-none",
                  "transition-colors focus-visible:ring-2 focus-visible:ring-primary",
                  isActive
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-on-surface-variant hover:bg-on-surface/8",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-xs",
                      isActive ? "bg-primary text-on-primary" : "bg-on-surface/12",
                    )}
                  >
                    {i + 1}
                  </span>
                  {/* Mobile: only the active step shows its label */}
                  <span className={cn(isActive ? "inline" : "hidden md:inline")}>{step.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ol>
    </nav>
  );
}
