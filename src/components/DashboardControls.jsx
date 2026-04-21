import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function FilterSelect({ label, value, onChange, options, onFocus, onBlur, theme }) {
  return (
    <label
      style={{
        display: "grid",
        gap: 8,
        minWidth: 160,
        flex: "1 1 160px",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: theme.textMuted,
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          height: 44,
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
          background: theme.surface,
          color: theme.text,
          padding: "0 14px",
          fontSize: 14,
          transition: "all 0.2s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.primary;
          e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.primary}20`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.border;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ToggleButton({ active, onClick, label, icon, theme, isDark }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 42,
        padding: "0 14px",
        borderRadius: 12,
        border: `1px solid ${theme.border}`,
        background: active ? `${theme.primary}12` : theme.surface,
        color: active ? theme.primary : theme.text,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 4px 12px ${isDark ? "rgba(0,0,0,0.2)" : "rgba(15,23,42,0.08)"}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {icon}
      {label}
      {active ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  );
}

export function StatPill({ label, value, theme }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 2,
        minWidth: 92,
        padding: "10px 12px",
        borderRadius: 14,
        border: `1px solid ${theme.border}`,
        background: theme.bg,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: theme.textMuted }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color: theme.text }}>{value}</div>
    </div>
  );
}

export function InsightCard({ label, value, subtext, theme }) {
  return (
    <div
      style={{
        padding: "14px 0",
        borderRadius: 0,
        border: "none",
        borderBottom: `1px solid ${theme.border}`,
        background: "transparent",
        display: "grid",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: theme.textMuted }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: theme.text }}>{value}</div>
      {subtext ? <div style={{ fontSize: 12, color: theme.textSecondary }}>{subtext}</div> : null}
    </div>
  );
}

export function MiniChart({ title, entries, colorGetter, theme, isDark, total }) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 24,
        background: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.76)",
        border: `1px solid ${theme.border}`,
        backdropFilter: "blur(14px)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: theme.textMuted,
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {entries.length === 0 ? (
          <div style={{ fontSize: 13, color: theme.textMuted }}>No data available</div>
        ) : (
          entries.map(([label, value]) => {
            const width = total > 0 ? Math.max((value / total) * 100, 8) : 0;
            const color = colorGetter(label);

            return (
              <div key={label} style={{ display: "grid", gap: 6 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: theme.text }}>{label}</span>
                  <span style={{ color: theme.textMuted, fontWeight: 700 }}>{value}</span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: theme.bg,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${width}%`,
                      height: "100%",
                      background: color,
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function UtilityButton({ onClick, children, title, isLoading, theme, isDark }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        height: 36,
        width: 36,
        borderRadius: 999,
        border: `1px solid ${theme.border}`,
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.82)",
        color: theme.text,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        backdropFilter: "blur(10px)",
        transition: "all 0.3s ease",
        transform: isLoading ? "scale(0.95)" : "scale(1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.88)";
        e.currentTarget.style.transform = isLoading ? "scale(0.95)" : "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.82)";
        e.currentTarget.style.transform = isLoading ? "scale(0.95)" : "scale(1)";
      }}
    >
      <span
        style={{
          display: "inline-block",
          animation: isLoading ? "spin 1.5s linear infinite" : "none",
          transformOrigin: "center",
        }}
      >
        {children}
      </span>
    </button>
  );
}
