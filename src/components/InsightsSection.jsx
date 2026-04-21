import React from "react";
import { InsightCard, MiniChart } from "./DashboardControls";

export function InsightsSection({ showInsights, surfaceStyle, isDark, theme, insightMetrics, dataQuality, total }) {
  if (!showInsights) return null;

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 20,
      }}
    >
      <div
        style={{
          ...surfaceStyle,
          padding: 18,
          display: "grid",
          gap: 8,
          background: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.78)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: theme.textMuted,
          }}
        >
          Useful Signals
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
          }}
        >
          <InsightCard
            label="CONTACT READY"
            value={`${insightMetrics.contactReadyRate}%`}
            subtext="phone or email available"
            theme={theme}
          />
          <InsightCard
            label="NEXT ACTION"
            value={`${insightMetrics.nextActionRate}%`}
            subtext="follow-up fields present"
            theme={theme}
          />
        </div>
      </div>

      {insightMetrics.states?.length > 0 && (
        <MiniChart
          title="State Spread"
          entries={insightMetrics.states}
          colorGetter={() => theme.primary}
          theme={theme}
          isDark={isDark}
          total={total}
        />
      )}

      {(dataQuality.duplicateIdentity > 0
        || dataQuality.duplicatePhone > 0
        || dataQuality.duplicateEmail > 0
        || dataQuality.incompleteContacts > 0) && (
        <div
          style={{
            ...surfaceStyle,
            padding: 18,
            display: "grid",
            gap: 10,
            background: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.78)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: theme.textMuted,
            }}
          >
            Data Notes
          </div>
          <div style={{ display: "grid", gap: 6, color: theme.textSecondary, fontSize: 13 }}>
            {dataQuality.duplicateIdentity > 0 && <div>⚠️ {dataQuality.duplicateIdentity} possible duplicates</div>}
            {dataQuality.duplicatePhone > 0 && <div>📞 {dataQuality.duplicatePhone} shared phone numbers</div>}
            {dataQuality.duplicateEmail > 0 && <div>✉️ {dataQuality.duplicateEmail} shared emails</div>}
            {dataQuality.incompleteContacts > 0 && <div>❌ {dataQuality.incompleteContacts} missing contact info</div>}
          </div>
        </div>
      )}
    </section>
  );
}
