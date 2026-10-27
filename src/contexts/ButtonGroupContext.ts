import { createContext } from "react";

export type ButtonGroupSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ButtonGroupShape = "round" | "square";

export type ButtonGroupContextState = {
  size: ButtonGroupSize;
  shape?: ButtonGroupShape;
};

export const ButtonGroupContext = createContext<ButtonGroupContextState | undefined>(undefined);
