import React, { useState } from "react";
import {
  BarChart3,
  Bookmark,
  LogIn,
  LogOut,
  Moon,
  RefreshCw,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import { StatPill, ToggleButton, UtilityButton } from "./DashboardControls";
import { LoginModal } from "./LoginModal";

export function DashboardHeaderSection(props) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const {
    surfaceStyle,
    isDark,
    isMobile,
    theme,
    searchQuery,
    setSearchQuery,
    handleSearchKeyDown,
    showSummary,
    setShowSummary,
    showInsights,
    setShowInsights,
    summary,
    session,
    savedViews,
    refreshing,
    handleRefresh,
    toggleTheme,
    handleLogout,
    handleSaveView,
    useManualLogin,
    setUseManualLogin,
    googleLoaded,
    handleLogin,
    loginForm,
    setLoginForm,
    accountMessage,
    applySavedView,
  } = props;

  return (
    <section
      style={{
        ...surfaceStyle,
        padding: "24px clamp(18px, 3vw, 32px)",
        background: isDark
          ? "linear-gradient(135deg, rgba(30,30,30,0.94) 0%, rgba(22,22,22,0.9) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(247,250,245,0.86) 100%)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.6fr) minmax(320px, 0.95fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ maxWidth: 720 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 8,
                background: `${theme.primary}25`,
                color: theme.primary,
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: "0.3px",
                marginBottom: 12,
              }}
            >
              Rajasthan
            </div>
            <h1
              style={{
                fontSize: "clamp(28px, 5.5vw, 40px)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              StakeHolder Hub
            </h1>
            <p style={{ color: theme.textSecondary, maxWidth: 480, fontSize: "clamp(13px, 2vw, 14px)", lineHeight: 1.5 }}>
              Search across Rajasthan Stakeholders
            </p>

            {/* Compact Insights Bar */}
            {props.insightMetrics && props.showInsights && (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: isDark ? `${theme.primary}12` : `${theme.primary}08`,
                  border: `1px solid ${theme.primary}20`,
                }}
              >
                {Object.entries(props.insightMetrics).map(([key, value]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
                    <span style={{ color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                      {key}:
                    </span>
                    <span style={{ color: theme.text, fontWeight: 800 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ToggleButton
              active={showSummary}
              onClick={() => setShowSummary((value) => !value)}
              label="Summary"
              icon={<BarChart3 size={16} />}
              theme={theme}
              isDark={isDark}
            />
            <ToggleButton
              active={showInsights}
              onClick={() => setShowInsights((value) => !value)}
              label="Insights"
              icon={<BarChart3 size={16} />}
              theme={theme}
              isDark={isDark}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 2.2fr) minmax(220px, 1fr)",
              gap: 14,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 56,
                borderRadius: 16,
                border: `1px solid ${theme.border}`,
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
                padding: "0 18px",
                backdropFilter: "blur(10px)",
                transition: "all 0.2s ease",
              }}
            >
              <Search size={18} style={{ color: theme.textMuted, flexShrink: 0 }} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search name, organization, email..."
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  color: theme.text,
                  fontSize: "clamp(14px, 2vw, 15px)",
                  outline: "none",
                }}
              />
            </label>
            {showSummary ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <StatPill label="CONTACTS" value={summary.shown} theme={theme} />
                <StatPill label="PHONE" value={summary.withPhone} theme={theme} />
                <StatPill label="EMAIL" value={summary.withEmail} theme={theme} />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  borderRadius: 16,
                  border: `1px solid ${theme.border}`,
                  background: theme.bg,
                  padding: "10px 14px",
                  color: theme.textSecondary,
                  fontSize: 13,
                }}
              >
                <span>{summary.shown} contacts</span>
                <span>{summary.highPriority} high priority</span>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: 16,
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(10px)",
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div style={{ display: "grid", gap: 4, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: theme.text,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 700,
                  fontSize: "clamp(13px, 2vw, 14px)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <UserRound size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
                <span>{session ? session.name : "Guest"}</span>
              </div>
              <div style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>
                {session ? `${savedViews.length} views` : "Not signed in"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <UtilityButton onClick={handleRefresh} title={refreshing ? "Refreshing" : "Refresh"} isLoading={refreshing} theme={theme} isDark={isDark}>
                <RefreshCw size={15} style={{ opacity: 0.85 }} />
              </UtilityButton>
              <UtilityButton onClick={toggleTheme} title="Toggle theme" theme={theme} isDark={isDark}>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </UtilityButton>
              {session && (
                <UtilityButton onClick={handleLogout} title="Logout" theme={theme} isDark={isDark}>
                  <LogOut size={15} />
                </UtilityButton>
              )}
            </div>
          </div>

          {!session && (
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              style={{
                height: 44,
                borderRadius: 12,
                border: "none",
                background: theme.primary,
                color: isDark ? "#101214" : "#ffffff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              <LogIn size={16} />
              Sign In
            </button>
          )}

          {session && (
            <>
              <button
                type="button"
                onClick={handleSaveView}
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  background: theme.primary,
                  color: isDark ? "#101214" : "#ffffff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                }}
              >
                <Bookmark size={15} />
                Save dashboard
              </button>

              {savedViews.length > 0 && (
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: theme.textMuted }}>
                    SAVED VIEWS
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {savedViews.map((view) => (
                      <button
                        key={view.id}
                        type="button"
                        onClick={() => applySavedView(view)}
                        style={{
                          borderRadius: 999,
                          border: `1px solid ${theme.border}`,
                          background: theme.surface,
                          color: theme.text,
                          padding: "8px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          theme={theme}
          isDark={isDark}
          useManualLogin={useManualLogin}
          setUseManualLogin={setUseManualLogin}
          googleLoaded={googleLoaded}
          handleLogin={handleLogin}
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          accountMessage={accountMessage}
        />
      </div>
    </section>
  );
}
