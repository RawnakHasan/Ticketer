import { TabsContext } from "@/contexts/TabsContext";
import { useContext } from "react";

// Doesn't throw: a tab outside <Tabs> is treated as primary
export const useTabsVariant = () => useContext(TabsContext);
