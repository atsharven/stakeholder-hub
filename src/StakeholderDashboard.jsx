import { fetchStakeholders } from './googleSheetsClient'
import { useState, useMemo, useEffect } from "react";
import { Users, AlertTriangle, CheckCircle2, Zap } from "lucide-react";

const theme = { bg: "#0d1117", card: "#161b22", border: "#21262d", text: "#e2e8f0", muted: "#8b949e", accentL: "#818cf8" };
const colors = { Government: "#818cf8", Political: "#a78bfa", "NGO/Civil Society": "#34d399", Corporate: "#60a5fa", Academic: "#f59e0b", Media: "#fb7185", Community: "#f97316", International: "#2dd4bf" };
const levelColors = { High: "#f87171", Medium: "#fbbf24", Low: "#34d399" };
const positionColors = { Supportive: "#34d399", Neutral: "#94a3b8", Resistant: "#f87171" };

// Reusable styles
const buttonStyle = (active = false) => ({ padding: "10px 20px", borderRadius: 8, border: `2px solid ${active ? theme.accentL : theme.border}`, background: active ? `${theme.accentL}22` : "transparent", color: active ? theme.accentL : theme.text, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" });
const labelStyle = { fontSize: 11, color: theme.muted, fontWeight: 600, marginBottom: 8 };
const dividerStyle = { paddingTop: 20, borderTop: `1px solid ${theme.border}` };

// UI Components
const Card = ({ children, style = {} }) => <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 28, ...style }}>{children}</div>;
const Section = ({ title, children }) => <div style={{ marginBottom: 40 }}><div style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 24 }}>{title}</div>{children}</div>;
const Badge = ({ label, color = theme.muted }) => <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${color}22`, color, border: `1px solid ${color}44` }}>{label}</span>;
const ProgressBar = ({ label, value, total, color }) => <div style={{ marginBottom: 16 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{label}</span><span style={{ fontSize: 16, fontWeight: 700, color }}>{value} ({Math.round(value/total * 100)}%)</span></div><div style={{ width: "100%", height: 12, background: theme.bg, borderRadius: 6, overflow: "hidden" }}><div style={{ width: `${(value/total) * 100}%`, height: "100%", background: color, transition: "width 0.4s" }} /></div></div>;


const MetricCard = ({ value, label, color, icon: Icon }) => <Card style={{ textAlign: "center" }}><Icon size={28} color={color} style={{ marginBottom: 12, opacity: 0.8 }} /><div style={{ fontSize: 44, fontWeight: 800, color, marginBottom: 8 }}>{value}</div><div style={{ fontSize: 13, color: theme.muted, fontWeight: 500 }}>{label}</div></Card>;
const TwoCol = ({ left, right }) => <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 40 }}>{left}{right}</div>;

export default function StakeholderDashboard() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    // Auto re-run search if active
    if (searchQuery.trim() !== "") {
      const result = data.find(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.id?.toLowerCase().includes(searchQuery.toLowerCase()));
      setSearchResults(result || null);
    }
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

  const filteredData = useMemo(() => {
    if (filter === "all") return data;
    if (filter === "influencers") return data.filter(s => s.influence === "High" && s.interest === "High");
    if (filter === "resistant") return data.filter(s => s.position === "Resistant");
    if (filter === "priority") return data.filter(s => s.priority === "High" && s.nextAction);
    return data;
  }, [data, filter]);
  const stats = useMemo(() => ({
    total: filteredData.length,
    supportive: filteredData.filter(s => s.position === "Supportive").length,
    highPriority: filteredData.filter(s => s.priority === "High").length,
    highInfluence: filteredData.filter(s => s.influence === "High").length,
  }), [filteredData]);

  const categoryBreakdown = useMemo(() => 
    Object.entries(filteredData.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {}))
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
  [filteredData]);

  const influenceInterestMatrix = useMemo(() => 
    filteredData.reduce((acc, s) => {
      acc[`${s.influence}-${s.interest}`] = (acc[`${s.influence}-${s.interest}`] || 0) + 1;
      return acc;
    }, {
      "High-High": 0, "High-Medium": 0, "High-Low": 0,
      "Medium-High": 0, "Medium-Medium": 0, "Medium-Low": 0,
      "Low-High": 0, "Low-Medium": 0, "Low-Low": 0,
    }),
  [filteredData]);

  const positionBreakdown = useMemo(() => {
    const counts = filteredData.reduce((acc, s) => {
      acc[s.position] = (acc[s.position] || 0) + 1;
      return acc;
    }, {});
    return [
      { name: "Supportive", value: counts.Supportive || 0, color: positionColors.Supportive },
      { name: "Neutral", value: counts.Neutral || 0, color: positionColors.Neutral },
      { name: "Resistant", value: counts.Resistant || 0, color: positionColors.Resistant },
    ];
  }, [filteredData]);

  const risks = useMemo(() => filteredData.filter(s => s.influence === "High" && s.interest === "Low"), [filteredData]);
  const allies = useMemo(() => filteredData.filter(s => s.influence === "Medium" && s.interest === "High"), [filteredData]);

  const entityTypeBreakdown = useMemo(() => {
    const counts = filteredData.reduce((acc, s) => {
      acc[s.entityType] = (acc[s.entityType] || 0) + 1;
      return acc;
    }, {});
    return { people: counts.Person || 0, institutions: counts.Institution || 0 };
  }, [filteredData]);

  const engagementScores = useMemo(() => {
    let totalScore = 0, highCount = 0;
    filteredData.forEach(s => {
      const influenceScore = s.influence === "High" ? 40 : s.influence === "Medium" ? 25 : 10;
      const interestScore = s.interest === "High" ? 30 : s.interest === "Medium" ? 15 : 5;
      const positionScore = s.position === "Supportive" ? 25 : s.position === "Neutral" ? 12 : 0;
      const score = Math.min(100, influenceScore + interestScore + positionScore);
      totalScore += score;
      if (score >= 75) highCount++;
    });
    const avg = filteredData.length > 0 ? Math.round(totalScore / filteredData.length) : 0;
    return { average: avg, high: highCount };
  }, [filteredData]);

  const actionTracking = useMemo(() => {
    const withActions = filteredData.filter(s => s.nextAction);
    return { total: withActions.length, rate: filteredData.length > 0 ? Math.round((withActions.length / filteredData.length) * 100) : 0 };
  }, [filteredData]);

  if (data.length === 0 && !error) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, color: theme.muted }}>Loading...</div>;

  if (error) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, padding: 24 }}>
        <Card style={{ maxWidth: 500 }}>
          <div style={{ color: "#f87171", fontSize: 18, fontWeight: 700, marginBottom: 12 }}>⚠️ Error Loading Data</div>
          <div style={{ color: theme.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            <strong>Sheet not accessible?</strong><br/>
            1. Make sure sheet is "Anyone with link"<br/>
            2. Right-click sheet → Share<br/>
            3. Hard refresh: Ctrl+Shift+R<br/>
            <pre style={{ background: theme.bg, padding: 10, borderRadius: 6, marginTop: 8, fontSize: 11, overflow: "auto" }}>{error.message}</pre>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ background: theme.bg, minHeight: "100vh", padding: 32, fontFamily: "system-ui", lineHeight: 1.6 }}>
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 44, fontWeight: 800, color: theme.text, marginBottom: 8 }}>Stakeholder <span style={{ color: theme.accentL }}>Engagement</span></h1>
            <p style={{ fontSize: 15, color: theme.muted, fontWeight: 500 }}>{data.length === 0 ? "No data loaded" : `${data.length} stakeholders • ${Math.max(new Set(data.map(s => s.category)).size, 1)} categories`}</p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} style={{ ...buttonStyle(), background: refreshing ? `${theme.accentL}22` : "transparent", cursor: refreshing ? "wait" : "pointer" }}>
            {refreshing ? "🔄 Updating..." : "🔄 Refresh"}
          </button>
        </div>

        {/* SEARCH SECTION */}
        {data.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <input type="text" placeholder="🔍 Search by name or ID" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} onKeyDown={handleKeyPress} style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `2px solid ${theme.border}`, background: theme.card, color: theme.text, fontSize: 14 }} onFocus={(e) => e.target.style.borderColor = theme.accentL} onBlur={(e) => e.target.style.borderColor = theme.border} autoFocus />
            {searchQuery && <button onClick={() => handleSearch("")} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: theme.muted, cursor: "pointer", fontSize: 18 }} title="Clear search (Esc)">✕</button>}
          </div>
        )}

        {/* SEARCH RESULTS - Full Stakeholder Profile or No Results */}
        {searchQuery && !searchResults && <div style={{ padding: 40, textAlign: "center", color: theme.muted, fontSize: 14 }}>✗ No stakeholder found. Try another name or ID.</div>}
        {searchResults && (
          <Section title={`🎯 Profile: ${searchResults.name} (${searchResults.id})`}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 40 }}>
              <Card>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={labelStyle}>ENTITY TYPE</div>
                    <Badge label={searchResults.entityType} color={searchResults.entityType === "Person" ? "#a78bfa" : "#60a5fa"} />
                  </div>
                  <div>
                    <div style={labelStyle}>CATEGORY</div>
                    <Badge label={searchResults.category} color={colors[searchResults.category] || theme.accentL} />
                  </div>
                  <div>
                    <div style={labelStyle}>INFLUENCE</div>
                    <Badge label={searchResults.influence} color={levelColors[searchResults.influence]} />
                  </div>
                  <div>
                    <div style={labelStyle}>INTEREST</div>
                    <Badge label={searchResults.interest} color={levelColors[searchResults.interest]} />
                  </div>
                  <div>
                    <div style={labelStyle}>POSITION</div>
                    <Badge label={searchResults.position} color={positionColors[searchResults.position]} />
                  </div>
                  <div>
                    <div style={labelStyle}>PRIORITY</div>
                    <Badge label={searchResults.priority} color={levelColors[searchResults.priority]} />
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                  <div>
                    <div style={labelStyle}>ORGANIZATION</div>
                    <div style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{searchResults.organization}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>ROLE</div>
                    <div style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{searchResults.role}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>STRATEGY</div>
                    <div style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{searchResults.strategy}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>OWNER</div>
                    <div style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{searchResults.owner}</div>
                  </div>
                </div>
              </Card>
            </div>
            <Card style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={labelStyle}>LAST INTERACTION</div>
                  <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{searchResults.lastInteraction || "—"}</div>
                </div>
                <div>
                  <div style={labelStyle}>NEXT ACTION</div>
                  <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{searchResults.nextAction || "—"}</div>
                </div>
                <div>
                  <div style={labelStyle}>ENGAGEMENT STRATEGY</div>
                  <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{searchResults.strategy || "—"}</div>
                </div>
              </div>
              {searchResults.notes && (
                <div style={dividerStyle}>
                  <div style={labelStyle}>NOTES</div>
                  <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.6 }}>{searchResults.notes}</div>
                </div>
              )}
            </Card>
            <button onClick={() => handleSearch("")} style={buttonStyle()}>← Back to Dashboard</button>
          </Section>
        )}

        {!searchResults && data.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[{ id: "all", label: `All (${data.length})` }, { id: "influencers", label: `High Influence (${data.filter(s => s.influence === "High" && s.interest === "High").length})` }, { id: "resistant", label: `Resistant (${data.filter(s => s.position === "Resistant").length})` }, { id: "priority", label: `Priority (${data.filter(s => s.priority === "High" && s.nextAction).length})` }].map(btn => <button key={btn.id} onClick={() => setFilter(btn.id)} style={buttonStyle(filter === btn.id)}>{btn.label}</button>)}
            </div>
          </div>
        )}

        {!searchResults && data.length > 0 && (
          <>
            {/* PRIMARY METRICS - BIG & BOLD */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 40 }}>
              <MetricCard key="total" value={stats.total} label="Total Stakeholders" icon={Users} color={theme.accentL} />
              <MetricCard key="high" value={stats.highPriority} label="High Priority" icon={AlertTriangle} color={levelColors.High} />
              <MetricCard key="supp" value={stats.supportive} label="Supportive" icon={CheckCircle2} color={positionColors.Supportive} />
              <MetricCard key="inf" value={stats.highInfluence} label="High Influence" icon={Zap} color="#fbbf24" />
            </div>

            {/* HEALTH DASHBOARD */}
            <TwoCol left={<Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 28 }}>📊 Health Score</div><div style={{ fontSize: 54, fontWeight: 800, color: engagementScores.average >= 70 ? "#34d399" : engagementScores.average >= 50 ? "#fbbf24" : "#f87171", marginBottom: 12 }}>{engagementScores.average}</div><div style={{ fontSize: 13, color: theme.muted, marginBottom: 24 }}>Avg engagement quality</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 24, borderTop: `1px solid ${theme.border}` }}><div><div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, fontWeight: 600 }}>ACTIONS</div><div style={{ fontSize: 32, fontWeight: 700, color: theme.accentL }}>{actionTracking.total}</div></div><div><div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, fontWeight: 600 }}>ENGAGEMENT</div><div style={{ fontSize: 32, fontWeight: 700, color: "#a78bfa" }}>{actionTracking.rate}%</div></div></div></Card>} right={<Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 28 }}>⚡ Engagement Rate</div><div style={{ fontSize: 54, fontWeight: 800, color: theme.accentL, marginBottom: 12 }}>{actionTracking.rate}%</div><div style={{ fontSize: 13, color: theme.muted, marginBottom: 24 }}>{actionTracking.total} stakeholders with next actions</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 24, borderTop: `1px solid ${theme.border}` }}><div><div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, fontWeight: 600 }}>HIGH SCORES</div><div style={{ fontSize: 32, fontWeight: 700, color: positionColors.Supportive }}>{engagementScores.high}</div></div><div><div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, fontWeight: 600 }}>SUPPORTIVE</div><div style={{ fontSize: 32, fontWeight: 700, color: "#f59e0b" }}>{stats.supportive}</div></div></div></Card>} />

            {/* INFLUENCE/INTEREST HEATMAP */}
            <Section title="🔥 Influence × Interest Heatmap">
              <Card>
                <div style={{ overflowX: "auto" }}>
                  <div style={{ minWidth: 650, display: "grid", gridTemplateColumns: "120px repeat(3, 1fr)", gap: 2, padding: 2, background: theme.border, borderRadius: 8, overflow: "hidden" }}>
                    {/* Header row */}
                    <div style={{ background: theme.card, padding: 14, fontSize: 11, fontWeight: 600, color: theme.muted, textAlign: "center" }}>INTEREST</div>
                    {["High", "Medium", "Low"].map(inf => <div key={inf} style={{ background: theme.card, padding: 14, fontSize: 11, fontWeight: 600, color: theme.muted, textAlign: "center" }}>Influence: {inf}</div>)}
                    
                    {/* Data rows */}
                    {["High", "Medium", "Low"].map(int => {
                      const maxCount = Math.max(...Object.values(influenceInterestMatrix));
                      return (
                        <div key={int} style={{ gridColumn: "1 / -1", display: "contents" }}>
                          <div style={{ background: theme.card, padding: 14, fontSize: 11, fontWeight: 600, color: theme.muted, textAlign: "center" }}>{int}</div>
                          {["High", "Medium", "Low"].map(inf => {
                            const count = influenceInterestMatrix[`${inf}-${int}`] || 0;
                            const intensity = maxCount > 0 ? count / maxCount : 0;
                            const bgColor = intensity === 0 ? theme.bg : `hsla(218, 90%, 50%, ${0.2 + intensity * 0.6})`;
                            return (
                              <div key={`${inf}-${int}`} style={{ background: bgColor, padding: 20, textAlign: "center", minHeight: 70, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 4 }}>
                                <div style={{ fontSize: 24, fontWeight: 800, color: intensity > 0.5 ? theme.text : theme.muted, marginBottom: 6 }}>{count}</div>
                                <div style={{ fontSize: 10, color: intensity > 0.5 ? theme.text : theme.muted, opacity: 0.8 }}>stakeholders</div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${theme.border}`, fontSize: 12, color: theme.muted }}>
                    <strong style={{ color: theme.text }}>Reading the matrix:</strong> Darker cells = more stakeholders. High/High = supporters, High/Low = risks, Low/High = potential allies.
                  </div>
                </div>
              </Card>
            </Section>

            {/* STRATEGIC BREAKDOWN */}
            <TwoCol left={<Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 20 }}>🎯 Positioning</div>{positionBreakdown.map(item => <ProgressBar key={item.name} label={item.name} value={item.value} total={stats.total} color={item.color} />)}</Card>} right={<Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 20 }}>📁 Categories</div>{categoryBreakdown.map(item => <ProgressBar key={item.name} label={item.name} value={item.value} total={stats.total} color={colors[item.name] || theme.accentL} />)}</Card>} />

            {/* RISK & ALLIES - CLICKABLE */}
            <TwoCol left={<Card style={{ cursor: "pointer" }} onClick={() => risks[0] && handleSearch(risks[0].name)}><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 16 }}>⚠️ Risks</div><div style={{ fontSize: 36, fontWeight: 800, color: "#f87171", marginBottom: 8 }}>{risks.length}</div><div style={{ fontSize: 13, color: theme.muted, marginBottom: 16 }}>Click to view details</div>{risks.length > 0 && <div style={{ fontSize: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>{risks.slice(0, 3).map(s => <div key={s.id} style={{ color: theme.text, marginBottom: 6, cursor: "pointer", padding: 6, borderRadius: 4, background: `${theme.bg}` }} onClick={(e) => { e.stopPropagation(); handleSearch(s.name); }}>→ {s.name}</div>)}</div>}</Card>} right={<Card style={{ cursor: "pointer" }} onClick={() => allies[0] && handleSearch(allies[0].name)}><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 16 }}>🤝 Allies</div><div style={{ fontSize: 36, fontWeight: 800, color: "#34d399", marginBottom: 8 }}>{allies.length}</div><div style={{ fontSize: 13, color: theme.muted, marginBottom: 16 }}>Click to view details</div>{allies.length > 0 && <div style={{ fontSize: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>{allies.slice(0, 3).map(s => <div key={s.id} style={{ color: theme.text, marginBottom: 6, cursor: "pointer", padding: 6, borderRadius: 4, background: `${theme.bg}` }} onClick={(e) => { e.stopPropagation(); handleSearch(s.name); }}>→ {s.name}</div>)}</div>}</Card>} />

            {/* TYPE ANALYSIS */}
            <Card style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 20 }}>👥 People vs Institutions</div>
              <ProgressBar label="Individuals" value={entityTypeBreakdown.people} total={stats.total} color="#a78bfa" />
              <ProgressBar label="Institutions" value={entityTypeBreakdown.institutions} total={stats.total} color="#60a5fa" />
            </Card>

            {/* TOP STAKEHOLDERS - Simplified */}
            <Section title="👥 Top Stakeholders">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                {filteredData.slice(0, 6).map(s => (
                  <Card key={s.id} style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 14 }}>
                      <div><h3 style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>{s.name}</h3><div style={{ fontSize: 12, color: theme.muted }}>{s.organization}</div></div>
                      <Badge label={s.category} color={colors[s.category] || theme.accentL} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${theme.border}` }}>
                      <div><div style={{ fontSize: 10, color: theme.muted, marginBottom: 4, fontWeight: 600 }}>INFLUENCE</div><Badge label={s.influence} color={levelColors[s.influence]} /></div>
                      <div><div style={{ fontSize: 10, color: theme.muted, marginBottom: 4, fontWeight: 600 }}>INTEREST</div><Badge label={s.interest} color={levelColors[s.interest]} /></div>
                    </div>
                    {s.nextAction && <div style={{ fontSize: 12, color: theme.muted, padding: 10, background: theme.bg, borderRadius: 6, borderLeft: `3px solid ${levelColors[s.priority]}` }}>📌 {s.nextAction}</div>}
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

