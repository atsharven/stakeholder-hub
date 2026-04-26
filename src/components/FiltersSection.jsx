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
        padding: 16,
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: theme.textMuted }}>
        FILTERS
      </div>
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
