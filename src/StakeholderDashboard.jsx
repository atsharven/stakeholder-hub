// ═══════════════════════════════════════════════════════════════════════════════
// STAKEHOLDER ENGAGEMENT DASHBOARD v2
// Advanced analytics with individual stakeholder cards and suggestions
// ═══════════════════════════════════════════════════════════════════════════════

import { fetchStakeholders } from './googleSheetsClient'
import { useState, useMemo, useEffect } from "react";
import {
  Users, TrendingUp, AlertTriangle, CheckCircle2, Activity, Lightbulb,
  Target, Building2, Zap, Info, ArrowRight
} from "lucide-react";

// ── THEME ─────────────────────────────────────────────────────────────────────
const theme = {
  bg:      "#0d1117",
  card:    "#161b22",
  border:  "#21262d",
  text:    "#e2e8f0",
  muted:   "#8b949e",
  accent:  "#4f46e5",
  accentL: "#818cf8",
};

// ── COLORS ────────────────────────────────────────────────────────────────────
const colors = {
  Government: "#818cf8",
  Political: "#a78bfa",
  "NGO/Civil Society": "#34d399",
  Corporate: "#60a5fa",
  Academic: "#f59e0b",
  Media: "#fb7185",
  Community: "#f97316",
  International: "#2dd4bf",
};

const levelColors = {
  High: "#f87171",
  Medium: "#fbbf24",
  Low: "#34d399",
};

const positionColors = {
  Supportive: "#34d399",
  Neutral: "#94a3b8",
  Resistant: "#f87171",
};

// ── PRIMITIVES ────────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: 20,
    ...style
  }}>
    {children}
  </div>
);

const StatCard = ({ label, value, icon: Icon, color }) => (
  <Card style={{ textAlign: "center" }}>
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: `${color}22`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <Icon size={24} color={color} />
      </div>
    </div>
    <div style={{ fontSize: 32, fontWeight: 700, color: theme.text, marginBottom: 8 }}>
      {value}
    </div>
    <div style={{ fontSize: 12, color: theme.muted, fontWeight: 500 }}>
      {label}
    </div>
  </Card>
);

const Badge = ({ label, color = theme.muted }) => (
  <span style={{
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    background: `${color}22`,
    color: color,
    border: `1px solid ${color}44`,
    whiteSpace: "nowrap"
  }}>
    {label}
  </span>
);

// Gauge chart for 0-100 scale
const GaugeChart = ({ value = 50, label, color = theme.accentL, size = "small" }) => {
  const percentage = Math.min(Math.max(value || 0, 0), 100);
  const height = size === "small" ? 8 : 12;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11 }}>
        <span style={{ color: theme.text, fontWeight: 500 }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{percentage}%</span>
      </div>
      <div style={{
        width: "100%",
        height,
        background: theme.bg,
        borderRadius: 4,
        overflow: "hidden"
      }}>
        <div style={{
          width: `${percentage}%`,
          height: "100%",
          background: color,
          transition: "width 0.4s ease"
        }} />
      </div>
    </div>
  );
};

// ── DASHBOARD COMPONENT ────────────────────────────────────────────────────────
export default function StakeholderDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // Smart filter state

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        const stakeholders = await fetchStakeholders();
        setData(stakeholders);
      } catch (err) {
        setError(err);
        console.error('🚨 Dashboard Error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ── SMART FILTERS ──────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (filter === "all") return data;
    if (filter === "influencers") return data.filter(s => s.influence === "High" && s.interest === "High");
    if (filter === "resistant") return data.filter(s => s.position === "Resistant");
    if (filter === "priority") return data.filter(s => s.priority === "High" && s.nextAction);
    return data;
  }, [data, filter]);

  // ── ANALYTICS (useMemo for performance) ────────────────────────────────────
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

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.bg,
        color: theme.muted
      }}>
        <div style={{ textAlign: "center" }}>
          <Activity size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
          <div style={{ fontSize: 16, marginBottom: 8 }}>Loading stakeholder data...</div>
          <div style={{ fontSize: 12, color: theme.muted }}>Connecting to Google Sheet</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.bg,
        padding: 24
      }}>
        <div style={{ maxWidth: 600 }}>
          <div style={{
            background: `#f877711a`,
            border: `1px solid #f87171`,
            borderRadius: 12,
            padding: 24
          }}>
            <h2 style={{ color: "#f87171", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
              ⚠️ Error Loading Data
            </h2>
            <details style={{ marginBottom: 16, cursor: "pointer" }}>
              <summary style={{ color: theme.text, fontWeight: 600, marginBottom: 8 }}>
                Error Details
              </summary>
              <pre style={{
                fontSize: 12,
                color: theme.muted,
                background: theme.bg,
                padding: 12,
                borderRadius: 6,
                overflow: "auto",
                marginTop: 8
              }}>
{error.message}
              </pre>
            </details>
            
            <div style={{ color: theme.text, lineHeight: 1.6, marginBottom: 16 }}>
              <strong style={{ color: "#f87171 " }}>Quick Checklist:</strong>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>✓ Open <code>src/config.js</code></li>
                <li>✓ Update <code>sheetId</code> to your Google Sheet ID</li>
                <li>✓ Google Sheet is publicly shared (Anyone with link)</li>
                <li>✓ Column names match exactly (check SETUP_GUIDE.md)</li>
                <li>✓ Hard refresh: Ctrl+Shift+R</li>
              </ul>
            </div>

            <div style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: 12,
              fontSize: 12,
              color: theme.muted
            }}>
              See <strong style={{ color: theme.accentL }}>SETUP_GUIDE.md</strong> for detailed instructions
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: theme.bg, 
      minHeight: "100vh", 
      padding: 24,
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${theme.bg}; color: ${theme.text}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${theme.bg}; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 3px; }
      `}</style>

      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        
        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 36,
            fontWeight: 800,
            color: theme.text,
            marginBottom: 8,
            lineHeight: 1
          }}>
            <span style={{ color: theme.text }}>Stakeholder</span>
            <span style={{ color: theme.accentL }}> Engagement</span>
          </h1>
          <p style={{ fontSize: 14, color: theme.muted }}>
            {data.length === 0 
              ? "No stakeholders loaded yet. Check config.js and SETUP_GUIDE.md for setup instructions."
              : `Real-time dashboard tracking ${data.length} stakeholders across ${categoryBreakdown.length} categories`
            }
          </p>
        </div>

        {/* ── SMART FILTERS ────────────────────────────────────────────────────── */}
        {data.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12, fontWeight: 600 }}>
              🔍 SMART FILTERS
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { id: "all", label: `All Stakeholders (${data.length})`, count: data.length },
                { id: "influencers", label: `High Influence + Interest (${data.filter(s => s.influence === "High" && s.interest === "High").length})`, count: data.filter(s => s.influence === "High" && s.interest === "High").length },
                { id: "resistant", label: `Resistant Stakeholders (${data.filter(s => s.position === "Resistant").length})`, count: data.filter(s => s.position === "Resistant").length },
                { id: "priority", label: `High Priority + Actions (${data.filter(s => s.priority === "High" && s.nextAction).length})`, count: data.filter(s => s.priority === "High" && s.nextAction).length },
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1px solid ${filter === btn.id ? theme.accentL : theme.border}`,
                    background: filter === btn.id ? `${theme.accentL}22` : theme.card,
                    color: filter === btn.id ? theme.accentL : theme.text,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            {filteredData.length < data.length && (
              <div style={{ 
                marginTop: 12, 
                fontSize: 12, 
                color: theme.muted,
                padding: 8,
                background: `${theme.accentL}11`,
                borderRadius: 6,
                borderLeft: `2px solid ${theme.accentL}`
              }}>
                📊 Showing {filteredData.length} of {data.length} stakeholders
              </div>
            )}
          </div>
        )}

        {/* ── EMPTY STATE ──────────────────────────────────────────────────────── */}
        {data.length === 0 && (
          <Card style={{ 
            padding: 24, 
            marginBottom: 32,
            background: `${theme.accentL}11`,
            border: `1px solid ${theme.accentL}44`
          }}>
            <div style={{ display: "flex", gap: 16 }}>
              <Info size={20} color={theme.accentL} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 style={{ color: theme.text, fontWeight: 600, marginBottom: 8 }}>
                  ℹ️ Getting Started
                </h3>
                <ol style={{ color: theme.muted, fontSize: 13, lineHeight: 1.6, marginLeft: 16 }}>
                  <li>Edit <code style={{ color: theme.accentL, background: theme.bg, padding: "2px 6px", borderRadius: 3 }}>src/config.js</code></li>
                  <li>Change <code style={{ color: theme.accentL, background: theme.bg, padding: "2px 6px", borderRadius: 3 }}>sheetId</code> to your Google Sheet ID</li>
                  <li>Make sure sheet is publicly shared</li>
                  <li>Use CSV format from <code style={{ color: theme.accentL, background: theme.bg, padding: "2px 6px", borderRadius: 3 }}>STAKEHOLDER_DATA_TEMPLATE.csv</code></li>
                  <li>Refresh page (Ctrl+Shift+R)</li>
                </ol>
                <div style={{ marginTop: 12, fontSize: 12 }}>
                  👉 See <strong style={{ color: theme.accentL }}>SETUP_GUIDE.md</strong> for detailed instructions
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ── KEY METRICS (4 columns) ───────────────────────────────────────── */}
        {data.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              <StatCard label="Total Stakeholders" value={stats.total} icon={Users} color={theme.accentL} />
              <StatCard label="High Priority" value={stats.highPriority} icon={AlertTriangle} color={levelColors.High} />
              <StatCard label="Supportive" value={stats.supportive} icon={CheckCircle2} color={positionColors.Supportive} />
              <StatCard label="High Influence" value={stats.highInfluence} icon={Zap} color="#fbbf24" />
            </div>

            {/* ── TOP SECTION: 2 columns ────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          
          {/* Influence/Interest Matrix */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 16 }}>
              📊 Influence / Interest Matrix
            </div>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(3, 1fr)", 
              gap: 8,
              fontSize: 11
            }}>
              {["High", "Medium", "Low"].map(interest =>
                ["High", "Medium", "Low"].map(influence => {
                  const key = `${influence}-${interest}`;
                  const count = influenceInterestMatrix[key];
                  return (
                    <div key={key} style={{
                      background: theme.bg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      padding: 12,
                      textAlign: "center"
                    }}>
                      <div style={{ fontWeight: 700, color: theme.accentL, marginBottom: 4 }}>
                        {count}
                      </div>
                      <div style={{ color: theme.muted, fontSize: 9 }}>
                        {influence.substring(0, 1)}-{interest.substring(0, 1)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ fontSize: 11, color: theme.muted, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
              ↓ Interest / Influence →
            </div>
          </Card>

          {/* Position Breakdown */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 20 }}>
              🎯 Stakeholder Position
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {positionBreakdown.map(item => (
                <div key={item.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: theme.text }}>{item.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>
                      {item.value} ({Math.round(item.value / stats.total * 100)}%)
                    </span>
                  </div>
                  <div style={{
                    width: "100%",
                    height: 12,
                    background: theme.bg,
                    borderRadius: 6,
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${(item.value / stats.total) * 100}%`,
                      height: "100%",
                      background: item.color,
                      transition: "width 0.4s"
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── MIDDLE SECTION: 3 columns ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          
          {/* Category Breakdown */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 20 }}>
              📁 Stakeholders by Category
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {categoryBreakdown.map(item => (
                <div key={item.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: theme.text }}>{item.name}</span>
                    <span style={{ color: theme.muted, fontWeight: 600 }}>{item.value}</span>
                  </div>
                  <div style={{
                    width: "100%",
                    height: 8,
                    background: theme.bg,
                    borderRadius: 4,
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${(item.value / stats.total) * 100}%`,
                      height: "100%",
                      background: theme.accentL,
                      transition: "width 0.3s"
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Priority Distribution */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 20 }}>
              🚀 Priority Distribution
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {priorityBreakdown.map(item => (
                <div key={item.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: theme.text, fontSize: 12 }}>{item.name}</span>
                    <span style={{ color: item.color, fontWeight: 700, fontSize: 12 }}>
                      {item.value}
                    </span>
                  </div>
                  <div style={{
                    width: "100%",
                    height: 10,
                    background: theme.bg,
                    borderRadius: 5,
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${(item.value / stats.total) * 100}%`,
                      height: "100%",
                      background: item.color
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 20 }}>
              📈 Quick Stats
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ color: theme.muted, fontSize: 11, marginBottom: 4 }}>HIGH INTEREST</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.accentL }}>
                  {stats.highInterest}
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
                <div style={{ color: theme.muted, fontSize: 11, marginBottom: 4 }}>CATEGORIES</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#34d399" }}>
                  {categoryBreakdown.length}
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
                <div style={{ color: theme.muted, fontSize: 11, marginBottom: 4 }}>HIGH PRIORITY %</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fbbf24" }}>
                  {(stats.highPriority / stats.total * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </Card>

          {/* Richer Analytics */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 20 }}>
              📊 Engagement Breakdown
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ color: theme.muted, fontSize: 11, marginBottom: 4 }}>SUPPORTIVE</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#34d399" }}>
                    {stats.supportive}
                  </div>
                  <div style={{ fontSize: 12, color: theme.muted }}>
                    ({(stats.supportive / stats.total * 100).toFixed(0)}%)
                  </div>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
                <div style={{ color: theme.muted, fontSize: 11, marginBottom: 4 }}>RESISTANT</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#f87171" }}>
                    {stats.resistant}
                  </div>
                  <div style={{ fontSize: 12, color: theme.muted }}>
                    ({(stats.resistant / stats.total * 100).toFixed(0)}%)
                  </div>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
                <div style={{ color: theme.muted, fontSize: 11, marginBottom: 4 }}>NEUTRAL</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#94a3b8" }}>
                    {stats.total - stats.supportive - stats.resistant}
                  </div>
                  <div style={{ fontSize: 12, color: theme.muted }}>
                    ({((stats.total - stats.supportive - stats.resistant) / stats.total * 100).toFixed(0)}%)
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ── BOTTOM SECTION: 2 columns ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          
          {/* Recent Interactions */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 16 }}>
              📅 Recent Interactions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentInteractions.length === 0 ? (
                <div style={{ color: theme.muted, textAlign: "center", padding: 24 }}>
                  No recent interactions
                </div>
              ) : (
                recentInteractions.map(s => (
                  <div key={s.id} style={{
                    padding: 12,
                    background: theme.bg,
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: theme.text }}>{s.name}</span>
                      <Badge label={s.lastInteraction} />
                    </div>
                    <div style={{ fontSize: 12, color: theme.muted }}>
                      {s.organization}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Upcoming Actions */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 16 }}>
              ✅ Upcoming Actions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {upcomingActions.length === 0 ? (
                <div style={{ color: theme.muted, textAlign: "center", padding: 24 }}>
                  No upcoming actions
                </div>
              ) : (
                upcomingActions.map(s => (
                  <div key={s.id} style={{
                    padding: 12,
                    background: theme.bg,
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    borderLeft: `3px solid ${levelColors[s.priority] || theme.accentL}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: theme.text }}>{s.name}</span>
                      <Badge label={s.priority} color={levelColors[s.priority]} />
                    </div>
                    <div style={{ fontSize: 12, color: theme.muted, lineHeight: 1.4 }}>
                      {s.nextAction}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
          </>
        )}

        {/* ── SUGGESTED COLUMNS SECTION ─────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Lightbulb size={20} color={theme.accentL} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>
              💡 Suggested Columns to Add
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { name: "Engagement Score", desc: "0-100 scale (current level)", type: "numeric" },
              { name: "Risk Level", desc: "1-5 (likelihood of disengagement)", type: "numeric" },
              { name: "Dependency Level", desc: "1-5 (how critical to project)", type: "numeric" },
              { name: "Contact Frequency", desc: "Days since last contact", type: "numeric" },
              { name: "Budget/Spending", desc: "Associated funding amount", type: "currency" },
              { name: "Timeline Days", desc: "Days until key deadline", type: "numeric" },
              { name: "Satisfaction Score", desc: "1-10 (current satisfaction)", type: "numeric" },
              { name: "Dependency Chain", desc: "Number of dependent stakeholders", type: "numeric" },
            ].map((col, idx) => (
              <Card key={idx} style={{ padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentL, marginBottom: 6 }}>
                  {col.name}
                </div>
                <div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, lineHeight: 1.4 }}>
                  {col.desc}
                </div>
                <div style={{ 
                  display: "inline-block",
                  padding: "2px 8px", 
                  backgroundColor: theme.bg, 
                  borderRadius: 4,
                  fontSize: 10, 
                  color: theme.accentL,
                  fontWeight: 600
                }}>
                  {col.type}
                </div>
              </Card>
            ))}
          </div>
          <div style={{ 
            marginTop: 12,
            padding: 12,
            background: `${theme.accentL}11`,
            border: `1px dashed ${theme.accentL}44`,
            borderRadius: 8,
            fontSize: 12,
            color: theme.text
          }}>
            <strong>✨ Pro Tip:</strong> Add numeric columns to unlock more visualizations like engagement gauges, risk indicators, and correlation charts.
          </div>
        </div>

        {/* ── INDIVIDUAL STAKEHOLDER CARDS ─────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 16 }}>
            👥 Individual Stakeholder Profiles
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {filteredData.map((stakeholder, idx) => (
              <Card key={stakeholder.id} style={{ padding: 16 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 2 }}>
                        {stakeholder.name}
                      </h3>
                      <div style={{ fontSize: 11, color: theme.muted }}>
                        {stakeholder.organization}
                      </div>
                    </div>
                    <Badge label={stakeholder.category} color={colors[stakeholder.category] || theme.accentL} />
                  </div>
                  <div style={{ fontSize: 11, color: theme.muted }}>
                    {stakeholder.role}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${theme.border}` }}>
                  <div>
                    <div style={{ fontSize: 10, color: theme.muted, marginBottom: 4, fontWeight: 600 }}>INFLUENCE</div>
                    <Badge label={stakeholder.influence} color={levelColors[stakeholder.influence]} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: theme.muted, marginBottom: 4, fontWeight: 600 }}>INTEREST</div>
                    <Badge label={stakeholder.interest} color={levelColors[stakeholder.interest]} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: theme.muted, marginBottom: 4, fontWeight: 600 }}>POSITION</div>
                    <Badge label={stakeholder.position} color={positionColors[stakeholder.position]} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: theme.muted, marginBottom: 4, fontWeight: 600 }}>PRIORITY</div>
                    <Badge label={stakeholder.priority} color={levelColors[stakeholder.priority]} />
                  </div>
                </div>

                {/* Gauges (examples - would use real data if columns added) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                  <GaugeChart 
                    value={[60, 75, 55, 80, 70][idx % 5]} 
                    label="Engagement" 
                    color={theme.accentL} 
                  />
                </div>

                {/* Action Info */}
                {stakeholder.nextAction && (
                  <div style={{
                    padding: 10,
                    background: theme.bg,
                    borderRadius: 6,
                    borderLeft: `2px solid ${levelColors[stakeholder.priority]}`,
                    fontSize: 11,
                    color: theme.muted
                  }}>
                    <div style={{ fontWeight: 600, color: theme.text, marginBottom: 4 }}>Next Action</div>
                    {stakeholder.nextAction}
                  </div>
                )}

                {/* Last Interaction */}
                {stakeholder.lastInteraction && (
                  <div style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1px solid ${theme.border}`,
                    fontSize: 10,
                    color: theme.muted
                  }}>
                    Last seen: <strong>{stakeholder.lastInteraction}</strong>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

