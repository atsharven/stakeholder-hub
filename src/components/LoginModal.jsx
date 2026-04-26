import React from "react";
import { LogIn, LogOut, X } from "lucide-react";

const FORM_FIELDS = [
  { key: "name", label: "Name", required: true, type: "text", placeholder: "Your name" },
  { key: "email", label: "Email", required: false, type: "email", placeholder: "Optional email" },
];

const COMMON_STYLES = {
  labelText: (theme) => ({
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: theme.textMuted,
  }),
  input: (theme, isDark) => ({
    height: 42,
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: theme.text,
    padding: "0 14px",
    fontSize: 14,
  }),
  button: (theme, isDark, variant = "primary") => ({
    height: 42,
    borderRadius: 12,
    border: variant === "primary" ? "none" : `1px solid ${theme.border}`,
    background: variant === "primary" ? theme.primary : "transparent",
    color: variant === "primary" ? (isDark ? "#101214" : "#ffffff") : theme.textSecondary,
    fontWeight: variant === "primary" ? 800 : 700,
    cursor: "pointer",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  }),
};

export function LoginModal({ isOpen, onClose, theme, isDark, useManualLogin, setUseManualLogin, googleLoaded, handleLogin, loginForm, setLoginForm, accountMessage }) {
  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
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
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: isDark ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: 20,
          border: `1px solid ${theme.border}`,
          padding: "32px 28px",
          maxWidth: 420,
          width: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
          zIndex: 999,
          boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.6)" : "0 20px 60px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: theme.text }}>
            {useManualLogin ? "Sign In" : "Welcome"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: theme.textMuted,
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {!useManualLogin && googleLoaded ? (
            <>
              <div
                id="google-signin-button"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  minHeight: 44,
                }}
              />
              <button
                type="button"
                onClick={() => setUseManualLogin(true)}
                style={{
                  ...COMMON_STYLES.button(theme, isDark, "secondary"),
                  fontSize: 14,
                  height: 44,
                }}
              >
                <LogIn size={16} />
                Use Manual Sign-In
              </button>
            </>
          ) : (
            <form onSubmit={handleLogin} style={{ display: "grid", gap: 16 }}>
              {FORM_FIELDS.map((field) => (
                <label key={field.key} style={{ display: "grid", gap: 8 }}>
                  <span style={COMMON_STYLES.labelText(theme)}>{field.label}</span>
                  <input
                    required={field.required}
                    type={field.type}
                    value={loginForm[field.key]}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    style={COMMON_STYLES.input(theme, isDark)}
                  />
                </label>
              ))}

              <button type="submit" style={COMMON_STYLES.button(theme, isDark, "primary")}>
                Sign in
              </button>

              {googleLoaded && (
                <button
                  type="button"
                  onClick={() => setUseManualLogin(false)}
                  style={COMMON_STYLES.button(theme, isDark, "secondary")}
                >
                  Back to Google Sign-In
                </button>
              )}
            </form>
          )}

          {accountMessage && (
            <div
              style={{
                borderRadius: 12,
                padding: "12px 14px",
                background: `${theme.primary}12`,
                border: `1px solid ${theme.primary}20`,
                color: theme.textSecondary,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {accountMessage}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
