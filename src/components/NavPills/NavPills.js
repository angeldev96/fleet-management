import React from "react";
import { cn } from "lib/utils";
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";

const colorClasses = {
  primary: "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
  info: "data-[state=active]:bg-blue-500 data-[state=active]:text-white",
  success: "data-[state=active]:bg-emerald-500 data-[state=active]:text-white",
  warning: "data-[state=active]:bg-amber-500 data-[state=active]:text-white",
  danger: "data-[state=active]:bg-red-500 data-[state=active]:text-white",
  rose: "data-[state=active]:bg-pink-500 data-[state=active]:text-white",
};

export default function NavPills({ active = 0, tabs, color = "primary", horizontal, alignCenter }) {
  const [activeTab, setActiveTab] = React.useState(active);

  const tabButtons = (
    <div
      className={cn(
        "flex gap-1 rounded-lg bg-muted p-1",
        horizontal && "flex-col",
        alignCenter && "justify-center",
      )}
    >
      {tabs.map((tab, index) => (
        <button
          key={index}
          data-state={index === activeTab ? "active" : "inactive"}
          onClick={() => setActiveTab(index)}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
            "text-muted-foreground hover:text-foreground",
            colorClasses[color] || colorClasses.primary,
            "data-[state=active]:shadow-sm",
          )}
        >
          {tab.tabIcon && <tab.tabIcon className="h-4 w-4" />}
          {tab.tabButton}
        </button>
      ))}
    </div>
  );

  const tabContent = (
    <div className="mt-4">
      {tabs.map((tab, index) => {
        if (index !== activeTab) return null;
        return <div key={index}>{tab.tabContent}</div>;
      })}
    </div>
  );

  return horizontal !== undefined ? (
    <GridContainer>
      <GridItem {...horizontal.tabsGrid}>{tabButtons}</GridItem>
      <GridItem {...horizontal.contentGrid}>{tabContent}</GridItem>
    </GridContainer>
  ) : (
    <div>
      {tabButtons}
      {tabContent}
    </div>
  );
}
