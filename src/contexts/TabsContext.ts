import { createContext } from "react";

export type TabsVariant = "primary" | "secondary";

// Lets each tab know which kind of tabs it is in (the variant is set once on <Tabs>)
export const TabsContext = createContext<TabsVariant>("primary");
