import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  tabBadgeVariants,
  tabContentVariants,
  tabIndicatorVariants,
  tabsListVariants,
  tabVariants,
} from "@/components/ui/Tabs/variant";
import { TabsContext, type TabsVariant } from "@/contexts/TabsContext";
import { useTabsVariant } from "@/hooks/useTabsVariant";

type TabsProps = Omit<TabsPrimitive.Root.Props, "className"> & {
  // Primary tabs sit at the top of a page or section, secondary tabs inside it
  variant?: TabsVariant;
  className?: string;
};

// <Tabs defaultValue="a">
//   <TabsList>
//     <TabsTab value="a">One</TabsTab>
//     <TabsTab value="b">Two</TabsTab>
//   </TabsList>
//   <TabsPanel value="a">…</TabsPanel>
//   <TabsPanel value="b">…</TabsPanel>
// </Tabs>
function Tabs({ className, variant = "primary", ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={variant}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-variant={variant}
        className={className}
        {...props}
      />
    </TabsContext.Provider>
  );
}

type TabsListProps = Omit<TabsPrimitive.List.Props, "className"> & { className?: string };

// The row of tabs with the divider under it. Tabs share the width equally.
function TabsList({ className, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(tabsListVariants(), className)}
      {...props}
    />
  );
}

type TabsTabProps = Omit<TabsPrimitive.Tab.Props, "className" | "children"> & {
  className?: string;
  // The label
  children: ReactNode;
  // Primary tabs show it above the label, secondary tabs before it
  icon?: ReactNode;
  // true is a small dot, a number or text is a large badge (numbers above 999 show 999+)
  badge?: boolean | number | string;
};

function TabBadge({
  value,
  placement,
}: {
  value: true | number | string;
  placement: "icon" | "inline";
}) {
  if (value === true) {
    return (
      <span className={tabBadgeVariants({ size: "small", placement })}>
        <span className="sr-only">Has updates</span>
      </span>
    );
  }

  const text = typeof value === "number" && value > 999 ? "999+" : value;
  return <span className={tabBadgeVariants({ size: "large", placement })}>{text}</span>;
}

function TabsTab({ className, icon, badge, children, ...props }: TabsTabProps) {
  const variant = useTabsVariant();
  // Only primary tabs stack the icon over the label
  const stacked = variant === "primary" && Boolean(icon);
  const placement = stacked ? "icon" : "inline";
  const badgeNode =
    badge !== undefined && badge !== false ? (
      <TabBadge value={badge} placement={placement} />
    ) : null;

  return (
    <TabsPrimitive.Tab
      data-slot="tab"
      className={cn(tabVariants({ variant, stacked }), className)}
      {...props}
    >
      <span className={tabContentVariants({ variant, stacked })}>
        {icon && (
          <span aria-hidden="true" className="relative flex [&_svg]:size-6 [&_svg]:shrink-0">
            {icon}
            {stacked && badgeNode}
          </span>
        )}
        <span className="flex min-w-0 items-center">
          <span className="truncate">{children}</span>
          {!stacked && badgeNode}
        </span>
        <span aria-hidden="true" className={tabIndicatorVariants({ variant })} />
      </span>
    </TabsPrimitive.Tab>
  );
}

type TabsPanelProps = Omit<TabsPrimitive.Panel.Props, "className"> & { className?: string };

// The content of one tab, shown while that tab is active
function TabsPanel({ className, ...props }: TabsPanelProps) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn(
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsPanel, TabsTab };
