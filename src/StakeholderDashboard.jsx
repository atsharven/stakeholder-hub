import { fetchStakeholders } from './googleSheetsClient'
import { useState, useMemo, useEffect } from "react";
import { Users, AlertTriangle, CheckCircle2, Zap, Moon, Sun, ArrowUpDown } from "lucide-react";
import { useTheme, categoryColors, levelColors, positionColors, sentimentColors, relationshipColors } from './theme'

export default function StakeholderDashboard() {
  const { theme, isDark, toggleTheme } = useTheme();
  
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("dashboard"); // 'dashboard' or 'allStakeholders'
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  
  // Reusable style objects to minimize code
  const buttonStyle = (active = false) => ({
    padding: "10px 16px",
    borderRadius: 8,
    border: `2px solid ${active ? theme.primary : theme.border}`,
    background: active ? `${theme.primary}15` : "transparent",
    color: active ? theme.primary : theme.text,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  });
  const labelStyle = { fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" };
  const dividerStyle = { paddingTop: 20, borderTop: `1px solid ${theme.divider}` };
  
  // Color getters
  const getCatColor = (cat) => categoryColors[cat]?.[isDark ? 'dark' : 'light'] || theme.primary;
  const getLvlColor = (lvl) => levelColors[lvl]?.[isDark ? 'dark' : 'light'] || theme.warning;
  const getPosColor = (pos) => positionColors[pos]?.[isDark ? 'dark' : 'light'] || theme.text;
  const getSentColor = (sent) => sentimentColors[sent]?.[isDark ? 'dark' : 'light'] || theme.textMuted;
  const getRelColor = (rel) => relationshipColors[rel]?.[isDark ? 'dark' : 'light'] || theme.textMuted;
  
  // Reusable UI components
  const Card = ({ children, style = {}, hoverable = false, onClick = null }) => (
    <div
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        padding: 20,
        transition: "all 0.3s cubic-bezier(0.2, 0, 0.2, 1)",
        ...(hoverable && { cursor: "pointer" }),
        ...style
      }}
      onClick={onClick}
      onMouseEnter={hoverable ? (e) => {
        e.currentTarget.style.background = theme.cardHover;
        e.currentTarget.style.borderColor = theme.divider;
        e.currentTarget.style.boxShadow = isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)";
      } : null}
      onMouseLeave={hoverable ? (e) => {
        e.currentTarget.style.background = theme.card;
        e.currentTarget.style.borderColor = theme.border;
        e.currentTarget.style.boxShadow = "none";
      } : null}
    >
      {children}
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 24 }}>{title}</div>
      {children}
    </div>
  );

  const Badge = ({ label, color }) => (
    <span style={{
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 600,
      background: `${color}22`,
      color,
      border: `1px solid ${color}44`,
      whiteSpace: "nowrap"
    }}>
      {label}
    </span>
  );

  const ProgressBar = ({ label, value, total, color }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
        <span style={{ color: theme.text, fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value} ({Math.round(value / total * 100)}%)</span>
      </div>
      <div style={{ width: "100%", height: 12, background: theme.surface, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${(value / total) * 100}%`, height: "100%", background: color, transition: "width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
      </div>
    </div>
  );

  const MetricCard = ({ value, label, color, icon: Icon }) => (
    <Card style={{ textAlign: "center", padding: 16 }}>
      <Icon size={24} color={color} style={{ marginBottom: 8, opacity: 0.8 }} />
      <div style={{ fontSize: 44, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500 }}>{label}</div>
    </Card>
  );

  const ResponsiveLayout = ({ children }) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 40 }}>
      {children}
    </div>
  );

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      style={{
        padding: "8px 12px",
        borderRadius: "8px",
        border: `1px solid ${theme.border}`,
        background: theme.surface,
        color: theme.text,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.2s ease",
        fontSize: "13px",
        fontWeight: 500,
      }}
      onMouseEnter={(e) => {
        e.target.style.background = theme.cardHover;
        e.target.style.borderColor = theme.divider;
      }}
      onMouseLeave={(e) => {
        e.target.style.background = theme.surface;
        e.target.style.borderColor = theme.border;
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {isDark ? "Light" : "Dark"}
    </button>
  );

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchResults(null);
      return;
    }
    const result = data.find(s => s.name?.toLowerCase().includes(query.toLowerCase()) || s.id?.toLowerCase().includes(query.toLowerCase()));
    setSearchResults(result || null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Escape") handleSearch("");
  };

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const filteredData = useMemo(() => {
    let result = data;
    if (filter === "all") result = data;
    else if (filter === "influencers") result = data.filter(s => s.influence === "High" && s.interest === "High");
    else if (filter === "resistant") result = data.filter(s => s.position === "Resistant");
    else if (filter === "priority") result = data.filter(s => s.priority === "High" && s.nextAction);
    if (sentimentFilter !== "all") result = result.filter(s => s.sentiment === sentimentFilter);
    return result;
  }, [data, filter, sentimentFilter]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "name": aVal = a.name?.toLowerCase(); bVal = b.name?.toLowerCase(); break;
        case "org": aVal = a.organization?.toLowerCase(); bVal = b.organization?.toLowerCase(); break;
        case "category": aVal = a.category?.toLowerCase(); bVal = b.category?.toLowerCase(); break;
        case "influence": aVal = { "High": 3, "Medium": 2, "Low": 1 }[a.influence]; bVal = { "High": 3, "Medium": 2, "Low": 1 }[b.influence]; break;
        case "interest": aVal = { "High": 3, "Medium": 2, "Low": 1 }[a.interest]; bVal = { "High": 3, "Medium": 2, "Low": 1 }[b.interest]; break;
        case "position": aVal = { "Supportive": 3, "Neutral": 2, "Resistant": 1 }[a.position]; bVal = { "Supportive": 3, "Neutral": 2, "Resistant": 1 }[b.position]; break;
        default: return 0;
      }
      if (aVal === undefined) aVal = "";
      if (bVal === undefined) bVal = "";
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortBy, sortDir]);

  const stats = useMemo(() => {
    const counts = filteredData.reduce((acc, s) => ({
      supportive: acc.supportive + (s.position === "Supportive" ? 1 : 0),
      highPriority: acc.highPriority + (s.priority === "High" ? 1 : 0),
      highInfluence: acc.highInfluence + (s.influence === "High" ? 1 : 0),
    }), { supportive: 0, highPriority: 0, highInfluence: 0 });
    return { total: filteredData.length, ...counts };
  }, [filteredData]);

  const categoryBreakdown = useMemo(() =>
    Object.entries(filteredData.reduce((acc, s) => ({ ...acc, [s.category]: (acc[s.category] || 0) + 1 }), {}))
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    [filteredData]
  );

  const positionBreakdown = useMemo(() => {
    const counts = filteredData.reduce((acc, s) => ({ ...acc, [s.position]: (acc[s.position] || 0) + 1 }), {});
    return [
      { name: "Supportive", value: counts.Supportive || 0, color: getPosColor("Supportive") },
      { name: "Neutral", value: counts.Neutral || 0, color: getPosColor("Neutral") },
      { name: "Resistant", value: counts.Resistant || 0, color: getPosColor("Resistant") },
    ];
  }, [filteredData, isDark]);

  const risks = useMemo(() => filteredData.filter(s => s.influence === "High" && s.interest === "Low"), [filteredData]);
  const allies = useMemo(() => filteredData.filter(s => s.influence === "Medium" && s.interest === "High"), [filteredData]);

  const engagementScores = useMemo(() => {
    const result = filteredData.reduce((acc, s) => {
      const influenceScore = s.influence === "High" ? 40 : s.influence === "Medium" ? 25 : 10;
      const interestScore = s.interest === "High" ? 30 : s.interest === "Medium" ? 15 : 5;
      const positionScore = s.position === "Supportive" ? 25 : s.position === "Neutral" ? 12 : 0;
      const score = Math.min(100, influenceScore + interestScore + positionScore);
      return {
        totalScore: acc.totalScore + score,
        highCount: acc.highCount + (score >= 75 ? 1 : 0),
      };
    }, { totalScore: 0, highCount: 0 });
    const avg = filteredData.length > 0 ? Math.round(result.totalScore / filteredData.length) : 0;
    return { average: avg, high: result.highCount };
  }, [filteredData]);

  const actionTracking = useMemo(() => {
    const withActions = filteredData.filter(s => s.nextAction);
    return { total: withActions.length, rate: filteredData.length > 0 ? Math.round((withActions.length / filteredData.length) * 100) : 0 };
  }, [filteredData]);

  if (data.length === 0 && !error) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, color: theme.textMuted }}>Loading...</div>;

  if (error) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, padding: 24 }}>
        <Card style={{ maxWidth: 500 }}>
          <div style={{ color: theme.danger, fontSize: 18, fontWeight: 700, marginBottom: 12 }}>⚠️ Error Loading Data</div>
          <div style={{ color: theme.textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            <strong>Sheet not accessible?</strong><br/>
            1. Make sure sheet is "Anyone with link"<br/>
            2. Right-click sheet → Share<br/>
            3. Hard refresh: Ctrl+Shift+R<br/>
            <pre style={{ background: theme.surface, padding: 10, borderRadius: 6, marginTop: 8, fontSize: 11, overflow: "auto", color: theme.text }}>{error.message}</pre>
          </div>
        </Card>
      </div>
    );
  }

  // SortHeader component for table column headers
  const SortHeader = ({ column, label }) => (
    <button
      onClick={() => toggleSort(column)}
      style={{
        background: "none",
        border: "none",
        color: sortBy === column ? theme.primary : theme.textMuted,
        fontSize: 12,
        fontWeight: sortBy === column ? 700 : 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.2s ease",
        padding: 0,
      }}
    >
      {label}
      {sortBy === column &&<ArrowUpDown size={14} style={{ transform: sortDir === "desc" ? "scaleY(-1)" : "scaleY(1)" }} />}
    </button>
  );

  return (
    <div style={{ background: theme.bg, minHeight: "100vh", padding: "24px 16px", fontFamily: "system-ui", lineHeight: 1.6 }}>
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 40, flexWrap: "wrap", gap: 20 }}>
          <div>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 800, color: theme.text, marginBottom: 8 }}>Stakeholder <span style={{ color: theme.primary }}>Engagement</span></h1>
            <p style={{ fontSize: 15, color: theme.textMuted, fontWeight: 500 }}>{data.length === 0 ? "No data loaded" : `${data.length} stakeholders • ${Math.max(new Set(data.map(s => s.category)).size, 1)} categories`}</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {data.length > 0 && (
              <div style={{ display: "flex", gap: 8, background: theme.surface, padding: 4, borderRadius: 8, border: `1px solid ${theme.border}` }}>
                {[{ id: "dashboard", label: "📊 Dashboard" }, { id: "allStakeholders", label: `📋 All (${data.length})` }].map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => { setViewMode(btn.id); setSearchResults(null); }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "none",
                      background: viewMode === btn.id ? theme.primary : "transparent",
                      color: viewMode === btn.id ? theme.bg : theme.text,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== btn.id) {
                        e.target.style.background = theme.hover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== btn.id) {
                        e.target.style.background = "transparent";
                      }
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
            <button onClick={handleRefresh} disabled={refreshing} style={{ ...buttonStyle(), background: refreshing ? `${theme.primary}22` : "transparent", cursor: refreshing ? "wait" : "pointer" }}>
              {refreshing ? "🔄 Updating..." : "🔄 Refresh"}
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* SEARCH SECTION - Only in dashboard view */}
        {viewMode === "dashboard" && data.length > 0 && (
          <div style={{ marginBottom: 40, position: "relative" }}>
            <input type="text" placeholder="🔍 Search by name or ID" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} onKeyDown={handleKeyPress} style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `2px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: 14, transition: "all 0.2s ease" }} onFocus={(e) => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = isDark ? "0 0 0 3px rgba(138,180,248,0.1)" : "0 0 0 3px rgba(31,113,184,0.1)"; }} onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }} autoFocus />
            {searchQuery && <button onClick={() => handleSearch("")} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: 18, transition: "all 0.2s ease" }} onMouseEnter={(e) => e.target.style.color = theme.text} onMouseLeave={(e) => e.target.style.color = theme.textMuted} title="Clear search (Esc)">✕</button>}
          </div>
        )}

        {/* SEARCH RESULTS - Only in dashboard view */}
        {viewMode === "dashboard" && searchQuery && !searchResults && <div style={{ padding: 40, textAlign: "center", color: theme.textMuted, fontSize: 14 }}>✗ No stakeholder found. Try another name or ID.</div>}
        
        {viewMode === "dashboard" && searchResults && (
          <Section title={`🎯 Profile: ${searchResults.name} (${searchResults.id})`}>
            <ResponsiveLayout>
              <Card>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><div style={labelStyle}>ENTITY TYPE</div><Badge label={searchResults.entityType} color={searchResults.entityType === "Person" ? theme.secondary : theme.info} /></div>
                  <div><div style={labelStyle}>CATEGORY</div><Badge label={searchResults.category} color={getCatColor(searchResults.category)} /></div>
                  <div><div style={labelStyle}>INFLUENCE</div><Badge label={searchResults.influence} color={getLvlColor(searchResults.influence)} /></div>
                  <div><div style={labelStyle}>INTEREST</div><Badge label={searchResults.interest} color={getLvlColor(searchResults.interest)} /></div>
                  <div><div style={labelStyle}>SENTIMENT</div><Badge label={searchResults.sentiment || "Neutral"} color={getSentColor(searchResults.sentiment || "Neutral")} /></div>
                  <div><div style={labelStyle}>POSITION</div><Badge label={searchResults.position} color={getPosColor(searchResults.position)} /></div>
                  <div><div style={labelStyle}>RELATIONSHIP</div><Badge label={searchResults.relationshipWithProject || "—"} color={getRelColor(searchResults.relationshipWithProject) || theme.textMuted} /></div>
                  <div><div style={labelStyle}>PRIORITY</div><Badge label={searchResults.priority} color={getLvlColor(searchResults.priority)} /></div>
                </div>
              </Card>
              <Card>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                  <div><div style={labelStyle}>ORGANIZATION</div><div style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{searchResults.organization}</div></div>
                  <div><div style={labelStyle}>ROLE</div><div style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{searchResults.role}</div></div>
                  <div><div style={labelStyle}>STRATEGY</div><div style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{searchResults.strategy}</div></div>
                  <div><div style={labelStyle}>OWNER</div><div style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{searchResults.owner}</div></div>
                </div>
              </Card>
            </ResponsiveLayout>

            {(searchResults.contactPerson || searchResults.email || searchResults.phone) && (
              <Card style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 16 }}>📱 Contact Information</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                  {searchResults.contactPerson && <div><div style={labelStyle}>CONTACT PERSON</div><div style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{searchResults.contactPerson}</div></div>}
                  {searchResults.email && <div><div style={labelStyle}>EMAIL</div><a href={`mailto:${searchResults.email}`} style={{ fontSize: 14, color: theme.primary, textDecoration: "none", transition: "all 0.2s ease", cursor: "pointer" }} onMouseEnter={(e) => { e.target.style.color = theme.primaryDark; e.target.style.textDecoration = "underline"; }} onMouseLeave={(e) => { e.target.style.color = theme.primary; e.target.style.textDecoration = "none"; }}>{searchResults.email}</a></div>}
                  {searchResults.phone && <div><div style={labelStyle}>PHONE</div><a href={`tel:${searchResults.phone}`} style={{ fontSize: 14, color: theme.primary, textDecoration: "none", transition: "all 0.2s ease", cursor: "pointer", wordBreak: "break-all" }} onMouseEnter={(e) => { e.target.style.color = theme.primaryDark; e.target.style.textDecoration = "underline"; }} onMouseLeave={(e) => { e.target.style.color = theme.primary; e.target.style.textDecoration = "none"; }}>{searchResults.phone}</a></div>}
                </div>
              </Card>
            )}

            <Card style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
                <div><div style={labelStyle}>LAST INTERACTION</div><div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{searchResults.lastInteraction || "—"}</div></div>
                <div><div style={labelStyle}>NEXT ACTION</div><div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{searchResults.nextAction || "—"}</div></div>
                <div><div style={labelStyle}>ENGAGEMENT STRATEGY</div><div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{searchResults.strategy || "—"}</div></div>
              </div>
              {searchResults.notes && (
                <div style={dividerStyle}>
                  <div style={labelStyle}>NOTES</div>
                  <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.6 }}>{searchResults.notes}</div>
                </div>
              )}
            </Card>
            <button onClick={() => handleSearch("")} style={{ ...buttonStyle(), marginTop: 20 }}>← Back to Dashboard</button>
          </Section>
        )}

        {/* ALL STAKEHOLDERS VIEW */}
        {viewMode === "allStakeholders" && (
          <Section title="📋 Complete Stakeholder Index">
            <Card>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${theme.divider}`, background: theme.surface }}>
                      <td style={{ padding: "12px 8px", textAlign: "left" }}><SortHeader column="name" label="Name" /></td>
                      <td style={{ padding: "12px 8px", textAlign: "left" }}><SortHeader column="org" label="Organization" /></td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}><SortHeader column="category" label="Category" /></td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}><SortHeader column="influence" label="Influence" /></td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}><SortHeader column="interest" label="Interest" /></td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}><SortHeader column="position" label="Position" /></td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>Sentiment</td>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((s, idx) => (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: `1px solid ${theme.border}`,
                          background: idx % 2 === 0 ? "transparent" : theme.surface,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onClick={() => handleSearch(s.name)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = theme.cardHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : theme.surface; }}
                      >
                        <td style={{ padding: "12px 8px" }}><strong style={{ color: theme.primary }}>{s.name}</strong></td>
                        <td style={{ padding: "12px 8px", color: theme.textMuted, fontSize: 12 }}>{s.organization || "—"}</td>
                        <td style={{ padding: "12px 8px", textAlign: "center" }}><Badge label={s.category} color={getCatColor(s.category)} /></td>
                        <td style={{ padding: "12px 8px", textAlign: "center" }}><Badge label={s.influence} color={getLvlColor(s.influence)} /></td>
                        <td style={{ padding: "12px 8px", textAlign: "center" }}><Badge label={s.interest} color={getLvlColor(s.interest)} /></td>
                        <td style={{ padding: "12px 8px", textAlign: "center" }}><Badge label={s.position} color={getPosColor(s.position)} /></td>
                        <td style={{ padding: "12px 8px", textAlign: "center" }}><Badge label={s.sentiment || "Neutral"} color={getSentColor(s.sentiment || "Neutral")} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.border}`, fontSize: 12, color: theme.textMuted }}>
                <strong style={{ color: theme.text }}>Total:</strong> {sortedData.length} stakeholders (matching your filters)
              </div>
            </Card>
          </Section>
        )}

        {/* DASHBOARD VIEW */}
        {viewMode === "dashboard" && !searchResults && data.length > 0 && (
          <>
            {/* FILTERS */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 8 }}>CATEGORY FILTER</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[{ id: "all", label: `All (${data.length})` }, { id: "influencers", label: `High Influence (${data.filter(s => s.influence === "High" && s.interest === "High").length})` }, { id: "resistant", label: `Resistant (${data.filter(s => s.position === "Resistant").length})` }, { id: "priority", label: `Priority (${data.filter(s => s.priority === "High" && s.nextAction).length})` }].map(btn => <button key={btn.id} onClick={() => setFilter(btn.id)} style={buttonStyle(filter === btn.id)}>{btn.label}</button>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 8 }}>SENTIMENT FILTER</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[{ id: "all", label: `All` }, { id: "Positive", label: `🟢 Positive (${data.filter(s => s.sentiment === "Positive").length})` }, { id: "Neutral", label: `🟡 Neutral (${data.filter(s => s.sentiment === "Neutral").length})` }, { id: "Negative", label: `🔴 Negative (${data.filter(s => s.sentiment === "Negative").length})` }].map(btn => <button key={btn.id} onClick={() => setSentimentFilter(btn.id)} style={buttonStyle(sentimentFilter === btn.id)}>{btn.label}</button>)}
                </div>
              </div>
            </div>

            {/* PRIMARY METRICS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 40 }}>
              <MetricCard key="total" value={stats.total} label="Total Stakeholders" icon={Users} color={theme.primary} />
              <MetricCard key="high" value={stats.highPriority} label="High Priority" icon={AlertTriangle} color={getLvlColor("High")} />
              <MetricCard key="supp" value={stats.supportive} label="Supportive" icon={CheckCircle2} color={getPosColor("Supportive")} />
              <MetricCard key="inf" value={stats.highInfluence} label="High Influence" icon={Zap} color={theme.warning} />
            </div>

            {/* HEALTH DASHBOARD */}
            <ResponsiveLayout>
              <Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 28 }}>📊 Health Score</div><div style={{ fontSize: 54, fontWeight: 800, color: engagementScores.average >= 70 ? theme.success : engagementScores.average >= 50 ? theme.warning : theme.danger, marginBottom: 12 }}>{engagementScores.average}</div><div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 24 }}>Avg engagement quality</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 24, borderTop: `1px solid ${theme.divider}` }}><div><div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, fontWeight: 600 }}>ACTIONS</div><div style={{ fontSize: 32, fontWeight: 700, color: theme.primary }}>{actionTracking.total}</div></div><div><div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, fontWeight: 600 }}>ENGAGEMENT</div><div style={{ fontSize: 32, fontWeight: 700, color: theme.secondary }}>{actionTracking.rate}%</div></div></div></Card>
              <Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 28 }}>⚡ Engagement Rate</div><div style={{ fontSize: 54, fontWeight: 800, color: theme.primary, marginBottom: 12 }}>{actionTracking.rate}%</div><div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 24 }}>{actionTracking.total} stakeholders with next actions</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 24, borderTop: `1px solid ${theme.divider}` }}><div><div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, fontWeight: 600 }}>HIGH SCORES</div><div style={{ fontSize: 32, fontWeight: 700, color: getPosColor("Supportive") }}>{engagementScores.high}</div></div><div><div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, fontWeight: 600 }}>SUPPORTIVE</div><div style={{ fontSize: 32, fontWeight: 700, color: theme.warning }}>{stats.supportive}</div></div></div></Card>
            </ResponsiveLayout>

            {/* STRATEGIC BREAKDOWN */}
            <ResponsiveLayout>
              <Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 20 }}>🎯 Positioning</div>{positionBreakdown.map(item => <ProgressBar key={item.name} label={item.name} value={item.value} total={stats.total} color={item.color} />)}</Card>
              <Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 20 }}>📁 Categories</div>{categoryBreakdown.map(item => <ProgressBar key={item.name} label={item.name} value={item.value} total={stats.total} color={getCatColor(item.name)} />)}</Card>
            </ResponsiveLayout>

            {/* RISK & ALLIES */}
            <ResponsiveLayout>
              <Card style={{ cursor: "pointer" }} onClick={() => risks[0] && handleSearch(risks[0].name)} hoverable><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 16 }}>⚠️ Risks</div><div style={{ fontSize: 36, fontWeight: 800, color: theme.danger, marginBottom: 8 }}>{risks.length}</div><div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 16 }}>{risks.length > 0 ? "Click to view details" : "No risks found"}</div>{risks.length > 0 && <div style={{ fontSize: 12, paddingTop: 12, borderTop: `1px solid ${theme.divider}` }}>{risks.slice(0, 3).map(s => <div key={s.id} style={{ color: theme.text, marginBottom: 6, cursor: "pointer", padding: 6, borderRadius: 4, background: theme.surface }} onClick={(e) => { e.stopPropagation(); handleSearch(s.name); }} onMouseEnter={(e) => e.currentTarget.style.background = theme.hover} onMouseLeave={(e) => e.currentTarget.style.background = theme.surface}>→ {s.name}</div>)}</div>}</Card>
              <Card style={{ cursor: "pointer" }} onClick={() => allies[0] && handleSearch(allies[0].name)} hoverable><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 16 }}>🤝 Allies</div><div style={{ fontSize: 36, fontWeight: 800, color: theme.success, marginBottom: 8 }}>{allies.length}</div><div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 16 }}>{allies.length > 0 ? "Click to view details" : "No allies found"}</div>{allies.length > 0 && <div style={{ fontSize: 12, paddingTop: 12, borderTop: `1px solid ${theme.divider}` }}>{allies.slice(0, 3).map(s => <div key={s.id} style={{ color: theme.text, marginBottom: 6, cursor: "pointer", padding: 6, borderRadius: 4, background: theme.surface }} onClick={(e) => { e.stopPropagation(); handleSearch(s.name); }} onMouseEnter={(e) => e.currentTarget.style.background = theme.hover} onMouseLeave={(e) => e.currentTarget.style.background = theme.surface}>→ {s.name}</div>)}</div>}</Card>
            </ResponsiveLayout>

            {/* TOP STAKEHOLDERS */}
            <Section title="👥 Top Stakeholders">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                {filteredData.slice(0, 6).map(s => (
                  <Card key={s.id} style={{ cursor: "pointer" }} onClick={() => handleSearch(s.name)} hoverable>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 14 }}>
                      <div><h3 style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>{s.name}</h3><div style={{ fontSize: 12, color: theme.textMuted }}>{s.organization}</div></div>
                      <div style={{ display: "flex", gap: 6, flexDirection: "column", alignItems: "flex-end" }}><Badge label={s.category} color={getCatColor(s.category)} /><Badge label={s.sentiment || "Neutral"} color={getSentColor(s.sentiment || "Neutral")} /></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${theme.divider}` }}>
                      <div><div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 4, fontWeight: 600 }}>INFLUENCE</div><Badge label={s.influence} color={getLvlColor(s.influence)} /></div>
                      <div><div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 4, fontWeight: 600 }}>INTEREST</div><Badge label={s.interest} color={getLvlColor(s.interest)} /></div>
                      <div><div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 4, fontWeight: 600 }}>POSITION</div><Badge label={s.position} color={getPosColor(s.position)} /></div>
                    </div>
                    {s.nextAction && <div style={{ fontSize: 12, color: theme.textMuted, padding: 10, background: theme.surface, borderRadius: 6, borderLeft: `3px solid ${getLvlColor(s.priority)}` }}>📌 {s.nextAction}</div>}
                  </Card>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
