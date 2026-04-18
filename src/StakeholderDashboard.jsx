import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Copy,
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
  const [positionFilter, setPositionFilter] = useState("all");
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
    border: `1px solid ${theme.border}`,
    borderRadius: 20,
    boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.22)" : "0 18px 36px rgba(15, 23, 42, 0.06)",
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

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

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
      .filter((item) => positionFilter === "all" || item.position === positionFilter)
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
  }, [data, positionFilter, priorityFilter, searchQuery, sectorFilter, stateFilter]);

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
  }, [searchQuery, stateFilter, sectorFilter, priorityFilter, positionFilter]);

  const selectedStakeholder = useMemo(
    () => filteredStakeholders.find((item) => item.id === selectedId) || null,
    [filteredStakeholders, selectedId],
  );

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
    const missingContactCount = filteredStakeholders.filter(
      (item) => !item.mobile && !item.officeNo && !item.email,
    ).length;
    const nextActionReady = filteredStakeholders.filter(
      (item) => item.nextAction || item.nextActionDate,
    ).length;

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
      missingContactCount,
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

  const hasDuplicateIdentity = (item) =>
    filteredStakeholders.filter((candidate) => createIdentityKey(candidate) === createIdentityKey(item)).length > 1;

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

  const MiniChart = ({ title, entries, colorGetter }) => (
    <div
      style={{
        padding: 18,
        borderRadius: 16,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
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

    if (!loginForm.name.trim()) return;

    setSession({
      name: loginForm.name.trim(),
      phone: loginForm.phone.trim(),
      email: loginForm.email.trim().toLowerCase(),
      loginAt: new Date().toISOString(),
    });
  };

  const handleLogout = () => {
    setSession(null);
  };

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
              }}
            >
              Open Dashboard
            </button>
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
      <div style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gap: 20 }}>
        <section
          style={{
            ...surfaceStyle,
            padding: "24px clamp(18px, 3vw, 32px)",
            background: isDark
              ? "linear-gradient(135deg, rgba(31,31,31,1) 0%, rgba(22,22,22,1) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
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

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div
                style={{
                  height: 42,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  background: theme.surface,
                  color: theme.text,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 700,
                }}
              >
                <UserRound size={16} />
                {session.name}
              </div>
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
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  height: 42,
                  padding: "0 16px",
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  background: theme.surface,
                  color: theme.text,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: refreshing ? "wait" : "pointer",
                }}
              >
                <RefreshCw size={16} style={{ opacity: 0.85 }} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <button
                onClick={toggleTheme}
                style={{
                  height: 42,
                  width: 42,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  background: theme.surface,
                  color: theme.text,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
                title="Toggle theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={handleLogout}
                style={{
                  height: 42,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  background: theme.surface,
                  color: theme.text,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
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
                borderRadius: 16,
                border: `1px solid ${theme.border}`,
                background: theme.bg,
                padding: "0 16px",
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
                <StatPill label="SHOWN" value={summary.shown} />
                <StatPill label="HIGH" value={summary.highPriority} />
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
                <span>{summary.shown} shown</span>
                <span>{summary.withPhone} with phone</span>
                <span>{summary.withEmail} with email</span>
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
                gap: 12,
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
                Optional Insights
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{insightMetrics.engagementRate}%</div>
                <div style={{ color: theme.textSecondary, fontSize: 14 }}>
                  Engagement coverage based on last interaction or next-action data.
                </div>
              </div>
              <div style={{ display: "grid", gap: 8, color: theme.textSecondary, fontSize: 14 }}>
                <div>{insightMetrics.withNotes} stakeholders have notes</div>
                <div>{summary.highPriority} marked high priority</div>
                <div>{insightMetrics.nextActionRate}% have next actions logged</div>
              </div>
            </div>

            <MiniChart
              title="Position Mix"
              entries={insightMetrics.positions}
              colorGetter={getPositionColor}
            />
            <MiniChart
              title="State Spread"
              entries={insightMetrics.states}
              colorGetter={() => theme.primary}
            />
            <div
              style={{
                ...surfaceStyle,
                padding: 18,
                display: "grid",
                gap: 12,
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
                Data Quality
              </div>
              <div style={{ display: "grid", gap: 8, color: theme.textSecondary, fontSize: 14 }}>
                <div>{dataQuality.incompleteContacts} records missing both phone and email</div>
                <div>{dataQuality.duplicateIdentity} possible duplicate people/org entries</div>
                <div>{dataQuality.duplicatePhone} repeated phone numbers</div>
                <div>{dataQuality.duplicateEmail} repeated email addresses</div>
              </div>
            </div>
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
          <FilterSelect
            label="Position"
            value={positionFilter}
            onChange={setPositionFilter}
            options={[
              { value: "all", label: "All Positions" },
              { value: "Supportive", label: "Supportive" },
              { value: "Neutral", label: "Neutral" },
              { value: "Resistant", label: "Resistant" },
            ]}
          />
        </section>

        {(pinnedStakeholders.length > 0 || recentStakeholders.length > 0) && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            <div style={{ ...surfaceStyle, padding: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Pinned</div>
              {pinnedStakeholders.length === 0 ? (
                <div style={{ color: theme.textMuted, fontSize: 13 }}>No pinned contacts</div>
              ) : (
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {pinnedStakeholders.map((item) => (
                    <StakeholderChip key={item.id} item={item} pinned />
                  ))}
                </div>
              )}
            </div>

            <div style={{ ...surfaceStyle, padding: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Recently Viewed</div>
              {recentStakeholders.length === 0 ? (
                <div style={{ color: theme.textMuted, fontSize: 13 }}>No recent views</div>
              ) : (
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {recentStakeholders.map((item) => (
                    <StakeholderChip key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div style={{ ...surfaceStyle, overflow: "hidden", order: isMobile ? 2 : 1 }}>
            <div
              style={{
                padding: "18px 20px",
                borderBottom: `1px solid ${theme.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Stakeholders</div>
                <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
                  {summary.shown} results
                </div>
              </div>
              {(searchQuery || stateFilter !== "all" || sectorFilter !== "all" || priorityFilter !== "all" || positionFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStateFilter("all");
                    setSectorFilter("all");
                    setPriorityFilter("all");
                    setPositionFilter("all");
                    setSelectedId(null);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: theme.primary,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>

            <div
              style={{
                maxHeight: "calc(100vh - 290px)",
                overflowY: isMobile ? "visible" : "auto",
                padding: 12,
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
                  }}
                >
                  No stakeholders matched the current search and filters.
                </div>
              ) : (
                filteredStakeholders.map((item) => {
                  const active = item.id === selectedId;
                  const isHighlighted =
                    filteredStakeholders[highlightedIndex] && filteredStakeholders[highlightedIndex].id === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectStakeholder(item.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: `1px solid ${active ? theme.primary : isHighlighted ? theme.divider : theme.border}`,
                        background: active
                          ? `${theme.primary}10`
                          : isHighlighted
                            ? theme.surface
                            : "transparent",
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 10,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: theme.text }}>
                            {renderHighlightedText(item.name || "Unnamed stakeholder")}
                          </div>
                          <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 3 }}>
                            {renderHighlightedText(item.designation || "No designation")}{" "}
                            {item.organization ? (
                              <>
                                • {renderHighlightedText(item.organization)}
                              </>
                            ) : (
                              ""
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: theme.textMuted,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {renderHighlightedText(item.id)}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginTop: 12,
                        }}
                      >
                        {renderBadge(item.state, theme.primary)}
                        {renderBadge(item.category, getCategoryColor(item.category))}
                        {renderBadge(item.priority, getLevelColor(item.priority))}
                        {renderBadge(item.position, getPositionColor(item.position))}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                          gap: 10,
                          marginTop: 14,
                          fontSize: 13,
                        }}
                      >
                        <div
                          style={{
                            color: item.mobile || item.officeNo ? theme.textSecondary : theme.textMuted,
                            padding: "8px 10px",
                            borderRadius: 12,
                            background: theme.surface,
                            border: `1px solid ${theme.border}`,
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                            PHONE
                          </div>
                          <div>
                            {item.mobile || item.officeNo ? (
                              renderHighlightedText(item.mobile || item.officeNo)
                            ) : (
                              "No phone listed"
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            color: item.email ? theme.textSecondary : theme.textMuted,
                            padding: "8px 10px",
                            borderRadius: 12,
                            background: theme.surface,
                            border: `1px solid ${theme.border}`,
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                            EMAIL
                          </div>
                          <div>
                            {item.email ? renderHighlightedText(item.email) : "No email listed"}
                          </div>
                        </div>
                      </div>

                      {((!item.mobile && !item.officeNo) || !item.email || hasDuplicateIdentity(item)) ? (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            marginTop: 10,
                          }}
                        >
                          {!item.mobile && !item.officeNo && renderBadge("Missing phone", theme.danger)}
                          {!item.email && renderBadge("Missing email", theme.warning)}
                          {hasDuplicateIdentity(item) ? renderBadge("Possible duplicate", theme.warning) : null}
                        </div>
                      ) : null}
                      
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 12,
                          color: theme.textMuted,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>
                          Manager: {item.relManager ? renderHighlightedText(item.relManager) : "—"}
                        </span>
                        <span>
                          Next: {item.nextActionDate ? renderHighlightedText(item.nextActionDate) : "—"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div
            style={{
              ...surfaceStyle,
              position: isMobile ? "static" : "sticky",
              top: 20,
              overflow: "hidden",
              order: isMobile ? 1 : 2,
            }}
          >
            {selectedStakeholder ? (
              <>
                <div
                  style={{
                    padding: 24,
                    borderBottom: `1px solid ${theme.border}`,
                    background: isDark ? "rgba(255,255,255,0.02)" : "rgba(15,23,42,0.02)",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: theme.textMuted }}>
                    CONTACT CARD
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
                    {selectedStakeholder.name || "Unnamed stakeholder"}
                  </div>
                  <div style={{ color: theme.textSecondary, marginTop: 8, fontSize: 15 }}>
                    {selectedStakeholder.designation || "No designation"}
                    {selectedStakeholder.organization
                      ? ` • ${selectedStakeholder.organization}`
                      : ""}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                    {renderBadge(selectedStakeholder.state, theme.primary)}
                    {renderBadge(
                      selectedStakeholder.category,
                      getCategoryColor(selectedStakeholder.category),
                    )}
                    {renderBadge(
                      selectedStakeholder.sentiment,
                      getSentimentColor(selectedStakeholder.sentiment),
                    )}
                    {renderBadge(
                      selectedStakeholder.position,
                      getPositionColor(selectedStakeholder.position),
                    )}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <button
                      onClick={() => togglePinned(selectedStakeholder.id)}
                      style={{
                        border: `1px solid ${theme.border}`,
                        background: theme.surface,
                        color: pinnedIds.includes(selectedStakeholder.id) ? theme.warning : theme.text,
                        borderRadius: 12,
                        padding: "10px 14px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {pinnedIds.includes(selectedStakeholder.id) ? "Unpin" : "Pin"}
                    </button>
                  </div>
                </div>

                <div style={{ padding: 24, display: "grid", gap: 22 }}>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: theme.textMuted,
                        marginBottom: 10,
                      }}
                    >
                      Actions
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: 10,
                      }}
                    >
                    {selectedStakeholder.mobile && (
                      <a
                        href={`tel:${selectedStakeholder.mobile}`}
                        style={{
                          height: 44,
                          borderRadius: 12,
                          background: theme.primary,
                          color: isDark ? "#101214" : "#ffffff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          textDecoration: "none",
                          fontWeight: 800,
                        }}
                      >
                        <Phone size={16} />
                        Call
                      </a>
                    )}

                    {selectedStakeholder.email && (
                      <a
                        href={`mailto:${selectedStakeholder.email}`}
                        style={{
                          height: 44,
                          borderRadius: 12,
                          border: `1px solid ${theme.border}`,
                          background: theme.surface,
                          color: theme.text,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          textDecoration: "none",
                          fontWeight: 800,
                        }}
                      >
                        <Mail size={16} />
                        Email
                      </a>
                    )}

                    {(selectedStakeholder.mobile || selectedStakeholder.officeNo) && (
                      <button
                        onClick={() =>
                          handleCopy(
                            selectedStakeholder.mobile || selectedStakeholder.officeNo,
                            "Phone number",
                          )
                        }
                        style={{
                          height: 44,
                          borderRadius: 12,
                          border: `1px solid ${theme.border}`,
                          background: theme.surface,
                          color: theme.text,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        <Copy size={16} />
                        Copy
                      </button>
                    )}
                  </div>
                  </div>

                  {copyStatus && (
                    <div
                      style={{
                        fontSize: 13,
                        color: theme.primary,
                        fontWeight: 700,
                      }}
                    >
                      {copyStatus}
                    </div>
                  )}

                  <div
                    style={{
                      padding: 18,
                      borderRadius: 16,
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: theme.textMuted,
                        marginBottom: 12,
                      }}
                    >
                      Details
                    </div>
                    <div style={{ display: "grid", gap: 16 }}>
                      {[
                        ["Mobile", selectedStakeholder.mobile],
                        ["Office No.", selectedStakeholder.officeNo],
                        ["Email", selectedStakeholder.email],
                        ["Relationship Manager", selectedStakeholder.relManager],
                        ["Influence", selectedStakeholder.influence],
                        ["Interest", selectedStakeholder.interest],
                        ["Priority", selectedStakeholder.priority],
                        ["Last Interaction", selectedStakeholder.lastInteraction],
                        ["Next Action Date", selectedStakeholder.nextActionDate],
                        ["Next Action", selectedStakeholder.nextAction],
                      ].map(([label, value]) => (
                        <DetailRow key={label} label={label} value={value} />
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 18,
                      borderRadius: 16,
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: theme.textMuted,
                        marginBottom: 8,
                      }}
                    >
                      Notes
                    </div>
                    <div style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 1.7 }}>
                      {selectedStakeholder.notes || "No notes"}
                    </div>
                  </div>

                  {(selectedStakeholder.mobile ||
                    selectedStakeholder.officeNo ||
                    selectedStakeholder.email) && (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {(selectedStakeholder.mobile || selectedStakeholder.officeNo) && (
                        <a
                          href={`tel:${selectedStakeholder.mobile || selectedStakeholder.officeNo}`}
                          style={{
                            color: theme.primary,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontWeight: 700,
                          }}
                        >
                          <ArrowUpRight size={15} />
                          Open dialer
                        </a>
                      )}
                      {selectedStakeholder.email && (
                        <a
                          href={`mailto:${selectedStakeholder.email}`}
                          style={{
                            color: theme.primary,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontWeight: 700,
                          }}
                        >
                          <ArrowUpRight size={15} />
                          Open email draft
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: 28, color: theme.textMuted }}>
                Select a stakeholder to view the card.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
