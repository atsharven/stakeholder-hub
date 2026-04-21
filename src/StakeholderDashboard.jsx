import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bookmark,
  ChevronDown,
  ChevronUp,
  LogOut,
  LogIn,
  Mail,
  Moon,
  Phone,
  RefreshCw,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import { fetchStakeholders } from "./googleSheetsClient";
import { useTheme } from "./themeContext";
import {
  categoryColors,
  levelColors,
} from "./themeConstants";

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

const ContactModal = React.memo(function ContactModal({
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

  const handleGoogleLogin = useCallback((response) => {
    if (response?.credential) {
      try {
        // Decode JWT payload (NOTE: signature is verified by Google server)
        const parts = response.credential.split(".");
        if (parts.length !== 3) {
          throw new Error("Invalid JWT format");
        }

        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
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

        const pictureUrl = decodedToken.picture
          ? new URL(decodedToken.picture).href
          : "";

        const newSession = {
          name: sanitizeInput(decodedToken.name || decodedToken.email?.split("@")[0] || "User"),
          email: decodedToken.email || "",
          phone: "",
          picture: pictureUrl,
          loginAt: new Date().toISOString(),
          loginMethod: "google",
          iss: decodedToken.iss,
          sub: decodedToken.sub,
        };

        setSession(newSession);
        setAccountMessage("Signed in");
        setLoginForm({ name: "", phone: "", email: "" });
      } catch {
        if (isDev) {
          console.error("Google login error");
        }
        setError(new Error("Sign-in failed. Please try again."));
      }
    }
  }, [isDev]);

  // Initialize Google Sign-In with max retry limit
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
          if (isDev) {
            console.error("Google Sign-In init error");
          }
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(initGoogleSignIn, 500);
      } else {
        if (isDev) {
          console.warn("Google SDK not loaded after max retries");
        }
      }
    };

    initGoogleSignIn();
    return () => {
      mounted = false;
    };
  }, [handleGoogleLogin, isDev]);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds, but pause when contact modal is open
    const interval = setInterval(() => {
      if (!selectedId) {
        loadData();
      }
    }, 30000);
    return () => {
      clearInterval(interval);
    };
  }, [selectedId]);

  // Render Google Sign-In button with proper cleanup
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
              if (isDev) {
                console.error("Google button render error");
              }
            }
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [googleLoaded, useManualLogin, session, isDark, isDev]);

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
    const timeout = setTimeout(() => setAccountMessage(""), 2400);
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
      if (!item.state) return;
      counts.set(item.state, (counts.get(item.state) || 0) + 1);
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

  const stakeholderLookup = useMemo(
    () => new Map(data.map((item) => [item.id, item])),
    [data],
  );

  // Prevent modal from showing stale data when filteredStakeholders updates
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
    if (!selectedStillVisible) {
      setSelectedId(null);
    }
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
    const stateCounts = filteredStakeholders.reduce((acc, item) => {
      if (item.state) {
        acc[item.state] = (acc[item.state] || 0) + 1;
      }
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

  const FilterSelect = ({ label, value, onChange, options, onFocus, onBlur }) => (
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

  const handleLogin = (event) => {
    event.preventDefault();

    const name = sanitizeInput(loginForm.name);
    const email = sanitizeInput(loginForm.email);
    const phone = sanitizeInput(loginForm.phone);

    if (!name) {
      setError(new Error('Name is required'));
      return;
    }

    if (email && !email.includes('@')) {
      setError(new Error('Invalid email format'));
      return;
    }

    if (phone && !/^[+\d\s\-().]*$/.test(phone)) {
      setError(new Error('Invalid phone format'));
      return;
    }

    const newSession = {
      name,
      phone,
      email: email.toLowerCase(),
      loginAt: new Date().toISOString(),
      loginMethod: "manual",
    };
    
    setSession(newSession);
    setAccountMessage("Signed in");
    setLoginForm({ name: "", phone: "", email: "" });
    setError(null);
  };

  const handleLogout = () => {
    if (session?.loginMethod === "google" && typeof window !== "undefined" && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.revoke(session.email, () => {
          if (isDev) {
            console.debug("Google sign-out completed");
          }
        });
      } catch {
        if (isDev) {
          console.error("Google sign-out error");
        }
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
                  WRI Stakeholder Dashboard
                </h1>
                <p style={{ color: theme.textSecondary, maxWidth: 460, fontSize: 13 }}>
                  Search, filter, and open stakeholder details fast.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <ToggleButton
                  active={showSummary}
                  onClick={() => setShowSummary((value) => !value)}
                  label="Summary"
                  icon={<BarChart3 size={16} />}
                />
                <ToggleButton
                  active={showInsights}
                  onClick={() => setShowInsights((value) => !value)}
                  label="Insights"
                  icon={<BarChart3 size={16} />}
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
                    placeholder="Search name, organisation, phone, or email"
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
                    <span>{summary.highPriority} high priority</span>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                border: `1px solid ${theme.border}`,
                borderRadius: 22,
                padding: 16,
                background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.78)",
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div style={{ display: "grid", gap: 4 }}>
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
                    {session ? session.name : "Guest mode"}
                  </div>
                  <div style={{ color: theme.textMuted, fontSize: 12 }}>
                    {session ? `${savedViews.length} saved views` : "Sign in to save views and preferences"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <UtilityButton onClick={handleRefresh} title={refreshing ? "Refreshing" : "Refresh"} isLoading={refreshing}>
                    <RefreshCw size={15} style={{ opacity: 0.85 }} />
                  </UtilityButton>
                  <UtilityButton onClick={toggleTheme} title="Toggle theme">
                    {isDark ? <Sun size={15} /> : <Moon size={15} />}
                  </UtilityButton>
                  {session && (
                    <UtilityButton onClick={handleLogout} title="Logout">
                      <LogOut size={15} />
                    </UtilityButton>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <button
                  type="button"
                  onClick={handleSaveView}
                  style={{
                    height: 44,
                    borderRadius: 14,
                    border: `1px solid ${theme.border}`,
                    background: session ? theme.primary : "transparent",
                    color: session ? (isDark ? "#101214" : "#ffffff") : theme.text,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Bookmark size={15} />
                  Save dashboard
                </button>

                {!session && (
                  !useManualLogin && googleLoaded ? (
                    <>
                      <div
                        id="google-signin-button"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          minHeight: 42,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setUseManualLogin(true)}
                        style={{
                          height: 42,
                          borderRadius: 12,
                          border: `1px solid ${theme.border}`,
                          background: "transparent",
                          color: theme.textSecondary,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        <LogIn size={14} style={{ marginRight: 8 }} />
                        Use manual sign-in
                      </button>
                    </>
                  ) : (
                    <form onSubmit={handleLogin} style={{ display: "grid", gap: 10 }}>
                      {[
                        { key: "name", label: "Name", required: true, type: "text", placeholder: "Your name" },
                        { key: "email", label: "Email", required: false, type: "email", placeholder: "Optional email" },
                      ].map((field) => (
                        <label key={field.key} style={{ display: "grid", gap: 6 }}>
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
                              height: 42,
                              borderRadius: 12,
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
                          height: 42,
                          borderRadius: 12,
                          border: "none",
                          background: theme.primary,
                          color: isDark ? "#101214" : "#ffffff",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Sign in
                      </button>

                      {googleLoaded && (
                        <button
                          type="button"
                          onClick={() => setUseManualLogin(false)}
                          style={{
                            height: 40,
                            borderRadius: 12,
                            border: `1px solid ${theme.border}`,
                            background: "transparent",
                            color: theme.textSecondary,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          Back to Google sign-in
                        </button>
                      )}
                    </form>
                  )
                )}

                {accountMessage && (
                  <div
                    style={{
                      borderRadius: 12,
                      padding: "10px 12px",
                      background: `${theme.primary}12`,
                      border: `1px solid ${theme.primary}20`,
                      color: theme.textSecondary,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {accountMessage}
                  </div>
                )}

                {session && savedViews.length > 0 && (
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
                          }}
                        >
                          {view.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
            onFocus={() => setIsStateSelectFocused(true)}
            onBlur={() => setIsStateSelectFocused(false)}
            options={stateOptions}
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
