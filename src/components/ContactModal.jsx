import React from "react";
import { Mail, Phone } from "lucide-react";

export const ContactModal = React.memo(function ContactModal({
  stakeholder,
  onClose,
  theme,
  isDark,
  renderBadge,
  getCategoryColor,
  cardStyle,
  labelStyle,
  contactInfoStyle,
}) {
  if (!stakeholder) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="modal-backdrop"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(6px)",
          zIndex: 998,
        }}
      />
      <div
        className="modal-content"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: 28,
          padding: 32,
          width: "520px",
          maxWidth: "calc(100% - 48px)",
          maxHeight: "90vh",
          overflowY: "auto",
          zIndex: 999,
          boxShadow: isDark
            ? "0 25px 50px rgba(0,0,0,0.4)"
            : "0 25px 50px rgba(15,23,42,0.15)",
          display: "grid",
          gap: 24,
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            height: 32,
            width: 32,
            borderRadius: 999,
            border: `1px solid ${theme.border}`,
            background: theme.surface,
            color: theme.text,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.8)";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.surface;
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          ✕
        </button>

        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: theme.textMuted, marginBottom: 12 }}>
            CONTACT DETAILS
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
            {stakeholder.name || "Unnamed"}
          </div>
          <div style={{ color: theme.textSecondary, fontSize: 16, marginBottom: 16 }}>
            {stakeholder.designation || "—"}
            {stakeholder.organization && ` • ${stakeholder.organization}`}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {renderBadge(stakeholder.state, theme.primary)}
            {renderBadge(stakeholder.category, getCategoryColor(stakeholder.category))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...labelStyle, marginBottom: 12 }}>Quick Actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {stakeholder.mobile && (
              <a
                href={`tel:${stakeholder.mobile}`}
                style={{
                  height: 44,
                  borderRadius: 12,
                  background: theme.primary,
                  color: isDark ? "#101214" : "#ffffff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <Phone size={16} />
                Call
              </a>
            )}
            {stakeholder.email && (
              <a
                href={`mailto:${stakeholder.email}`}
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.76)",
                  color: theme.text,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.82)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.76)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Mail size={16} />
                Email
              </a>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...labelStyle, marginBottom: 12 }}>Contact Information</div>
          <div style={{ display: "grid", gap: 14 }}>
            {stakeholder.mobile && (
              <div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>Mobile</div>
                <div style={contactInfoStyle}>{stakeholder.mobile}</div>
              </div>
            )}
            {stakeholder.officeNo && (
              <div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>Office</div>
                <div style={contactInfoStyle}>{stakeholder.officeNo}</div>
              </div>
            )}
            {stakeholder.email && (
              <div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>Email</div>
                <div style={contactInfoStyle}>{stakeholder.email}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
