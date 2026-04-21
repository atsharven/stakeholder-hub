import React from "react";
import { FilterSelect } from "./DashboardControls";

export function FiltersSection({
  surfaceStyle,
  theme,
  stateFilter,
  setStateFilter,
  setIsStateSelectFocused,
  stateOptions,
  sectorFilter,
  setSectorFilter,
  uniqueSectors,
  priorityFilter,
  setPriorityFilter,
}) {
  return (
    <section
      style={{
        ...surfaceStyle,
        padding: 18,
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
      }}
    >
      <FilterSelect
        label="State"
        value={stateFilter}
        onChange={setStateFilter}
        onFocus={() => setIsStateSelectFocused(true)}
        onBlur={() => setIsStateSelectFocused(false)}
        options={stateOptions}
        theme={theme}
      />
      <FilterSelect
        label="Sector"
        value={sectorFilter}
        onChange={setSectorFilter}
        options={[
          { value: "all", label: "All Sectors" },
          ...uniqueSectors.map((value) => ({ value, label: value })),
        ]}
        theme={theme}
      />
      <FilterSelect
        label="Priority"
        value={priorityFilter}
        onChange={setPriorityFilter}
        options={[
          { value: "all", label: "All Priorities" },
          { value: "High", label: "High" },
          { value: "Medium", label: "Medium" },
          { value: "Low", label: "Low" },
        ]}
        theme={theme}
      />
    </section>
  );
}
