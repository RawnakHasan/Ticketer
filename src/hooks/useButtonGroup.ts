import { ButtonGroupContext } from "@/contexts/ButtonGroupContext";
import { useContext } from "react";

// Unlike useTheme, this doesn't throw: buttons still work on their own
export const useButtonGroup = () => useContext(ButtonGroupContext);
