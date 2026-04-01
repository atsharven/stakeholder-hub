import { fetchStakeholders } from './googleSheetsClient'
import { useState, useMemo, useEffect } from "react";
import { Users, AlertTriangle, CheckCircle2, Zap } from "lucide-react";

const theme = { bg: "#0d1117", card: "#161b22", border: "#21262d", text: "#e2e8f0", muted: "#8b949e", accentL: "#818cf8" };
const colors = { Government: "#818cf8", Political: "#a78bfa", "NGO/Civil Society": "#34d399", Corporate: "#60a5fa", Academic: "#f59e0b", Media: "#fb7185", Community: "#f97316", International: "#2dd4bf" };
const levelColors = { High: "#f87171", Medium: "#fbbf24", Low: "#34d399" };
const positionColors = { Supportive: "#34d399", Neutral: "#94a3b8", Resistant: "#f87171" };

const Card = ({ children, style = {} }) => <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 28, ...style }}>{children}</div>;
const Section = ({ title, children }) => <div style={{ marginBottom: 40 }}><div style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 24 }}>{title}</div>{children}</div>;
const MetricCard = ({ value, label, color, icon: Icon }) => <div style={{ background: theme.bg, borderRadius: 12, padding: 24, border: `1px solid ${theme.border}`, textAlign: "center" }}><Icon size={28} color={color} style={{ marginBottom: 12, opacity: 0.8 }} /><div style={{ fontSize: 44, fontWeight: 800, color, marginBottom: 8 }}>{value}</div><div style={{ fontSize: 13, color: theme.muted, fontWeight: 500 }}>{label}</div></div>;
const MetricGrid = ({ items, cols = 2 }) => <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 20, marginBottom: 40 }}>{items}</div>;
const Badge = ({ label, color = theme.muted }) => <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${color}22`, color, border: `1px solid ${color}44` }}>{label}</span>;
const ProgressBar = ({ label, value, total, color }) => <div style={{ marginBottom: 16 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{label}</span><span style={{ fontSize: 16, fontWeight: 700, color }}>{value} ({Math.round(value/total * 100)}%)</span></div><div style={{ width: "100%", height: 12, background: theme.bg, borderRadius: 6, overflow: "hidden" }}><div style={{ width: `${(value/total) * 100}%`, height: "100%", background: color, transition: "width 0.4s" }} /></div></div>;
const TwoCol = ({ left, right }) => <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 40 }}>{left}{right}</div>;


export default function StakeholderDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const stakeholders = await fetchStakeholders();
        setData(stakeholders);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
    resistant: filteredData.filter(s => s.position === "Resistant").length,
    highPriority: filteredData.filter(s => s.priority === "High").length,
    highInfluence: filteredData.filter(s => s.influence === "High").length,
    highInterest: filteredData.filter(s => s.interest === "High").length,
  }), [filteredData]);

  const categoryBreakdown = useMemo(() => {
    const cats = {};
    filteredData.forEach(s => {
      cats[s.category] = (cats[s.category] || 0) + 1;
    });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const priorityBreakdown = useMemo(() => {
    const prio = { High: 0, Medium: 0, Low: 0 };
    filteredData.forEach(s => {
      if (prio.hasOwnProperty(s.priority)) prio[s.priority]++;
    });
    return [
      { name: "High", value: prio.High, color: levelColors.High },
      { name: "Medium", value: prio.Medium, color: levelColors.Medium },
      { name: "Low", value: prio.Low, color: levelColors.Low },
    ];
  }, [filteredData]);

  const influenceInterestMatrix = useMemo(() => {
    const matrix = {
      "High-High": 0,
      "High-Medium": 0,
      "High-Low": 0,
      "Medium-High": 0,
      "Medium-Medium": 0,
      "Medium-Low": 0,
      "Low-High": 0,
      "Low-Medium": 0,
      "Low-Low": 0,
    };
    filteredData.forEach(s => {
      const key = `${s.influence}-${s.interest}`;
      if (matrix.hasOwnProperty(key)) matrix[key]++;
    });
    return matrix;
  }, [filteredData]);

  const positionBreakdown = useMemo(() => {
    const pos = { Supportive: 0, Neutral: 0, Resistant: 0 };
    filteredData.forEach(s => {
      if (pos.hasOwnProperty(s.position)) pos[s.position]++;
    });
    return [
      { name: "Supportive", value: pos.Supportive, color: positionColors.Supportive },
      { name: "Neutral", value: pos.Neutral, color: positionColors.Neutral },
      { name: "Resistant", value: pos.Resistant, color: positionColors.Resistant },
    ];
  }, [filteredData]);

  const recentInteractions = useMemo(() => {
    return [...filteredData]
      .filter(s => s.lastInteraction)
      .sort((a, b) => b.lastInteraction.localeCompare(a.lastInteraction))
      .slice(0, 5);
  }, [filteredData]);

  const upcomingActions = useMemo(() => {
    return [...filteredData]
      .filter(s => s.nextAction)
      .sort((a, b) => (a.priority === "High" ? -1 : 1))
      .slice(0, 5);
  }, [filteredData]);

  const risks = useMemo(() => filteredData.filter(s => s.influence === "High" && s.interest === "Low"), [filteredData]);
  const allies = useMemo(() => filteredData.filter(s => s.influence === "Medium" && s.interest === "High"), [filteredData]);

  const peopleVsInstitutions = useMemo(() => {
    const people = filteredData.filter(s => !s.organization || s.organization.toLowerCase().includes('self') || s.organization.toLowerCase().includes('individual')).length;
    return { people, institutions: filteredData.length - people };
  }, [filteredData]);

  const policyVsImplementation = useMemo(() => {
    const policy = filteredData.filter(s => s.role && (s.role.toLowerCase().includes('minister') || s.role.toLowerCase().includes('policy') || s.role.toLowerCase().includes('director'))).length;
    return { policy, implementation: Math.max(0, filteredData.length - policy) };
  }, [filteredData]);

  // NEW: Engagement Scoring (0-100)
  const engagementScores = useMemo(() => {
    const scores = filteredData.map(s => {
      const influenceScore = s.influence === "High" ? 40 : s.influence === "Medium" ? 25 : 10;
      const interestScore = s.interest === "High" ? 30 : s.interest === "Medium" ? 15 : 5;
      const positionScore = s.position === "Supportive" ? 25 : s.position === "Neutral" ? 12 : 0;
      return Math.min(100, influenceScore + interestScore + positionScore);
    });
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
    const high = scores.filter(s => s >= 75).length;
    return { average: avg, high, scores };
  }, [filteredData]);

  // NEW: Action Priority Tracking
  const actionTracking = useMemo(() => {
    const withActions = filteredData.filter(s => s.nextAction);
    const high = withActions.filter(s => s.priority === "High").length;
    const medium = withActions.filter(s => s.priority === "Medium").length;
    const low = withActions.filter(s => s.priority === "Low").length;
    return { total: withActions.length, high, medium, low, rate: filteredData.length > 0 ? Math.round((withActions.length / filteredData.length) * 100) : 0 };
  }, [filteredData]);

  // NEW: Satisfaction Index (combination factors)
  const satisfactionIndex = useMemo(() => {
    const supportive = filteredData.filter(s => s.position === "Supportive").length;
    const engaged = filteredData.filter(s => s.interest === "High").length;
    const active = filteredData.filter(s => s.lastInteraction).length;
    const avgScore = filteredData.length > 0 ? Math.round(((supportive * 0.4 + engaged * 0.35 + active * 0.25) / filteredData.length) * 100) : 0;
    return { score: Math.min(100, avgScore), supportive, engaged, active };
  }, [filteredData]);

  // NEW: Quick KPI Summary
  const kpiSummary = useMemo(() => {
    const total = filteredData.length;
    const coverage = total > 0 ? Math.round((total / (data.length || 1)) * 100) : 0;
    const engagementRate = actionTracking.rate;
    const healthScore = Math.round((engagementScores.average * 0.4 + satisfactionIndex.score * 0.4 + engagementRate * 0.2));
    return { total, coverage, engagementRate, healthScore };
  }, [filteredData, data.length, actionTracking.rate, engagementScores.average, satisfactionIndex.score]);

  if (loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, color: theme.muted }}>Loading...</div>;

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
      <style>{`body{background:${theme.bg};color:${theme.text};}*{margin:0;padding:0;box-sizing:border-box;}`}</style>
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <h1 style={{ fontSize: 44, fontWeight: 800, color: theme.text, marginBottom: 8 }}>Stakeholder <span style={{ color: theme.accentL }}>Engagement</span></h1>
        <p style={{ fontSize: 15, color: theme.muted, marginBottom: 40, fontWeight: 500 }}>{data.length === 0 ? "No data loaded" : `${data.length} stakeholders • ${Math.max(new Set(data.map(s => s.category)).size, 1)} categories`}</p>

        {data.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[{ id: "all", label: `All (${data.length})` }, { id: "influencers", label: `High Influence (${data.filter(s => s.influence === "High" && s.interest === "High").length})` }, { id: "resistant", label: `Resistant (${data.filter(s => s.position === "Resistant").length})` }, { id: "priority", label: `Priority (${data.filter(s => s.priority === "High" && s.nextAction).length})` }].map(btn => <button key={btn.id} onClick={() => setFilter(btn.id)} style={{ padding: "10px 20px", borderRadius: 8, border: `2px solid ${filter === btn.id ? theme.accentL : theme.border}`, background: filter === btn.id ? `${theme.accentL}22` : "transparent", color: filter === btn.id ? theme.accentL : theme.text, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", hover: { background: `${theme.accentL}11` } }}>{btn.label}</button>)}
            </div>
          </div>
        )}

        {data.length > 0 && (
          <>
            {/* PRIMARY METRICS - BIG & BOLD */}
            <MetricGrid items={[<MetricCard key="total" value={stats.total} label="Total Stakeholders" icon={Users} color={theme.accentL} />, <MetricCard key="high" value={stats.highPriority} label="High Priority" icon={AlertTriangle} color={levelColors.High} />, <MetricCard key="supp" value={stats.supportive} label="Supportive" icon={CheckCircle2} color={positionColors.Supportive} />, <MetricCard key="inf" value={stats.highInfluence} label="High Influence" icon={Zap} color="#fbbf24" />]} cols={4} />

            {/* HEALTH DASHBOARD */}
            <TwoCol left={<Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 28 }}>📊 Health Score</div><div style={{ fontSize: 54, fontWeight: 800, color: kpiSummary.healthScore >= 70 ? "#34d399" : kpiSummary.healthScore >= 50 ? "#fbbf24" : "#f87171", marginBottom: 12 }}>{kpiSummary.healthScore}</div><div style={{ fontSize: 13, color: theme.muted, marginBottom: 24 }}>Overall engagement quality</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 24, borderTop: `1px solid ${theme.border}` }}><div><div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, fontWeight: 600 }}>ENGAGEMENT RATE</div><div style={{ fontSize: 32, fontWeight: 700, color: theme.accentL }}>{actionTracking.rate}%</div></div><div><div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, fontWeight: 600 }}>COVERAGE</div><div style={{ fontSize: 32, fontWeight: 700, color: "#a78bfa" }}>{kpiSummary.coverage}%</div></div></div></Card>} right={<Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 28 }}>💪 Engagement Avg</div><div style={{ fontSize: 54, fontWeight: 800, color: theme.accentL, marginBottom: 12 }}>{engagementScores.average}</div><div style={{ fontSize: 13, color: theme.muted, marginBottom: 24 }}>{engagementScores.high} highly engaged stakeholders</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 24, borderTop: `1px solid ${theme.border}` }}><div><div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, fontWeight: 600 }}>SUPPORTIVE</div><div style={{ fontSize: 32, fontWeight: 700, color: positionColors.Supportive }}>{satisfactionIndex.supportive}</div></div><div><div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, fontWeight: 600 }}>ACTIVE</div><div style={{ fontSize: 32, fontWeight: 700, color: "#f59e0b" }}>{satisfactionIndex.active}</div></div></div></Card>} />

            {/* INFLUENCE/INTEREST MATRIX */}
            <Section title="📊 Influence / Interest Matrix">
              <Card><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>{["High", "Medium", "Low"].map(int => ["High", "Medium", "Low"].map(inf => {
                const key = `${inf}-${int}`;
                const count = influenceInterestMatrix[key];
                return <div key={key} style={{ background: theme.bg, borderRadius: 8, padding: 20, textAlign: "center", border: `1px solid ${theme.border}` }}><div style={{ fontSize: 36, fontWeight: 800, color: theme.accentL, marginBottom: 6 }}>{count}</div><div style={{ fontSize: 12, color: theme.muted, fontWeight: 500 }}>{inf} Inf<br/>{int} Int</div></div>;
              }))}</div></Card>
            </Section>

            {/* STRATEGIC BREAKDOWN */}
            <TwoCol left={<Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 20 }}>🎯 Positioning</div>{positionBreakdown.map(item => <ProgressBar key={item.name} label={item.name} value={item.value} total={stats.total} color={item.color} />)}</Card>} right={<Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 20 }}>📁 Categories</div>{categoryBreakdown.map(item => <ProgressBar key={item.name} label={item.name} value={item.value} total={stats.total} color={colors[item.name] || theme.accentL} />)}</Card>} />

            {/* RISK & ALLIES */}
            <TwoCol left={<Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 20 }}>⚠️ Risks</div><div style={{ fontSize: 40, fontWeight: 800, color: "#f87171", marginBottom: 8 }}>{risks.length}</div><div style={{ fontSize: 13, color: theme.muted, marginBottom: 16 }}>High influence, low interest</div>{risks.length > 0 && <div style={{ paddingTop: 16, borderTop: `1px solid ${theme.border}`, fontSize: 12 }}>{risks.slice(0, 3).map(s => <div key={s.id} style={{ color: theme.text, marginBottom: 6 }}>• {s.name}</div>)}</div>}</Card>} right={<Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 20 }}>🤝 Allies</div><div style={{ fontSize: 40, fontWeight: 800, color: "#34d399", marginBottom: 8 }}>{allies.length}</div><div style={{ fontSize: 13, color: theme.muted, marginBottom: 16 }}>Medium influence, high interest</div>{allies.length > 0 && <div style={{ paddingTop: 16, borderTop: `1px solid ${theme.border}`, fontSize: 12 }}>{allies.slice(0, 3).map(s => <div key={s.id} style={{ color: theme.text, marginBottom: 6 }}>• {s.name}</div>)}</div>}</Card>} />

            {/* TYPE ANALYSIS */}
            <TwoCol left={<Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 20 }}>👥 People vs Institutions</div><ProgressBar label="Individuals" value={peopleVsInstitutions.people} total={stats.total} color="#a78bfa" /><ProgressBar label="Institutions" value={peopleVsInstitutions.institutions} total={stats.total} color="#60a5fa" /></Card>} right={<Card><div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 20 }}>📋 Policy vs Implementation</div><ProgressBar label="Policy Leaders" value={policyVsImplementation.policy} total={stats.total} color="#f59e0b" /><ProgressBar label="Implementers" value={policyVsImplementation.implementation} total={stats.total} color="#8b5cf6" /></Card>} />

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

