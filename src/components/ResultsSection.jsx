import React from "react";
import { splitEmailValues, splitPhoneValues } from "../contactUtils";

export function ResultsSection({
  surfaceStyle,
  theme,
  searchQuery,
  stateFilter,
  sectorFilter,
  priorityFilter,
  setSearchQuery,
  setStateFilter,
  setSectorFilter,
  setPriorityFilter,
  setSelectedId,
  summary,
  filteredStakeholders,
  selectedId,
  handleSelectStakeholder,
  isDark,
  renderHighlightedText,
  renderBadge,
  getCategoryColor,
  getLevelColor,
}) {
  return (
    <section
      style={{
        ...surfaceStyle,
        padding: 18,
        display: "grid",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "0 0 18px",
          borderBottom: `1px solid ${theme.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Stakeholder Cards</div>
          <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
            {summary.shown} results
          </div>
        </div>
        {(searchQuery || stateFilter !== "all" || sectorFilter !== "all" || priorityFilter !== "all") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setStateFilter("all");
              setSectorFilter("all");
              setPriorityFilter("all");
              setSelectedId(null);
            }}
            style={{
              border: "none",
              background: "transparent",
              color: theme.primary,
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
              transition: "all 0.2s ease",
              fontSize: 14,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.7";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
          padding: "18px 0 0 0",
          overflowY: "auto",
          maxHeight: "calc(100vh - 290px)",
        }}
      >
        {filteredStakeholders.length === 0 ? (
          <div
            style={{
              padding: 28,
              borderRadius: 16,
              background: theme.surface,
              color: theme.textMuted,
              textAlign: "center",
              gridColumn: "1 / -1",
            }}
          >
            No stakeholders matched the current search and filters.
          </div>
        ) : (
          filteredStakeholders.map((item) => {
            const active = item.id === selectedId;
            const contactInfo = [
              ...splitPhoneValues(item.mobile),
              ...splitPhoneValues(item.officeNo),
              ...splitEmailValues(item.email),
            ];

            return (
              <button
                key={item.id}
                onClick={() => handleSelectStakeholder(item.id)}
                style={{
                  textAlign: "left",
                  border: `1px solid ${active ? theme.primary : theme.border}`,
                  background: active ? `${theme.primary}10` : theme.card,
                  borderRadius: 18,
                  padding: 14,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "grid",
                  gridTemplateRows: "auto auto auto auto",
                  gap: 10,
                  boxShadow: active ? `0 0 0 2px ${theme.primary}20` : "none",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = "translateY(-4px)";
                  event.currentTarget.style.boxShadow = `0 8px 20px ${isDark ? "rgba(0,0,0,0.2)" : "rgba(15,23,42,0.1)"}`;
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "translateY(0)";
                  event.currentTarget.style.boxShadow = active ? `0 0 0 2px ${theme.primary}20` : "none";
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>
                    {renderHighlightedText(item.name || "Unnamed")}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 3 }}>
                    {renderHighlightedText(item.designation || "—")}
                  </div>
                </div>

                <div style={{ fontSize: 12, color: theme.textSecondary }}>
                  {renderHighlightedText(item.organization || "—")}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {renderBadge(item.state, theme.primary)}
                  {renderBadge(item.category, getCategoryColor(item.category))}
                  {renderBadge(item.priority, getLevelColor(item.priority))}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    fontSize: 11,
                  }}
                >
                  {contactInfo.map((value) => (
                    <div
                      key={value}
                      style={{
                        color: theme.textSecondary,
                        padding: "4px 8px",
                        borderRadius: 999,
                        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.76)",
                        border: `1px solid ${theme.border}`,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                      }}
                    >
                      {renderHighlightedText(value)}
                    </div>
                  ))}
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
