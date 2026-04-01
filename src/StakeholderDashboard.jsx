import { fetchStakeholders } from './googleSheetsClient'
import { useState, useMemo, useEffect } from "react";
import { Users, AlertTriangle, CheckCircle2, Activity, Lightbulb, Zap, Info } from "lucide-react";

// ── THEME ─────────────────────────────────────────────────────────────────────
const theme = {
  bg: "#0d1117", card: "#161b22", border: "#21262d", text: "#e2e8f0", 
  muted: "#8b949e", accentL: "#818cf8"
};

const colors = {
  Government: "#818cf8", Political: "#a78bfa", "NGO/Civil Society": "#34d399", 
  Corporate: "#60a5fa", Academic: "#f59e0b", Media: "#fb7185", 
  Community: "#f97316", International: "#2dd4bf"
};

const levelColors = { High: "#f87171", Medium: "#fbbf24", Low: "#34d399" };
const positionColors = { Supportive: "#34d399", Neutral: "#94a3b8", Resistant: "#f87171" };


// ── PRIMITIVES ────────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, ...style }}>
    {children}
  </div>
);

const StatCard = ({ label, value, icon: Icon, color }) => (
  <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
    <div><div style={{ fontSize: 12, color: theme.muted, marginBottom: 8 }}>{label}</div><div style={{ fontSize: 32, fontWeight: 700, color: theme.text }}>{value}</div></div>
    <Icon size={24} color={color} style={{ opacity: 0.7 }} />
  </Card>
);

const Badge = ({ label, color = theme.muted }) => (
  <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${color}22`, color, border: `1px solid ${color}44` }}>
    {label}
  </span>
);

const GaugeChart = ({ value = 50, label, color = theme.accentL }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11 }}>
      <span style={{ color: theme.text, fontWeight: 500 }}>{label}</span>
      <span style={{ color, fontWeight: 700 }}>{Math.min(value, 100)}%</span>
    </div>
    <div style={{ width: "100%", height: 8, background: theme.bg, borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: color, transition: "width 0.4s" }} />
    </div>
  </div>
);


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

  // Risk & Ally Analysis
  const risks = useMemo(() => {
    return filteredData.filter(s => s.influence === "High" && s.interest === "Low");
  }, [filteredData]);

  const allies = useMemo(() => {
    return filteredData.filter(s => s.influence === "Medium" && s.interest === "High");
  }, [filteredData]);

  // People vs Institutions
  const peopleVsInstitutions = useMemo(() => {
    const people = filteredData.filter(s => !s.organization || s.organization.toLowerCase().includes('self') || s.organization.toLowerCase().includes('individual')).length;
    const institutions = filteredData.length - people;
    return { people, institutions };
  }, [filteredData]);

  // Policy vs Implementation
  const policyVsImplementation = useMemo(() => {
    const policy = filteredData.filter(s => s.role && (s.role.toLowerCase().includes('minister') || s.role.toLowerCase().includes('policy') || s.role.toLowerCase().includes('director'))).length;
    const implementation = Math.max(0, filteredData.length - policy);
    return { policy, implementation };
  }, [filteredData]);

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
    <div style={{ background: theme.bg, minHeight: "100vh", padding: 24, fontFamily: "system-ui" }}>
      <style>{`body{background:${theme.bg};color:${theme.text};}*{margin:0;padding:0;box-sizing:border-box;}`}</style>
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: theme.text, marginBottom: 8 }}>
          <span>Stakeholder</span> <span style={{ color: theme.accentL }}>Engagement</span>
        </h1>
        <p style={{ fontSize: 14, color: theme.muted, marginBottom: 32 }}>
          {data.length === 0 ? "No stakeholders loaded" : `${data.length} stakeholders across ${Math.max(new Set(data.map(s => s.category)).size, 1)} categories`}
        </p>

        {data.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12, fontWeight: 600 }}>🔍 FILTERS</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { id: "all", label: `All (${data.length})` },
                { id: "influencers", label: `High Influence (${data.filter(s => s.influence === "High" && s.interest === "High").length})` },
                { id: "resistant", label: `Resistant (${data.filter(s => s.position === "Resistant").length})` },
                { id: "priority", label: `Priority (${data.filter(s => s.priority === "High" && s.nextAction).length})` },
              ].map(btn => (
                <button key={btn.id} onClick={() => setFilter(btn.id)} style={{
                  padding: "8px 16px", borderRadius: 8, border: `1px solid ${filter === btn.id ? theme.accentL : theme.border}`,
                  background: filter === btn.id ? `${theme.accentL}22` : theme.card, color: filter === btn.id ? theme.accentL : theme.text,
                  fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                }}>
                  {btn.label}
                </button>
              ))}
            </div>
            {filteredData.length < data.length && <div style={{ marginTop: 12, fontSize: 12, color: theme.muted, padding: 8, background: `${theme.accentL}11`, borderRadius: 6, borderLeft: `2px solid ${theme.accentL}` }}>📊 Showing {filteredData.length} of {data.length}</div>}
          </div>
        )}

        {/* KEY METRICS (2x2 Grid) */}
        {data.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 40 }}>
              <StatCard label="Total Stakeholders" value={stats.total} icon={Users} color={theme.accentL} />
              <StatCard label="High Priority" value={stats.highPriority} icon={AlertTriangle} color={levelColors.High} />
              <StatCard label="Supportive" value={stats.supportive} icon={CheckCircle2} color={positionColors.Supportive} />
              <StatCard label="High Influence" value={stats.highInfluence} icon={Zap} color="#fbbf24" />
            </div>

            {/* LARGE INFLUENCE/INTEREST MATRIX */}
            <div style={{ marginBottom: 40 }}>
              <Card style={{ padding: 32 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 24 }}>📊 Influence / Interest Matrix</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                  {["High", "Medium", "Low"].map(interest =>
                    ["High", "Medium", "Low"].map(influence => {
                      const key = `${influence}-${interest}`;
                      const count = influenceInterestMatrix[key];
                      return (
                        <div key={key} style={{
                          background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 12,
                          padding: 24, textAlign: "center"
                        }}>
                          <div style={{ fontWeight: 700, color: theme.accentL, marginBottom: 8, fontSize: 32 }}>
                            {count}
                          </div>
                          <div style={{ color: theme.muted, fontSize: 13, fontWeight: 500 }}>
                            {influence} Inf<br/>{interest} Int
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div style={{ fontSize: 13, color: theme.muted, paddingTop: 16, borderTop: `1px solid ${theme.border}`, textAlign: "center" }}>
                  ↓ Interest Level / Influence Level →
                </div>
              </Card>
            </div>

            {/* STRATEGIC INSIGHTS ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 40 }}>
              {/* Position Breakdown */}
              <Card style={{ padding: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 24 }}>🎯 Stakeholder Positioning</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {positionBreakdown.map(item => (
                    <div key={item.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{item.name}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: item.color }}>
                          {item.value} ({Math.round(item.value / stats.total * 100)}%)
                        </span>
                      </div>
                      <div style={{ width: "100%", height: 14, background: theme.bg, borderRadius: 7, overflow: "hidden" }}>
                        <div style={{ width: `${(item.value / stats.total) * 100}%`, height: "100%", background: item.color, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Category Distribution */}
              <Card style={{ padding: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 24 }}>📁 Categories</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {categoryBreakdown.map(item => (
                    <div key={item.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: theme.text, fontSize: 14 }}>{item.name}</span>
                        <span style={{ color: theme.muted, fontWeight: 700, fontSize: 14 }}>{item.value}</span>
                      </div>
                      <div style={{ width: "100%", height: 10, background: theme.bg, borderRadius: 5, overflow: "hidden" }}>
                        <div style={{ width: `${(item.value / stats.total) * 100}%`, height: "100%", background: theme.accentL, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* KEY INSIGHTS ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 40 }}>
              {/* Risk Assessment */}
              <Card style={{ padding: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 24 }}>⚠️ Risk Assessment</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: theme.muted, marginBottom: 6, fontWeight: 600 }}>HIGH INFLUENCE, LOW INTEREST</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <div style={{ fontSize: 32, fontWeight: 700, color: "#f87171" }}>{risks.length}</div>
                      <div style={{ color: theme.muted, fontSize: 13 }}>stakeholders</div>
                    </div>
                    <div style={{ fontSize: 12, color: theme.muted, marginTop: 8, lineHeight: 1.5 }}>
                      Powerful but not engaged. Needs attention.
                    </div>
                  </div>
                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 16, marginTop: 12 }}>
                    {risks.slice(0, 2).map(s => (
                      <div key={s.id} style={{ fontSize: 12, color: theme.text, marginBottom: 6 }}>
                        • {s.name}
                      </div>
                    ))}
                    {risks.length > 2 && <div style={{ fontSize: 12, color: theme.muted }}>+ {risks.length - 2} more</div>}
                  </div>
                </div>
              </Card>

              {/* Ally Assessment */}
              <Card style={{ padding: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 24 }}>🤝 Key Allies</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: theme.muted, marginBottom: 6, fontWeight: 600 }}>MEDIUM INFLUENCE, HIGH INTEREST</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <div style={{ fontSize: 32, fontWeight: 700, color: "#34d399" }}>{allies.length}</div>
                      <div style={{ color: theme.muted, fontSize: 13 }}>stakeholders</div>
                    </div>
                    <div style={{ fontSize: 12, color: theme.muted, marginTop: 8, lineHeight: 1.5 }}>
                      Engaged advocates. Amplify their voice.
                    </div>
                  </div>
                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 16, marginTop: 12 }}>
                    {allies.slice(0, 2).map(s => (
                      <div key={s.id} style={{ fontSize: 12, color: theme.text, marginBottom: 6 }}>
                        • {s.name}
                      </div>
                    ))}
                    {allies.length > 2 && <div style={{ fontSize: 12, color: theme.muted }}>+ {allies.length - 2} more</div>}
                  </div>
                </div>
              </Card>
            </div>

            {/* STAKEHOLDER TYPE ANALYSIS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 40 }}>
              {/* People vs Institutions */}
              <Card style={{ padding: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 24 }}>👥 People vs Institutions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { label: "Institutions", value: peopleVsInstitutions.institutions, color: "#60a5fa" },
                    { label: "Individuals", value: peopleVsInstitutions.people, color: "#a78bfa" }
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{item.label}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: item.color }}>
                          {item.value} ({((item.value / stats.total) * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <div style={{ width: "100%", height: 14, background: theme.bg, borderRadius: 7, overflow: "hidden" }}>
                        <div style={{ width: `${(item.value / stats.total) * 100}%`, height: "100%", background: item.color, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Policy vs Implementation */}
              <Card style={{ padding: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 24 }}>📋 Policy vs Implementation</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { label: "Policy Leaders", value: policyVsImplementation.policy, color: "#f59e0b" },
                    { label: "Implementers", value: policyVsImplementation.implementation, color: "#8b5cf6" }
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 14, color: theme.text, fontWeight: 500 }}>{item.label}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: item.color }}>
                          {item.value} ({((item.value / stats.total) * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <div style={{ width: "100%", height: 14, background: theme.bg, borderRadius: 7, overflow: "hidden" }}>
                        <div style={{ width: `${(item.value / stats.total) * 100}%`, height: "100%", background: item.color, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* INTERACTIONS ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 40 }}>
              {/* Recent Interactions */}
              <Card style={{ padding: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 20 }}>📅 Recent Interactions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {recentInteractions.length === 0 ? (
                    <div style={{ color: theme.muted, textAlign: "center", padding: 20, fontSize: 13 }}>No recent interactions</div>
                  ) : (
                    recentInteractions.map(s => (
                      <div key={s.id} style={{ padding: 14, background: theme.bg, borderRadius: 8, border: `1px solid ${theme.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: theme.text, fontSize: 13 }}>{s.name}</span>
                          <Badge label={s.lastInteraction} />
                        </div>
                        <div style={{ fontSize: 12, color: theme.muted }}>{s.organization}</div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Upcoming Actions */}
              <Card style={{ padding: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 20 }}>✅ Upcoming Actions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {upcomingActions.length === 0 ? (
                    <div style={{ color: theme.muted, textAlign: "center", padding: 20, fontSize: 13 }}>No upcoming actions</div>
                  ) : (
                    upcomingActions.map(s => (
                      <div key={s.id} style={{ padding: 14, background: theme.bg, borderRadius: 8, border: `1px solid ${theme.border}`, borderLeft: `3px solid ${levelColors[s.priority] || theme.accentL}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: theme.text, fontSize: 13 }}>{s.name}</span>
                          <Badge label={s.priority} color={levelColors[s.priority]} />
                        </div>
                        <div style={{ fontSize: 12, color: theme.muted, lineHeight: 1.5 }}>{s.nextAction}</div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* STAKEHOLDER PROFILES */}
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 20 }}>👥 Individual Stakeholder Profiles</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                {filteredData.map((stakeholder, idx) => (
                  <Card key={stakeholder.id} style={{ padding: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 2 }}>{stakeholder.name}</h3>
                          <div style={{ fontSize: 12, color: theme.muted }}>{stakeholder.organization}</div>
                        </div>
                        <Badge label={stakeholder.category} color={colors[stakeholder.category] || theme.accentL} />
                      </div>
                      <div style={{ fontSize: 12, color: theme.muted }}>{stakeholder.role}</div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${theme.border}` }}>
                      <div><div style={{ fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 600 }}>INFLUENCE</div><Badge label={stakeholder.influence} color={levelColors[stakeholder.influence]} /></div>
                      <div><div style={{ fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 600 }}>INTEREST</div><Badge label={stakeholder.interest} color={levelColors[stakeholder.interest]} /></div>
                      <div><div style={{ fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 600 }}>POSITION</div><Badge label={stakeholder.position} color={positionColors[stakeholder.position]} /></div>
                      <div><div style={{ fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 600 }}>PRIORITY</div><Badge label={stakeholder.priority} color={levelColors[stakeholder.priority]} /></div>
                    </div>

                    <GaugeChart value={[60, 75, 55, 80, 70][idx % 5]} label="Engagement" color={theme.accentL} />

                    {stakeholder.nextAction && (
                      <div style={{ padding: 12, background: theme.bg, borderRadius: 8, borderLeft: `2px solid ${levelColors[stakeholder.priority]}`, fontSize: 12, color: theme.muted, marginTop: 12 }}>
                        <div style={{ fontWeight: 600, color: theme.text, marginBottom: 4 }}>Next Action</div>
                        {stakeholder.nextAction}
                      </div>
                    )}

                    {stakeholder.lastInteraction && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}`, fontSize: 11, color: theme.muted }}>
                        Last seen: <strong>{stakeholder.lastInteraction}</strong>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

