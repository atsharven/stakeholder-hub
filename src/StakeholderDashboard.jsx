import { useCallback, useEffect, useMemo, useState } from "react";
import { ContactModal } from "./components/ContactModal";
import { DashboardHeaderSection } from "./components/DashboardHeaderSection";
import { FiltersSection } from "./components/FiltersSection";
import { InsightsSection } from "./components/InsightsSection";
import { ResultsSection } from "./components/ResultsSection";
import { fetchStakeholders } from "./googleSheetsClient";
import { useTheme } from "./themeContext";
import { categoryColors, levelColors } from "./themeConstants";

const searchableFields = [
  "id",
  "name",
  "organization",
  "designation",
  "category",
  "state",
  "mobile",
  "officeNo",
  "email",
  "relManager",
  "nextAction",
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeSearchText = (value) => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
const normalizePhone = (value) => String(value || "").replace(/\D/g, "");
const createIdentityKey = (item) =>
  [normalizeSearchText(item.name), normalizeSearchText(item.organization), normalizeSearchText(item.designation)]
    .filter(Boolean)
    .join("|");

const getSearchScore = (item, query) => {
  if (!query) return 0;

  const normalizedQuery = normalizeSearchText(query);
  const phoneQuery = normalizePhone(query);
  const weightedFields = [
    ["name", 80],
    ["organization", 60],
    ["designation", 45],
    ["id", 65],
    ["email", 55],
    ["mobile", 55],
    ["officeNo", 50],
    ["category", 35],
    ["state", 30],
    ["relManager", 25],
    ["nextAction", 15],
  ];

  let score = 0;

  weightedFields.forEach(([field, weight]) => {
    const value = item[field] || "";
    const normalizedValue = normalizeSearchText(value);
    const phoneValue = normalizePhone(value);

    if (normalizedValue === normalizedQuery || (phoneQuery && phoneValue === phoneQuery)) {
      score = Math.max(score, weight + 50);
      return;
    }

    if (normalizedValue.startsWith(normalizedQuery) || (phoneQuery && phoneValue.startsWith(phoneQuery))) {
      score = Math.max(score, weight + 25);
      return;
    }

    if (normalizedValue.includes(normalizedQuery) || (phoneQuery && phoneValue.includes(phoneQuery))) {
      score = Math.max(score, weight);
    }
  });

  return score;
};

const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";

  return input
    .replace(/[<>"'&]/g, (char) => ({
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "&": "&amp;",
    }[char]))
    .trim()
    .slice(0, 100);
};

export default function StakeholderDashboard() {
  const isDev = import.meta.env.DEV;
  const { theme, isDark, toggleTheme } = useTheme();

  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 980 : false,
  );
  const [isStateSelectFocused, setIsStateSelectFocused] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const [savedViews, setSavedViews] = useState([]);
  const [session, setSession] = useState(() => {
    if (typeof window === "undefined") return null;

    try {
      const saved = window.localStorage.getItem("stakeholder-session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loginForm, setLoginForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [useManualLogin, setUseManualLogin] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const surfaceStyle = {
    background: theme.card,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.08)"}`,
    borderRadius: 24,
    boxShadow: isDark ? "0 16px 34px rgba(0,0,0,0.18)" : "0 14px 30px rgba(15, 23, 42, 0.05)",
  };

  const getCategoryColor = (value) =>
    categoryColors[value]?.[isDark ? "dark" : "light"] || theme.primary;

  const getLevelColor = (value) =>
    levelColors[value]?.[isDark ? "dark" : "light"] || theme.warning;

  const handleGoogleLogin = useCallback((response) => {
    if (response?.credential) {
      try {
        const parts = response.credential.split(".");
        if (parts.length !== 3) throw new Error("Invalid JWT format");

        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
            .join(""),
        );
        const decodedToken = JSON.parse(jsonPayload);

        if (!decodedToken.email || !decodedToken.sub) {
          throw new Error("Invalid token claims");
        }

        const pictureUrl = decodedToken.picture ? new URL(decodedToken.picture).href : "";
        setSession({
          name: sanitizeInput(decodedToken.name || decodedToken.email?.split("@")[0] || "User"),
          email: decodedToken.email || "",
          phone: "",
          picture: pictureUrl,
          loginAt: new Date().toISOString(),
          loginMethod: "google",
          iss: decodedToken.iss,
          sub: decodedToken.sub,
        });
        setAccountMessage("Signed in");
        setLoginForm({ name: "", phone: "", email: "" });
      } catch {
        if (isDev) console.error("Google login error");
        setError(new Error("Sign-in failed. Please try again."));
      }
    }
  }, [isDev]);

  const loadData = async () => {
    try {
      setError(null);
      const stakeholders = await fetchStakeholders();
      setData(stakeholders);
    } catch (err) {
      setError(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    let mounted = true;

    const initGoogleSignIn = () => {
      if (!mounted) return;

      if (typeof window !== "undefined" && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "866343349257-t38c6knad389r166er8pvteaea73tru0.apps.googleusercontent.com",
            callback: handleGoogleLogin,
            auto_select: false,
            itp_support: true,
          });
          setGoogleLoaded(true);
        } catch {
          if (isDev) console.error("Google Sign-In init error");
        }
      } else if (retryCount < maxRetries) {
        retryCount += 1;
        setTimeout(initGoogleSignIn, 500);
      } else if (isDev) {
        console.warn("Google SDK not loaded after max retries");
      }
    };

    initGoogleSignIn();
    return () => {
      mounted = false;
    };
  }, [handleGoogleLogin, isDev]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (!selectedId) loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedId]);

  useEffect(() => {
    if (googleLoaded && !useManualLogin && !session) {
      const timer = setTimeout(() => {
        if (typeof window !== "undefined" && window.google?.accounts?.id) {
          const buttonContainer = document.getElementById("google-signin-button");
          if (buttonContainer && !buttonContainer.querySelector("div[data-buttons]")) {
            try {
              window.google.accounts.id.renderButton(buttonContainer, {
                theme: isDark ? "dark" : "light",
                size: "large",
                width: "100%",
                type: "standard",
                text: "signin_with",
              });
            } catch {
              if (isDev) console.error("Google button render error");
            }
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [googleLoaded, isDark, isDev, session, useManualLogin]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onResize = () => setIsMobile(window.innerWidth < 980);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (session) {
      window.localStorage.setItem("stakeholder-session", JSON.stringify(session));
    } else {
      window.localStorage.removeItem("stakeholder-session");
    }
  }, [session]);

  const activeView = useMemo(
    () => ({
      searchQuery,
      stateFilter,
      sectorFilter,
      priorityFilter,
      showSummary,
      showInsights,
    }),
    [priorityFilter, searchQuery, sectorFilter, showInsights, showSummary, stateFilter],
  );

  const savedViewsKey = useMemo(() => {
    if (!session) return null;
    const identity = session.email || session.sub || session.name;
    return identity ? `stakeholder-saved-views:${identity}` : null;
  }, [session]);

  useEffect(() => {
    if (typeof window === "undefined" || !savedViewsKey) {
      setSavedViews([]);
      return;
    }

    try {
      const saved = window.localStorage.getItem(savedViewsKey);
      setSavedViews(saved ? JSON.parse(saved) : []);
    } catch {
      setSavedViews([]);
    }
  }, [savedViewsKey]);

  useEffect(() => {
    if (!accountMessage) return undefined;
    const timeout = setTimeout(() => setAccountMessage(""));
    return () => clearTimeout(timeout);
  }, [accountMessage]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const applySavedView = useCallback((view) => {
    setSearchQuery(view.searchQuery || "");
    setStateFilter(view.stateFilter || "all");
    setSectorFilter(view.sectorFilter || "all");
    setPriorityFilter(view.priorityFilter || "all");
    setShowSummary(Boolean(view.showSummary));
    setShowInsights(Boolean(view.showInsights));
    setSelectedId(null);
  }, []);

  const uniqueStates = useMemo(
    () => [...new Set(data.map((item) => item.state).filter(Boolean))].sort(),
    [data],
  );

  const stateCounts = useMemo(() => {
    const counts = new Map();
    data.forEach((item) => {
      if (item.state) counts.set(item.state, (counts.get(item.state) || 0) + 1);
    });
    return counts;
  }, [data]);

  const uniqueSectors = useMemo(
    () => [...new Set(data.map((item) => item.category).filter(Boolean))].sort(),
    [data],
  );

  const stateOptions = useMemo(
    () => [
      { value: "all", label: isStateSelectFocused ? `All (${data.length})` : "All" },
      ...uniqueStates.map((value) => ({
        value,
        label: `${value} (${stateCounts.get(value) || 0})`,
      })),
    ],
    [data.length, isStateSelectFocused, stateCounts, uniqueStates],
  );

  const filteredStakeholders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const normalizedQuery = normalizeSearchText(query);
    const phoneQuery = normalizePhone(query);

    return data
      .filter((item) => stateFilter === "all" || item.state === stateFilter)
      .filter((item) => sectorFilter === "all" || item.category === sectorFilter)
      .filter((item) => priorityFilter === "all" || item.priority === priorityFilter)
      .filter((item) => {
        if (!query) return true;

        return searchableFields.some((field) =>
          normalizeSearchText(item[field]).includes(normalizedQuery)
          || (phoneQuery && normalizePhone(item[field]).includes(phoneQuery)),
        );
      })
      .sort((a, b) => {
        if (query) {
          const scoreDiff = getSearchScore(b, query) - getSearchScore(a, query);
          if (scoreDiff !== 0) return scoreDiff;
        }

        const priorityRank = { High: 0, Medium: 1, Low: 2 };
        const aPriority = priorityRank[a.priority] ?? 3;
        const bPriority = priorityRank[b.priority] ?? 3;

        if (aPriority !== bPriority) return aPriority - bPriority;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [data, priorityFilter, searchQuery, sectorFilter, stateFilter]);

  const stakeholderLookup = useMemo(
    () => new Map(data.map((item) => [item.id, item])),
    [data],
  );

  const selectedStakeholderForModal = useMemo(
    () => (selectedId ? stakeholderLookup.get(selectedId) || null : null),
    [selectedId, stakeholderLookup],
  );

  useEffect(() => {
    if (filteredStakeholders.length === 0) {
      setSelectedId(null);
      setHighlightedIndex(0);
      return;
    }

    const selectedStillVisible = filteredStakeholders.some((item) => item.id === selectedId);
    if (!selectedStillVisible) setSelectedId(null);
    setHighlightedIndex((current) => Math.min(current, filteredStakeholders.length - 1));
  }, [filteredStakeholders, selectedId]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, stateFilter, sectorFilter, priorityFilter]);

  const summary = useMemo(() => {
    const withPhone = filteredStakeholders.filter((item) => item.mobile || item.officeNo).length;
    const withEmail = filteredStakeholders.filter((item) => item.email).length;
    const highPriority = filteredStakeholders.filter((item) => item.priority === "High").length;

    return {
      total: data.length,
      shown: filteredStakeholders.length,
      withPhone,
      withEmail,
      highPriority,
    };
  }, [data.length, filteredStakeholders]);

  const insightMetrics = useMemo(() => {
    const states = filteredStakeholders.reduce((acc, item) => {
      if (item.state) acc[item.state] = (acc[item.state] || 0) + 1;
      return acc;
    }, {});

    const nextActionReady = filteredStakeholders.filter(
      (item) => item.nextAction || item.nextActionDate,
    ).length;
    const contactReady = filteredStakeholders.filter(
      (item) => item.mobile || item.officeNo || item.email,
    ).length;

    return {
      nextActionRate:
        filteredStakeholders.length > 0
          ? Math.round((nextActionReady / filteredStakeholders.length) * 100)
          : 0,
      contactReadyRate:
        filteredStakeholders.length > 0
          ? Math.round((contactReady / filteredStakeholders.length) * 100)
          : 0,
      states: Object.entries(states).sort((a, b) => b[1] - a[1]).slice(0, 4),
    };
  }, [filteredStakeholders]);

  const dataQuality = useMemo(() => {
    const identityCounts = new Map();
    const emailCounts = new Map();
    const phoneCounts = new Map();

    filteredStakeholders.forEach((item) => {
      const identityKey = createIdentityKey(item);
      const emailKey = normalizeSearchText(item.email);
      const phoneKey = normalizePhone(item.mobile || item.officeNo);

      if (identityKey) identityCounts.set(identityKey, (identityCounts.get(identityKey) || 0) + 1);
      if (emailKey) emailCounts.set(emailKey, (emailCounts.get(emailKey) || 0) + 1);
      if (phoneKey) phoneCounts.set(phoneKey, (phoneCounts.get(phoneKey) || 0) + 1);
    });

    return {
      duplicateIdentity: filteredStakeholders.filter(
        (item) => identityCounts.get(createIdentityKey(item)) > 1,
      ).length,
      duplicateEmail: filteredStakeholders.filter(
        (item) => item.email && emailCounts.get(normalizeSearchText(item.email)) > 1,
      ).length,
      duplicatePhone: filteredStakeholders.filter((item) => {
        const phoneKey = normalizePhone(item.mobile || item.officeNo);
        return phoneKey && phoneCounts.get(phoneKey) > 1;
      }).length,
      incompleteContacts: filteredStakeholders.filter(
        (item) => !item.mobile && !item.officeNo && !item.email,
      ).length,
    };
  }, [filteredStakeholders]);

  const handleSelectStakeholder = (id) => {
    setSelectedId(id);
    const index = filteredStakeholders.findIndex((item) => item.id === id);
    if (index >= 0) setHighlightedIndex(index);
  };

  const handleCloseModal = useCallback(() => {
    setSelectedId(null);
  }, []);

  const renderBadge = (label, color) => {
    if (!label) return null;

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "6px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          color,
          background: `${color}18`,
          border: `1px solid ${color}30`,
        }}
      >
        {label}
      </span>
    );
  };

  const cardStyle = {
    padding: 18,
    borderRadius: 22,
    background: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.72)",
    border: `1px solid ${theme.border}`,
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: theme.textMuted,
  };

  const contactInfoStyle = {
    fontSize: 15,
    color: theme.text,
    fontWeight: 600,
    fontFamily: "monospace",
    wordBreak: "break-all",
    overflowWrap: "break-word",
  };

  const renderHighlightedText = (value) => {
    const text = String(value || "");
    const query = searchQuery.trim();

    if (!query) return text;

    const safeQuery = escapeRegExp(query);
    const parts = text.split(new RegExp(`(${safeQuery})`, "ig"));
    if (parts.length === 1) return text;

    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={`${part}-${index}`}
          style={{
            background: `${theme.warning}33`,
            color: theme.text,
            padding: "0 2px",
            borderRadius: 4,
          }}
        >
          {part}
        </mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      ),
    );
  };

  const handleSearchKeyDown = (event) => {
    if (filteredStakeholders.length === 0) {
      if (event.key === "Escape") setSearchQuery("");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => {
        const nextIndex = Math.min(current + 1, filteredStakeholders.length - 1);
        setSelectedId(filteredStakeholders[nextIndex].id);
        return nextIndex;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => {
        const nextIndex = Math.max(current - 1, 0);
        setSelectedId(filteredStakeholders[nextIndex].id);
        return nextIndex;
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const active = filteredStakeholders[highlightedIndex];
      if (active) handleSelectStakeholder(active.id);
      return;
    }

    if (event.key === "Escape") setSearchQuery("");
  };

  const handleLogin = (event) => {
    event.preventDefault();

    const name = sanitizeInput(loginForm.name);
    const email = sanitizeInput(loginForm.email);
    const phone = sanitizeInput(loginForm.phone);

    if (!name) {
      setError(new Error("Name is required"));
      return;
    }
    if (email && !email.includes("@")) {
      setError(new Error("Invalid email format"));
      return;
    }
    if (phone && !/^[+\d\s\-().]*$/.test(phone)) {
      setError(new Error("Invalid phone format"));
      return;
    }

    setSession({
      name,
      phone,
      email: email.toLowerCase(),
      loginAt: new Date().toISOString(),
      loginMethod: "manual",
    });
    setAccountMessage("Signed in");
    setLoginForm({ name: "", phone: "", email: "" });
    setError(null);
  };

  const handleLogout = () => {
    if (session?.loginMethod === "google" && typeof window !== "undefined" && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.revoke(session.email, () => {
          if (isDev) console.debug("Google sign-out completed");
        });
      } catch {
        if (isDev) console.error("Google sign-out error");
      }
    }

    setSession(null);
    setSavedViews([]);
    setAccountMessage("Signed out");
    setLoginForm({ name: "", phone: "", email: "" });
    setError(null);
  };

  const handleSaveView = useCallback(() => {
    if (!session || !savedViewsKey || typeof window === "undefined") {
      setAccountMessage("Sign in to save dashboard views");
      setUseManualLogin(false);
      return;
    }

    const nextView = {
      id: `${Date.now()}`,
      label:
        stateFilter !== "all"
          ? stateFilter
          : searchQuery.trim()
            ? `Search: ${searchQuery.trim().slice(0, 24)}`
            : "All contacts",
      savedAt: new Date().toISOString(),
      ...activeView,
    };

    const nextViews = [nextView, ...savedViews].slice(0, 6);
    setSavedViews(nextViews);
    window.localStorage.setItem(savedViewsKey, JSON.stringify(nextViews));
    setAccountMessage("Dashboard view saved");
  }, [activeView, savedViews, savedViewsKey, searchQuery, session, stateFilter]);

  if (data.length === 0 && !error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: theme.bg,
          color: theme.textMuted,
        }}
      >
        Loading stakeholders...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: theme.bg,
        }}
      >
        <div style={{ ...surfaceStyle, maxWidth: 560, padding: 28 }}>
          <div style={{ color: theme.danger, fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
            Could not load stakeholder data
          </div>
          <div style={{ color: theme.textMuted, lineHeight: 1.7, fontSize: 14 }}>
            Check that the Google Sheet is shared with access enabled for CSV export, then try
            refreshing again.
          </div>
          <pre
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 12,
              background: theme.surface,
              color: theme.text,
              fontSize: 12,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {error.message}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(180deg, #121212 0%, #171717 100%)"
          : "linear-gradient(180deg, #f7f8fb 0%, #eef2f7 100%)",
        padding: "24px 16px 40px",
        color: theme.text,
        fontFamily: '"Segoe UI", "Aptos", "SF Pro Display", system-ui, sans-serif',
      }}
    >
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translate(-50%, -40%); opacity: 0; }
          to { transform: translate(-50%, -50%); opacity: 1; }
        }
      `}</style>

      <div style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gap: 20 }}>
        <DashboardHeaderSection
          surfaceStyle={surfaceStyle}
          isDark={isDark}
          isMobile={isMobile}
          theme={theme}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearchKeyDown={handleSearchKeyDown}
          showSummary={showSummary}
          setShowSummary={setShowSummary}
          showInsights={showInsights}
          setShowInsights={setShowInsights}
          summary={summary}
          session={session}
          savedViews={savedViews}
          refreshing={refreshing}
          handleRefresh={handleRefresh}
          toggleTheme={toggleTheme}
          handleLogout={handleLogout}
          handleSaveView={handleSaveView}
          useManualLogin={useManualLogin}
          setUseManualLogin={setUseManualLogin}
          googleLoaded={googleLoaded}
          handleLogin={handleLogin}
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          accountMessage={accountMessage}
          applySavedView={applySavedView}
        />

        <InsightsSection
          showInsights={showInsights}
          surfaceStyle={surfaceStyle}
          isDark={isDark}
          theme={theme}
          insightMetrics={insightMetrics}
          dataQuality={dataQuality}
          total={summary.shown}
        />

        <FiltersSection
          surfaceStyle={surfaceStyle}
          theme={theme}
          stateFilter={stateFilter}
          setStateFilter={setStateFilter}
          setIsStateSelectFocused={setIsStateSelectFocused}
          stateOptions={stateOptions}
          sectorFilter={sectorFilter}
          setSectorFilter={setSectorFilter}
          uniqueSectors={uniqueSectors}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
        />

        <ResultsSection
          surfaceStyle={surfaceStyle}
          theme={theme}
          searchQuery={searchQuery}
          stateFilter={stateFilter}
          sectorFilter={sectorFilter}
          priorityFilter={priorityFilter}
          setSearchQuery={setSearchQuery}
          setStateFilter={setStateFilter}
          setSectorFilter={setSectorFilter}
          setPriorityFilter={setPriorityFilter}
          setSelectedId={setSelectedId}
          summary={summary}
          filteredStakeholders={filteredStakeholders}
          selectedId={selectedId}
          handleSelectStakeholder={handleSelectStakeholder}
          isDark={isDark}
          renderHighlightedText={renderHighlightedText}
          renderBadge={renderBadge}
          getCategoryColor={getCategoryColor}
          getLevelColor={getLevelColor}
        />

        {selectedStakeholderForModal && (
          <ContactModal
            stakeholder={selectedStakeholderForModal}
            onClose={handleCloseModal}
            theme={theme}
            isDark={isDark}
            renderBadge={renderBadge}
            getCategoryColor={getCategoryColor}
            cardStyle={cardStyle}
            labelStyle={labelStyle}
            contactInfoStyle={contactInfoStyle}
          />
        )}
      </div>
    </div>
  );
}
