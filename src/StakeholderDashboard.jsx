import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  LogOut,
  Mail,
  Moon,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { fetchStakeholders } from "./googleSheetsClient";
import { useTheme } from "./useTheme";
import {
  categoryColors,
  levelColors,
  positionColors,
  sentimentColors,
} from "./themeConstants";

const copyText = async (value) => {
  if (!value || typeof navigator === "undefined" || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

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

export default function StakeholderDashboard() {
  const { theme, isDark, toggleTheme } = useTheme();

  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 980 : false,
  );
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
  const [pinnedIds, setPinnedIds] = useState(() => {
    if (typeof window === "undefined") return [];

    try {
      const saved = window.localStorage.getItem("stakeholder-pins");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [recentIds, setRecentIds] = useState(() => {
    if (typeof window === "undefined") return [];

    try {
      const saved = window.localStorage.getItem("stakeholder-recent");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  const getPositionColor = (value) =>
    positionColors[value]?.[isDark ? "dark" : "light"] || theme.textMuted;

  const getSentimentColor = (value) =>
    sentimentColors[value]?.[isDark ? "dark" : "light"] || theme.textMuted;

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

  // Initialize Google Sign-In
  useEffect(() => {
    const initGoogleSignIn = () => {
      if (typeof window !== "undefined" && window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
          callback: handleGoogleLogin,
          auto_select: false,
          itp_support: true,
        });
        setGoogleLoaded(true);
      } else {
        setTimeout(initGoogleSignIn, 500);
      }
    };
    initGoogleSignIn();
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds, but pause when contact modal is open
    const interval = setInterval(() => {
      if (!selectedId) {
        loadData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedId]);

  // Render Google Sign-In button
  useEffect(() => {
    if (googleLoaded && !useManualLogin && !session) {
      const timer = setTimeout(() => {
        if (typeof window !== "undefined" && window.google?.accounts?.id) {
          const buttonContainer = document.getElementById("google-signin-button");
          if (buttonContainer && !buttonContainer.querySelector("div[data-buttons]")) {
            window.google.accounts.id.renderButton(buttonContainer, {
              theme: isDark ? "dark" : "light",
              size: "large",
              width: "100%",
              type: "standard",
              text: "signin_with",
            });
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [googleLoaded, useManualLogin, session, isDark]);

  useEffect(() => {
    if (!copyStatus) return undefined;
    const timeout = setTimeout(() => setCopyStatus(""), 1800);
    return () => clearTimeout(timeout);
  }, [copyStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onResize = () => setIsMobile(window.innerWidth < 980);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("stakeholder-pins", JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("stakeholder-recent", JSON.stringify(recentIds));
  }, [recentIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (session) {
      window.localStorage.setItem("stakeholder-session", JSON.stringify(session));
    } else {
      window.localStorage.removeItem("stakeholder-session");
    }
  }, [session]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const uniqueStates = useMemo(
    () => [...new Set(data.map((item) => item.state).filter(Boolean))].sort(),
    [data],
  );

  const uniqueSectors = useMemo(
    () => [...new Set(data.map((item) => item.category).filter(Boolean))].sort(),
    [data],
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
          normalizeSearchText(item[field]).includes(normalizedQuery) ||
          (phoneQuery && normalizePhone(item[field]).includes(phoneQuery)),
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

  // Prevent modal from showing stale data when filteredStakeholders updates
  const selectedStakeholderForModal = useMemo(
    () => filteredStakeholders.find((item) => item.id === selectedId) || null,
    [filteredStakeholders, selectedId],
  );

  useEffect(() => {
    if (filteredStakeholders.length === 0) {
      setSelectedId(null);
      setHighlightedIndex(0);
      return;
    }

    const selectedStillVisible = filteredStakeholders.some((item) => item.id === selectedId);
    if (!selectedStillVisible) {
      setSelectedId(null);
    }
    setHighlightedIndex((current) => Math.min(current, filteredStakeholders.length - 1));
  }, [filteredStakeholders, selectedId]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, stateFilter, sectorFilter, priorityFilter]);



  const stakeholderLookup = useMemo(
    () => new Map(data.map((item) => [item.id, item])),
    [data],
  );

  const pinnedStakeholders = useMemo(
    () => pinnedIds.map((id) => stakeholderLookup.get(id)).filter(Boolean),
    [pinnedIds, stakeholderLookup],
  );

  const recentStakeholders = useMemo(
    () =>
      recentIds
        .filter((id) => !pinnedIds.includes(id))
        .map((id) => stakeholderLookup.get(id))
        .filter(Boolean)
        .slice(0, 6),
    [pinnedIds, recentIds, stakeholderLookup],
  );

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
    const positionCounts = filteredStakeholders.reduce((acc, item) => {
      if (item.position) {
        acc[item.position] = (acc[item.position] || 0) + 1;
      }
      return acc;
    }, {});

    const stateCounts = filteredStakeholders.reduce((acc, item) => {
      if (item.state) {
        acc[item.state] = (acc[item.state] || 0) + 1;
      }
      return acc;
    }, {});

    const engagementReady = filteredStakeholders.filter(
      (item) => item.lastInteraction || item.nextAction || item.nextActionDate,
    ).length;

    const withNotes = filteredStakeholders.filter((item) => item.notes).length;
    const nextActionReady = filteredStakeholders.filter(
      (item) => item.nextAction || item.nextActionDate,
    ).length;
    const contactReady = filteredStakeholders.filter(
      (item) => item.mobile || item.officeNo || item.email,
    ).length;
    const supportiveCount = filteredStakeholders.filter((item) => item.position === "Supportive").length;
    const resistantCount = filteredStakeholders.filter((item) => item.position === "Resistant").length;

    return {
      engagementRate:
        filteredStakeholders.length > 0
          ? Math.round((engagementReady / filteredStakeholders.length) * 100)
          : 0,
      withNotes,
      nextActionRate:
        filteredStakeholders.length > 0
          ? Math.round((nextActionReady / filteredStakeholders.length) * 100)
          : 0,
      contactReadyRate:
        filteredStakeholders.length > 0
          ? Math.round((contactReady / filteredStakeholders.length) * 100)
          : 0,
      supportiveCount,
      resistantCount,
      positions: Object.entries(positionCounts).sort((a, b) => b[1] - a[1]).slice(0, 4),
      states: Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 4),
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

      if (identityKey) {
        identityCounts.set(identityKey, (identityCounts.get(identityKey) || 0) + 1);
      }
      if (emailKey) {
        emailCounts.set(emailKey, (emailCounts.get(emailKey) || 0) + 1);
      }
      if (phoneKey) {
        phoneCounts.set(phoneKey, (phoneCounts.get(phoneKey) || 0) + 1);
      }
    });

    const duplicateIdentity = filteredStakeholders.filter(
      (item) => identityCounts.get(createIdentityKey(item)) > 1,
    ).length;
    const duplicateEmail = filteredStakeholders.filter(
      (item) => item.email && emailCounts.get(normalizeSearchText(item.email)) > 1,
    ).length;
    const duplicatePhone = filteredStakeholders.filter((item) => {
      const phoneKey = normalizePhone(item.mobile || item.officeNo);
      return phoneKey && phoneCounts.get(phoneKey) > 1;
    }).length;

    const incompleteContacts = filteredStakeholders.filter(
      (item) => !item.mobile && !item.officeNo && !item.email,
    ).length;

    return {
      duplicateIdentity,
      duplicateEmail,
      duplicatePhone,
      incompleteContacts,
    };
  }, [filteredStakeholders]);

  const duplicateIdentityKeys = useMemo(() => {
    const counts = new Map();
    filteredStakeholders.forEach((item) => {
      const key = createIdentityKey(item);
      if (key) {
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
  }, [filteredStakeholders]);

  const hasDuplicateIdentity = (item) => duplicateIdentityKeys.has(createIdentityKey(item));

  const handleCopy = async (value, label) => {
    const copied = await copyText(value);
    setCopyStatus(copied ? `${label} copied` : `Could not copy ${label.toLowerCase()}`);
  };

  const handleSelectStakeholder = (id) => {
    setSelectedId(id);
    setRecentIds((current) => [id, ...current.filter((item) => item !== id)].slice(0, 8));
    const index = filteredStakeholders.findIndex((item) => item.id === id);
    if (index >= 0) setHighlightedIndex(index);
  };

  const togglePinned = (id) => {
    setPinnedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [id, ...current].slice(0, 8),
    );
  };

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

  const FilterSelect = ({ label, value, onChange, options }) => (
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

  const StakeholderChip = ({ item, pinned = false }) => (
    <button
      onClick={() => handleSelectStakeholder(item.id)}
      style={{
        border: `1px solid ${theme.border}`,
        background: theme.surface,
        color: theme.text,
        borderRadius: 14,
        padding: "12px 14px",
        minWidth: 200,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 800 }}>{item.name}</div>
      <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 3 }}>
        {item.organization || item.state || item.id}
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
        {renderBadge(item.state, theme.primary)}
        {pinned && <span style={{ fontSize: 11, fontWeight: 800, color: theme.warning }}>Pinned</span>}
      </div>
    </button>
  );

  const ToggleButton = ({ active, onClick, label, icon }) => (
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

  const StatPill = ({ label, value }) => (
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

  const InsightCard = ({ label, value, subtext }) => (
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

  const MiniChart = ({ title, entries, colorGetter }) => (
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
            const width = summary.shown > 0 ? Math.max((value / summary.shown) * 100, 8) : 0;
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

  const DetailRow = ({ label, value }) => (
    <div
      style={{
        display: "grid",
        gap: 6,
        paddingBottom: 14,
        borderBottom: `1px solid ${theme.border}`,
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
        {label}
      </div>
      <div style={{ color: theme.text, fontSize: 14, lineHeight: 1.5 }}>{value || "—"}</div>
    </div>
  );

  const UtilityButton = ({ onClick, children, title, isLoading }) => (
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

    if (event.key === "Escape") {
      setSearchQuery("");
    }
  };

  const handleGoogleLogin = (response) => {
    if (response.credential) {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decodedToken = JSON.parse(jsonPayload);

      const newSession = {
        name: decodedToken.name || decodedToken.email?.split('@')[0] || "User",
        email: decodedToken.email || "",
        phone: "",
        picture: decodedToken.picture || "",
        loginAt: new Date().toISOString(),
        loginMethod: "google",
      };

      setSession(newSession);
      setLoginForm({ name: "", phone: "", email: "" });
    }
  };

  const handleLogin = (event) => {
    event.preventDefault();

    if (!loginForm.name.trim()) return;

    const newSession = {
      name: loginForm.name.trim(),
      phone: loginForm.phone.trim(),
      email: loginForm.email.trim().toLowerCase(),
      loginAt: new Date().toISOString(),
      loginMethod: "manual",
    };
    
    setSession(newSession);
    setLoginForm({ name: "", phone: "", email: "" });
  };

  const handleLogout = () => {
    if (session?.loginMethod === "google" && typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.revoke(session.email, () => {
        console.log("Signed out from Google");
      });
    }
    setSession(null);
    setLoginForm({ name: "", phone: "", email: "" });
  };

  const ContactModal = React.memo(({ stakeholder, onClose }) => {
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

          <div
            style={{
              ...cardStyle,
            }}
          >
            <div style={{ ...labelStyle, marginBottom: 12 }}>
              Quick Actions
            </div>
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

          <div
            style={{
              ...cardStyle,
            }}
          >
            <div style={{ ...labelStyle, marginBottom: 12 }}>
              Contact Information
            </div>
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

  if (!session) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: isDark
            ? "linear-gradient(180deg, #121212 0%, #171717 100%)"
            : "linear-gradient(180deg, #f7f8fb 0%, #eef2f7 100%)",
          display: "grid",
          placeItems: "center",
          padding: 24,
          color: theme.text,
          fontFamily: '"Segoe UI", "Aptos", "SF Pro Display", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            ...surfaceStyle,
            width: "min(100%, 980px)",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "clamp(24px, 4vw, 42px)",
              background: isDark
                ? "linear-gradient(140deg, rgba(31,31,31,1) 0%, rgba(24,24,24,1) 100%)"
                : "linear-gradient(140deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
              borderRight: isMobile ? "none" : `1px solid ${theme.border}`,
              borderBottom: isMobile ? `1px solid ${theme.border}` : "none",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 999,
                background: `${theme.primary}14`,
                color: theme.primary,
                fontWeight: 700,
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              <ShieldCheck size={14} />
              WRI Stakeholder Dashboard
            </div>
            <h1
              style={{
                fontSize: "clamp(28px, 5vw, 42px)",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                marginBottom: 10,
              }}
            >
              Sign in to open the stakeholder workspace.
            </h1>
            <p style={{ color: theme.textSecondary, fontSize: 15, maxWidth: 480 }}>
              This is a lightweight login shell for now. We can later extend it to store and use
              user details, permissions, and activity context.
            </p>

            <div
              style={{
                marginTop: 24,
                display: "grid",
                gap: 12,
              }}
            >
              {[
                "Fast search across contacts, orgs, emails, and phone numbers",
                "Quick stakeholder cards with call, email, and copy actions",
                "Optional insights instead of a metrics-heavy default screen",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    color: theme.textSecondary,
                    fontSize: 14,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: theme.primary,
                      flexShrink: 0,
                    }}
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleLogin}
            style={{
              padding: "clamp(24px, 4vw, 42px)",
              display: "grid",
              gap: 18,
              alignContent: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>Sign In</div>
              <div style={{ color: theme.textSecondary, marginTop: 6, fontSize: 14 }}>
                Enter your details to continue.
              </div>
            </div>

            {[
              { key: "name", label: "Name", required: true, type: "text", placeholder: "Your name" },
              { key: "phone", label: "Phone", required: false, type: "tel", placeholder: "Optional phone" },
              { key: "email", label: "Email", required: false, type: "email", placeholder: "Optional email" },
            ].map((field) => (
              <label key={field.key} style={{ display: "grid", gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: theme.textMuted,
                  }}
                >
                  {field.label}
                </span>
                <input
                  required={field.required}
                  type={field.type}
                  value={loginForm[field.key]}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  placeholder={field.placeholder}
                  style={{
                    height: 48,
                    borderRadius: 14,
                    border: `1px solid ${theme.border}`,
                    background: theme.surface,
                    color: theme.text,
                    padding: "0 14px",
                    fontSize: 14,
                  }}
                />
              </label>
            ))}

            <button
              type="submit"
              style={{
                height: 48,
                borderRadius: 14,
                border: "none",
                background: theme.primary,
                color: isDark ? "#101214" : "#ffffff",
                fontWeight: 800,
                cursor: "pointer",
                marginTop: 6,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Open Dashboard
            </button>

            <div style={{ position: "relative", margin: "24px 0", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: "1px", background: theme.border }} />
              <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: "1px", background: theme.border }} />
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <button
                type="button"
                onClick={() => handleSocialLogin("google", "")}
                style={{
                  height: 48,
                  borderRadius: 14,
                  border: `2px solid ${theme.border}`,
                  background: theme.surface,
                  color: theme.text,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "all 0.2s ease",
                  fontSize: 14,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#4285F4";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(66,133,244,0.15)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <circle cx="9" cy="9" r="1" />
                  <circle cx="15" cy="9" r="1" />
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin("facebook", "")}
                style={{
                  height: 48,
                  borderRadius: 14,
                  border: `2px solid ${theme.border}`,
                  background: theme.surface,
                  color: theme.text,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "all 0.2s ease",
                  fontSize: 14,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#1877F2";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(24,119,242,0.15)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 2h-3a6 6 0 0 0-6 6v4h-2v4h2v6h4v-6h3l1-4h-4V8a2 2 0 0 1 2-2h1z" />
                </svg>
                Continue with Facebook
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
        <div
          style={{
            ...surfaceStyle,
            maxWidth: 560,
            padding: 28,
          }}
        >
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
        fontFamily:
          '"Segoe UI", "Aptos", "SF Pro Display", system-ui, sans-serif',
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translate(-50%, -40%); opacity: 0; }
          to { transform: translate(-50%, -50%); opacity: 1; }
        }
      `}</style>
      <div style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gap: 20 }}>
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
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
              marginBottom: 22,
            }}
          >
            <div style={{ maxWidth: 720 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: `${theme.primary}14`,
                  color: theme.primary,
                  fontWeight: 700,
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                WRI Stakeholder Dashboard
              </div>
            <h1
              style={{
                fontSize: "clamp(26px, 5vw, 38px)",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                marginBottom: 4,
              }}
            >
              Stakeholder contacts, simplified.
            </h1>
            <p style={{ color: theme.textSecondary, maxWidth: 420, fontSize: 13 }}>
              Search. Filter. Open.
            </p>
          </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <UtilityButton onClick={handleRefresh} title={refreshing ? "Refreshing" : "Refresh"} isLoading={refreshing}>
                <RefreshCw size={15} style={{ opacity: 0.85 }} />
              </UtilityButton>

              <UtilityButton onClick={toggleTheme} title="Toggle theme">
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </UtilityButton>
              <UtilityButton onClick={handleLogout} title="Logout">
                <LogOut size={15} />
              </UtilityButton>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                color: theme.textSecondary,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              <UserRound size={16} />
              {session.name}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <ToggleButton
                active={showSummary}
                onClick={() => setShowSummary((value) => !value)}
                label="Metrics"
                icon={<BarChart3 size={16} />}
              />
              <ToggleButton
                active={showInsights}
                onClick={() => setShowInsights((value) => !value)}
                label="Insights"
                icon={<BarChart3 size={16} />}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2.2fr) minmax(220px, 1fr)",
              gap: 14,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 56,
                borderRadius: 999,
                border: `1px solid ${theme.border}`,
                background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.78)",
                padding: "0 18px",
                backdropFilter: "blur(10px)",
              }}
            >
              <Search size={18} style={{ color: theme.textMuted }} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search name, organisation, designation, ID, phone, or email"
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  color: theme.text,
                  fontSize: 15,
                }}
              />
            </label>
            {showSummary ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <StatPill label="CONTACTS" value={summary.shown} />
                <StatPill label="PHONE" value={summary.withPhone} />
                <StatPill label="EMAIL" value={summary.withEmail} />
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
              </div>
            )}
          </div>
        </section>

        {showInsights && (
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
                />
                <InsightCard
                  label="NEXT ACTION"
                  value={`${insightMetrics.nextActionRate}%`}
                  subtext="follow-up fields present"
                />
              </div>
            </div>

            {insightMetrics.states && insightMetrics.states.length > 0 && (
              <MiniChart
                title="State Spread"
                entries={insightMetrics.states}
                colorGetter={() => theme.primary}
              />
            )}

            {dataQuality.duplicateIdentity > 0 || dataQuality.duplicatePhone > 0 || dataQuality.duplicateEmail > 0 || dataQuality.incompleteContacts > 0 ? (
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
                  {dataQuality.duplicateIdentity > 0 && (
                    <div>⚠️ {dataQuality.duplicateIdentity} possible duplicates</div>
                  )}
                  {dataQuality.duplicatePhone > 0 && (
                    <div>📞 {dataQuality.duplicatePhone} shared phone numbers</div>
                  )}
                  {dataQuality.duplicateEmail > 0 && (
                    <div>✉️ {dataQuality.duplicateEmail} shared emails</div>
                  )}
                  {dataQuality.incompleteContacts > 0 && (
                    <div>❌ {dataQuality.incompleteContacts} missing contact info</div>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        )}

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
            options={[
              { value: "all", label: `All States (${summary.total})` },
              ...uniqueStates.map((value) => ({ value, label: value })),
            ]}
          />
          <FilterSelect
            label="Sector"
            value={sectorFilter}
            onChange={setSectorFilter}
            options={[
              { value: "all", label: "All Sectors" },
              ...uniqueSectors.map((value) => ({ value, label: value })),
            ]}
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
          />
        </section>

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
                const contactInfo = [item.mobile || item.officeNo, item.email].filter(Boolean);

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

        {selectedStakeholderForModal && <ContactModal stakeholder={selectedStakeholderForModal} onClose={() => setSelectedId(null)} />}
      </div>
    </div>
  );
}
