import { supabase } from './supabaseClient'
import { useState, useMemo, useEffect } from "react";
import {
  Search, Plus, Edit2, Trash2, X, Eye,
  LayoutDashboard, Users, Target, Activity,
  Building2, ArrowUpRight, Calendar, ChevronDown,
  Bell, AlertTriangle, CheckCircle2, TrendingUp
} from "lucide-react";

// ── constants ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Government","Political","NGO/Civil Society","Corporate",
  "Academic","Media","Community","International"
];
const LEVELS    = ["High","Medium","Low"];
const POSITIONS = ["Supportive","Neutral","Resistant"];
const STRATEGIES = [
  "Engage (Manage closely)","Consult (Keep satisfied)",
  "Keep Informed","Monitor"
];
const PRIORITIES = ["High","Medium","Low"];

const EMPTY_FORM = {
  name:"", category:"Government", organization:"", role:"",
  influence:"Medium", interest:"Medium", position:"Neutral",
  strategy:"Keep Informed", owner:"", recentDevelopments:"",
  engagementHistory:"", opportunityWindow:"",
  lastInteraction: new Date().toISOString().split("T")[0],
  nextAction:"", priority:"Medium",
};

// ── mock data ──────────────────────────────────────────────────────────────
const MOCK = [
  { id:1, name:"Ministry of Finance", category:"Government", organization:"Federal Government", role:"Policy Regulator & Funding Authority", influence:"High", interest:"High", position:"Supportive", strategy:"Engage (Manage closely)", owner:"Priya Sharma", recentDevelopments:"New infrastructure budget announced FY2025", engagementHistory:"3 formal meetings in 2024; quarterly briefings established", opportunityWindow:"Budget planning cycle – March 2025", lastInteraction:"2024-12-10", nextAction:"Present Q1 impact report by Jan 15", priority:"High" },
  { id:2, name:"Ravi Mehta (MP)", category:"Political", organization:"State Legislature", role:"Key Decision Influencer", influence:"High", interest:"Medium", position:"Neutral", strategy:"Consult (Keep satisfied)", owner:"Anil Verma", recentDevelopments:"Re-elected Nov 2024; new portfolio assigned", engagementHistory:"1 introductory meeting; newsletter subscriber", opportunityWindow:"New term consultations – Feb 2025", lastInteraction:"2024-11-20", nextAction:"Schedule meeting for new term", priority:"High" },
  { id:3, name:"GreenFuture NGO", category:"NGO/Civil Society", organization:"GreenFuture Foundation", role:"Community Advocate & Watchdog", influence:"Medium", interest:"High", position:"Resistant", strategy:"Engage (Manage closely)", owner:"Sunita Rao", recentDevelopments:"Published critical report on environmental impact", engagementHistory:"2 consultations; ongoing correspondence", opportunityWindow:"Annual stakeholder forum – April 2025", lastInteraction:"2024-12-01", nextAction:"Address environmental concerns in briefing doc", priority:"High" },
  { id:4, name:"Infra Corp Ltd", category:"Corporate", organization:"Infra Corp Ltd", role:"Implementation Partner", influence:"High", interest:"High", position:"Supportive", strategy:"Engage (Manage closely)", owner:"Rajan Kapoor", recentDevelopments:"MOU signed October 2024", engagementHistory:"Weekly project calls; 5 site visits conducted", opportunityWindow:"Contract renewal – Q1 2025", lastInteraction:"2024-12-15", nextAction:"Review deliverable milestone report", priority:"High" },
  { id:5, name:"Jodhpur State University", category:"Academic", organization:"State University", role:"Research & Knowledge Partner", influence:"Medium", interest:"Medium", position:"Supportive", strategy:"Keep Informed", owner:"Priya Sharma", recentDevelopments:"New research dept head appointed", engagementHistory:"1 joint workshop; collaboration proposed", opportunityWindow:"Research grant application – March 2025", lastInteraction:"2024-10-05", nextAction:"Send project data for research use", priority:"Medium" },
  { id:6, name:"Daily Tribune", category:"Media", organization:"Tribune Media Group", role:"Public Narrative Shaper", influence:"Medium", interest:"Low", position:"Neutral", strategy:"Keep Informed", owner:"Anil Verma", recentDevelopments:"Covered project launch Oct 2024", engagementHistory:"1 press briefing; press release issued", opportunityWindow:"Milestone announcement – Q2 2025", lastInteraction:"2024-10-20", nextAction:"Prepare media kit for next milestone", priority:"Medium" },
  { id:7, name:"Residents Welfare Assoc.", category:"Community", organization:"Sector 7 RWA", role:"Affected Community Representative", influence:"Low", interest:"High", position:"Resistant", strategy:"Consult (Keep satisfied)", owner:"Sunita Rao", recentDevelopments:"Submitted formal objection Dec 2024", engagementHistory:"Town hall meeting; 2 grievance sessions", opportunityWindow:"Community review – Jan 2025", lastInteraction:"2024-12-05", nextAction:"Respond to formal objection within 10 days", priority:"High" },
  { id:8, name:"World Bank Mission", category:"International", organization:"World Bank Group", role:"Funding & Technical Advisor", influence:"High", interest:"Medium", position:"Supportive", strategy:"Consult (Keep satisfied)", owner:"Rajan Kapoor", recentDevelopments:"Supervision mission scheduled Feb 2025", engagementHistory:"Biannual reviews; ongoing reporting", opportunityWindow:"Supervision mission – Feb 2025", lastInteraction:"2024-09-15", nextAction:"Prepare progress report for mission", priority:"Medium" },
];

// ── helpers ────────────────────────────────────────────────────────────────
const CAT_COLORS = {
  Government:"#818cf8", Political:"#a78bfa", "NGO/Civil Society":"#34d399",
  Corporate:"#60a5fa", Academic:"#f59e0b", Media:"#fb7185",
  Community:"#f97316", International:"#2dd4bf",
};

const levelStyle = v => ({
  High:   { bg:"rgba(239,68,68,.15)",   text:"#f87171", border:"rgba(239,68,68,.35)" },
  Medium: { bg:"rgba(245,158,11,.15)",  text:"#fbbf24", border:"rgba(245,158,11,.35)" },
  Low:    { bg:"rgba(16,185,129,.15)",  text:"#34d399", border:"rgba(16,185,129,.35)" },
}[v] || { bg:"rgba(100,116,139,.15)", text:"#94a3b8", border:"rgba(100,116,139,.35)" });

const posStyle = v => ({
  Supportive: { bg:"rgba(16,185,129,.15)",  text:"#34d399", border:"rgba(16,185,129,.35)" },
  Neutral:    { bg:"rgba(100,116,139,.15)", text:"#94a3b8", border:"rgba(100,116,139,.35)" },
  Resistant:  { bg:"rgba(239,68,68,.15)",   text:"#f87171", border:"rgba(239,68,68,.35)" },
}[v] || { bg:"rgba(100,116,139,.15)", text:"#94a3b8", border:"rgba(100,116,139,.35)" });

const initials = n => n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const truncate  = (s,n) => s?.length > n ? s.slice(0,n)+"…" : s;

const Badge = ({ val, styleFn = levelStyle }) => {
  const c = styleFn(val);
  return (
    <span style={{ background:c.bg, color:c.text, border:`1px solid ${c.border}`,
      fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:6, whiteSpace:"nowrap" }}>
      {val}
    </span>
  );
};

// ── theme ─────────────────────────────────────────────────────────────────
const T = {
  bg:      "#0d1117",
  card:    "#161b22",
  border:  "#21262d",
  text:    "#e2e8f0",
  muted:   "#8b949e",
  accent:  "#4f46e5",
  accentL: "#818cf8",
  input:   "#0d1117",
};

// ── ui primitives ──────────────────────────────────────────────────────────
const Card = ({ style={}, ...p }) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`,
    borderRadius:12, ...style }} {...p} />
);

const Overlay = ({ children, onClose }) => (
  <div
    onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position:"fixed", inset:0, zIndex:50,
      background:"rgba(0,0,0,.7)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:16 }}>
    {children}
  </div>
);

// ── form ──────────────────────────────────────────────────────────────────
function StakeholderForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial ?? EMPTY_FORM);
  const set = (k,v) => setF(p => ({ ...p, [k]:v }));

  const inputStyle = {
    width:"100%", padding:"8px 12px", borderRadius:8, fontSize:13,
    border:`1px solid ${T.border}`, background:T.input,
    color:T.text, outline:"none", boxSizing:"border-box",
  };

  const Field = ({ label, name, type="text", opts }) => (
    <div>
      <label style={{ display:"block", fontSize:11, fontWeight:600,
        color:T.muted, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>
        {label}
      </label>
      {opts ? (
        <select value={f[name]} onChange={e=>set(name,e.target.value)} style={inputStyle}>
          {opts.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      ) : type==="textarea" ? (
        <textarea value={f[name]} onChange={e=>set(name,e.target.value)}
          rows={2} style={{ ...inputStyle, resize:"vertical" }} />
      ) : (
        <input type={type} value={f[name]} onChange={e=>set(name,e.target.value)} style={inputStyle} />
      )}
    </div>
  );

  return (
    <Overlay onClose={onClose}>
      <div style={{ background:T.card, border:`1px solid ${T.border}`,
        borderRadius:16, width:"100%", maxWidth:680,
        maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"20px 24px", borderBottom:`1px solid ${T.border}` }}>
          <span style={{ color:T.text, fontSize:16, fontWeight:600 }}>
            {initial?.id ? "Edit Stakeholder" : "Add Stakeholder"}
          </span>
          <button onClick={onClose} style={{ background:"none", border:"none",
            cursor:"pointer", color:T.muted, padding:4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding:24, display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ gridColumn:"1/-1" }}><Field label="Stakeholder Name *" name="name" /></div>
          <Field label="Category" name="category" opts={CATEGORIES} />
          <Field label="Organization" name="organization" />
          <div style={{ gridColumn:"1/-1" }}><Field label="Role in Ecosystem" name="role" /></div>
          <Field label="Influence" name="influence" opts={LEVELS} />
          <Field label="Interest" name="interest" opts={LEVELS} />
          <Field label="Position" name="position" opts={POSITIONS} />
          <Field label="Priority" name="priority" opts={PRIORITIES} />
          <Field label="Engagement Strategy" name="strategy" opts={STRATEGIES} />
          <Field label="Owner" name="owner" />
          <div style={{ gridColumn:"1/-1" }}><Field label="Recent Developments" name="recentDevelopments" type="textarea" /></div>
          <div style={{ gridColumn:"1/-1" }}><Field label="Engagement History" name="engagementHistory" type="textarea" /></div>
          <div style={{ gridColumn:"1/-1" }}><Field label="Opportunity Window" name="opportunityWindow" /></div>
          <Field label="Last Interaction Date" name="lastInteraction" type="date" />
          <Field label="Next Action" name="nextAction" />
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", gap:10,
          padding:"16px 24px", borderTop:`1px solid ${T.border}` }}>
          <button onClick={onClose}
            style={{ padding:"9px 18px", borderRadius:8, fontSize:13, cursor:"pointer",
              background:T.border, border:"none", color:T.muted }}>
            Cancel
          </button>
          <button onClick={() => f.name.trim() && onSave(f)}
            style={{ padding:"9px 18px", borderRadius:8, fontSize:13, cursor:"pointer",
              background: f.name.trim() ? T.accent : "#2d2d3a",
              border:"none", color:"white", fontWeight:600 }}>
            Save Stakeholder
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── detail modal ──────────────────────────────────────────────────────────
function DetailModal({ s, onClose, onEdit }) {
  const Row = ({ label, value }) => !value ? null : (
    <div style={{ paddingBottom:12, marginBottom:12, borderBottom:`1px solid ${T.border}` }}>
      <div style={{ fontSize:11, color:T.muted, textTransform:"uppercase",
        letterSpacing:.5, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:13, color:T.text, lineHeight:1.5 }}>{value}</div>
    </div>
  );

  return (
    <Overlay onClose={onClose}>
      <div style={{ background:T.card, border:`1px solid ${T.border}`,
        borderRadius:16, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"20px 24px", borderBottom:`1px solid ${T.border}` }}>
          <span style={{ color:T.text, fontSize:16, fontWeight:600 }}>Stakeholder Profile</span>
          <button onClick={onClose} style={{ background:"none", border:"none",
            cursor:"pointer", color:T.muted, padding:4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
            <div style={{ width:52, height:52, borderRadius:14, flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:17, fontWeight:700,
              background: CAT_COLORS[s.category]+"22", color: CAT_COLORS[s.category] }}>
              {initials(s.name)}
            </div>
            <div>
              <div style={{ color:T.text, fontSize:17, fontWeight:600 }}>{s.name}</div>
              <div style={{ color:T.muted, fontSize:12, marginTop:2 }}>{s.organization}</div>
              <div style={{ color:T.muted, fontSize:12 }}>{s.role}</div>
            </div>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:20 }}>
            <Badge val={s.influence} />
            <Badge val={s.interest} />
            <Badge val={s.position} styleFn={posStyle} />
            <Badge val={s.priority} />
            <span style={{ background: CAT_COLORS[s.category]+"22",
              color: CAT_COLORS[s.category], border:`1px solid ${CAT_COLORS[s.category]}44`,
              fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:6 }}>
              {s.category}
            </span>
          </div>
          <Row label="Organization" value={s.organization} />
          <Row label="Engagement Strategy" value={s.strategy} />
          <Row label="Owner" value={s.owner} />
          <Row label="Recent Developments" value={s.recentDevelopments} />
          <Row label="Engagement History" value={s.engagementHistory} />
          <Row label="Opportunity Window" value={s.opportunityWindow} />
          <Row label="Last Interaction" value={s.lastInteraction} />
          <Row label="Next Action" value={s.nextAction} />
          <button onClick={onEdit}
            style={{ width:"100%", padding:"10px", borderRadius:8, fontSize:13,
              fontWeight:600, cursor:"pointer", background:T.accent,
              border:"none", color:"white", marginTop:4 }}>
            Edit Stakeholder
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── dashboard ──────────────────────────────────────────────────────────────
function Dashboard({ data }) {
  const stats = useMemo(() => ({
    total:       data.length,
    highPri:     data.filter(s=>s.priority==="High").length,
    supportive:  data.filter(s=>s.position==="Supportive").length,
    resistant:   data.filter(s=>s.position==="Resistant").length,
  }), [data]);

  const matrixCells = useMemo(() => {
    const m = {};
    LEVELS.forEach(inf => LEVELS.forEach(int => {
      m[`${inf}|${int}`] = data.filter(s=>s.influence===inf && s.interest===int);
    }));
    return m;
  }, [data]);

  const quadrant = (inf, int) => {
    if (inf==="High" && int==="High")   return { label:"Manage Closely", color:"#818cf8" };
    if (inf==="High")                   return { label:"Keep Satisfied",  color:"#60a5fa" };
    if (int==="High")                   return { label:"Keep Informed",   color:"#34d399" };
    return                                     { label:"Monitor",         color:"#8b949e" };
  };

  const catBreak = useMemo(() => {
    const c = {};
    data.forEach(s => { c[s.category]=(c[s.category]||0)+1; });
    return Object.entries(c).sort((a,b)=>b[1]-a[1]);
  }, [data]);

  const upcoming = [...data]
    .filter(s=>s.nextAction)
    .sort((a,b)=>a.lastInteraction.localeCompare(b.lastInteraction))
    .slice(0,5);

  const statCards = [
    { label:"Total Stakeholders", value:stats.total,      Icon:Users,         color:"#818cf8" },
    { label:"High Priority",      value:stats.highPri,    Icon:AlertTriangle, color:"#f87171" },
    { label:"Supportive",         value:stats.supportive, Icon:CheckCircle2,  color:"#34d399" },
    { label:"Resistant",          value:stats.resistant,  Icon:TrendingUp,    color:"#fb7185" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {statCards.map(({ label, value, Icon, color }) => (
          <Card key={label} style={{ padding:18 }}>
            <div style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:12 }}>
              <span style={{ fontSize:12, color:T.muted }}>{label}</span>
              <div style={{ width:32, height:32, borderRadius:8,
                background:color+"22", display:"flex",
                alignItems:"center", justifyContent:"center" }}>
                <Icon size={14} color={color} />
              </div>
            </div>
            <div style={{ fontSize:32, fontWeight:700, color:T.text }}>{value}</div>
          </Card>
        ))}
      </div>

      {/* matrix + right panel */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:14 }}>
        {/* influence/interest matrix */}
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:16 }}>
            Influence / Interest Matrix
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {/* Y-axis label */}
            <div style={{ display:"flex", flexDirection:"column",
              justifyContent:"space-around", paddingBottom:28 }}>
              {LEVELS.map(l => (
                <span key={l} style={{ fontSize:11, color:T.muted,
                  writingMode:"horizontal-tb", textAlign:"right", width:36 }}>{l}</span>
              ))}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
                gridTemplateRows:"repeat(3,1fr)", gap:6, height:240 }}>
                {LEVELS.map(inf =>
                  ["Low","Medium","High"].map(int => {
                    const items = matrixCells[`${inf}|${int}`] || [];
                    const q = quadrant(inf, int);
                    return (
                      <div key={`${inf}|${int}`}
                        style={{ borderRadius:8, padding:8,
                          background:q.color+"14",
                          border:`1px solid ${q.color}28`,
                          display:"flex", flexDirection:"column" }}>
                        <div style={{ fontSize:9, color:q.color, fontWeight:700,
                          marginBottom:4, textTransform:"uppercase",
                          letterSpacing:.5 }}>{q.label}</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginTop:"auto" }}>
                          {items.map(s => (
                            <div key={s.id}
                              title={s.name}
                              style={{ width:24, height:24, borderRadius:"50%",
                                display:"flex", alignItems:"center",
                                justifyContent:"center", fontSize:8, fontWeight:700,
                                background: CAT_COLORS[s.category]+"33",
                                color: CAT_COLORS[s.category], cursor:"default" }}>
                              {initials(s.name)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {/* X-axis */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
                gap:6, marginTop:6 }}>
                {["Low","Medium","High"].map(l => (
                  <div key={l} style={{ textAlign:"center",
                    fontSize:11, color:T.muted }}>{l}</div>
                ))}
              </div>
              <div style={{ textAlign:"center", fontSize:11,
                color:T.muted, marginTop:4 }}>← Interest →</div>
            </div>
          </div>
        </Card>

        {/* right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* category breakdown */}
          <Card style={{ padding:18 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:14 }}>
              By Category
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {catBreak.map(([cat, count]) => (
                <div key={cat} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%",
                    background: CAT_COLORS[cat], flexShrink:0 }} />
                  <span style={{ flex:1, fontSize:12, color:T.muted }}>{cat}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* upcoming actions */}
          <Card style={{ padding:18, flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:14 }}>
              Pending Actions
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {upcoming.map(s => {
                const lc = levelStyle(s.priority);
                return (
                  <div key={s.id} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                    <div style={{ width:6, height:6, borderRadius:"50%",
                      background:lc.text, flexShrink:0, marginTop:4 }} />
                    <div>
                      <div style={{ fontSize:12, fontWeight:600,
                        color:T.text, lineHeight:1.3 }}>{s.name}</div>
                      <div style={{ fontSize:11, color:T.muted,
                        lineHeight:1.4, marginTop:1 }}>
                        {truncate(s.nextAction, 55)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── stakeholder table ──────────────────────────────────────────────────────
function StakeholderTable({ data, onAdd, onEdit, onDelete, onView }) {
  const [search,  setSearch]  = useState("");
  const [filters, setFilters] = useState({ priority:"", influence:"", position:"", category:"" });
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState(1);

  const filtered = useMemo(() => {
    return data
      .filter(s => {
        const q = search.toLowerCase();
        if (q && !s.name.toLowerCase().includes(q) &&
            !s.organization.toLowerCase().includes(q) &&
            !s.owner.toLowerCase().includes(q)) return false;
        if (filters.priority  && s.priority  !== filters.priority)  return false;
        if (filters.influence && s.influence !== filters.influence) return false;
        if (filters.position  && s.position  !== filters.position)  return false;
        if (filters.category  && s.category  !== filters.category)  return false;
        return true;
      })
      .sort((a,b) => ((a[sortKey]||"").localeCompare(b[sortKey]||"")) * sortDir);
  }, [data, search, filters, sortKey, sortDir]);

  const toggleSort = k => {
    if (sortKey===k) setSortDir(d=>-d); else { setSortKey(k); setSortDir(1); }
  };

  const sf = { background:T.card, border:`1px solid ${T.border}`,
    borderRadius:8, padding:"7px 12px", fontSize:12,
    color:T.muted, outline:"none", cursor:"pointer" };

  const cols = [
    { k:"name",            label:"Stakeholder" },
    { k:"category",        label:"Category"    },
    { k:"organization",    label:"Organization" },
    { k:"influence",       label:"Influence"   },
    { k:"interest",        label:"Interest"    },
    { k:"position",        label:"Position"    },
    { k:"priority",        label:"Priority"    },
    { k:"owner",           label:"Owner"       },
    { k:"lastInteraction", label:"Last Seen"   },
    { k:null,              label:"Actions"     },
  ];

  return (
    <div>
      {/* toolbar */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap",
        alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, minWidth:180 }}>
          <Search size={13} style={{ position:"absolute", left:10,
            top:"50%", transform:"translateY(-50%)", color:T.muted }} />
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name, org or owner…"
            style={{ ...sf, width:"100%", paddingLeft:32,
              boxSizing:"border-box", color:T.text }} />
        </div>
        {[
          { k:"priority",  opts:PRIORITIES, ph:"Priority"  },
          { k:"influence", opts:LEVELS,     ph:"Influence" },
          { k:"position",  opts:POSITIONS,  ph:"Position"  },
          { k:"category",  opts:CATEGORIES, ph:"Category"  },
        ].map(({ k, opts, ph }) => (
          <select key={k} value={filters[k]}
            onChange={e=>setFilters(p=>({...p,[k]:e.target.value}))}
            style={{ ...sf, color: filters[k] ? T.text : T.muted }}>
            <option value="">{ph}</option>
            {opts.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <span style={{ fontSize:12, color:T.muted, whiteSpace:"nowrap" }}>
          {filtered.length} of {data.length}
        </span>
        <button onClick={onAdd}
          style={{ display:"flex", alignItems:"center", gap:6,
            padding:"8px 14px", borderRadius:8, fontSize:12,
            fontWeight:600, background:T.accent, border:"none",
            color:"white", cursor:"pointer", whiteSpace:"nowrap" }}>
          <Plus size={13} /> Add Stakeholder
        </button>
      </div>

      {/* table */}
      <Card style={{ overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse",
            background:"transparent" }}>
            <thead>
              <tr style={{ background:T.bg }}>
                {cols.map(({ k, label }) => (
                  <th key={label}
                    onClick={() => k && toggleSort(k)}
                    style={{ padding:"10px 14px", textAlign:"left",
                      fontSize:11, fontWeight:600,
                      color: sortKey===k ? T.accentL : T.muted,
                      borderBottom:`1px solid ${T.border}`,
                      cursor: k ? "pointer" : "default",
                      whiteSpace:"nowrap", letterSpacing:.3,
                      textTransform:"uppercase",
                      userSelect:"none" }}>
                    {label}{sortKey===k ? (sortDir===1?" ↑":" ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s,i) => (
                <tr key={s.id}
                  style={{ borderBottom:`1px solid ${T.border}`,
                    background: i%2===0 ? "transparent" : "rgba(255,255,255,.015)" }}>
                  {/* name */}
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:8,
                        flexShrink:0, display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:11, fontWeight:700,
                        background: CAT_COLORS[s.category]+"22",
                        color: CAT_COLORS[s.category] }}>
                        {initials(s.name)}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600,
                          color:T.text, whiteSpace:"nowrap" }}>{s.name}</div>
                        <div style={{ fontSize:11, color:T.muted }}>
                          {truncate(s.role,34)}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* category */}
                  <td style={{ padding:"12px 14px" }}>
                    <span style={{ background: CAT_COLORS[s.category]+"22",
                      color: CAT_COLORS[s.category],
                      border:`1px solid ${CAT_COLORS[s.category]}44`,
                      fontSize:11, fontWeight:600, padding:"2px 8px",
                      borderRadius:6, whiteSpace:"nowrap" }}>
                      {s.category}
                    </span>
                  </td>
                  {/* org */}
                  <td style={{ padding:"12px 14px", fontSize:12,
                    color:T.muted, whiteSpace:"nowrap" }}>{s.organization}</td>
                  {/* badges */}
                  <td style={{ padding:"12px 14px" }}><Badge val={s.influence} /></td>
                  <td style={{ padding:"12px 14px" }}><Badge val={s.interest}  /></td>
                  <td style={{ padding:"12px 14px" }}><Badge val={s.position} styleFn={posStyle} /></td>
                  <td style={{ padding:"12px 14px" }}><Badge val={s.priority} /></td>
                  {/* owner */}
                  <td style={{ padding:"12px 14px", fontSize:12,
                    color:T.muted, whiteSpace:"nowrap" }}>{s.owner}</td>
                  {/* date */}
                  <td style={{ padding:"12px 14px", fontSize:12,
                    color:T.muted, whiteSpace:"nowrap" }}>{s.lastInteraction}</td>
                  {/* actions */}
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", gap:2 }}>
                      {[
                        { fn:()=>onView(s),   Icon:Eye,    title:"View"   },
                        { fn:()=>onEdit(s),   Icon:Edit2,  title:"Edit"   },
                        { fn:()=>onDelete(s.id), Icon:Trash2, title:"Delete" },
                      ].map(({ fn, Icon, title }) => (
                        <button key={title} onClick={fn} title={title}
                          style={{ background:"none", border:"none", cursor:"pointer",
                            color:T.muted, padding:6, borderRadius:6 }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.08)"}
                          onMouseLeave={e=>e.currentTarget.style.background="none"}>
                          <Icon size={13} />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr>
                  <td colSpan={10} style={{ padding:"48px", textAlign:"center",
                    fontSize:13, color:T.muted }}>
                    No stakeholders match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── root app ───────────────────────────────────────────────────────────────
export default function App() {
  const [data,   setData]   = useState([]);
  const [view,   setView]   = useState("dashboard");
  const [modal,  setModal]  = useState(null); // null | {type,data?}
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: stakeholders, error } = await supabase
          .from('stakeholders')
          .select('*')
          .order('id');
        
        if (error) throw error;
        
        // Map snake_case from DB to camelCase for UI
        const mapped = (stakeholders || []).map(s => ({
          ...s,
          recentDevelopments: s.recent_developments,
          engagementHistory: s.engagement_history,
          opportunityWindow: s.opportunity_window,
          lastInteraction: s.last_interaction,
          nextAction: s.next_action,
        }));
        
        setData(mapped);
      } catch (err) {
        console.error('Error fetching stakeholders:', err);
        // Fall back to MOCK data for demo
        setData(MOCK);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleSave = async (form) => {
    try {
      // Map camelCase form to snake_case for Supabase
      const row = {
        name: form.name,
        category: form.category,
        organization: form.organization,
        role: form.role,
        influence: form.influence,
        interest: form.interest,
        position: form.position,
        strategy: form.strategy,
        owner: form.owner,
        recent_developments: form.recentDevelopments,
        engagement_history: form.engagementHistory,
        opportunity_window: form.opportunityWindow,
        last_interaction: form.lastInteraction,
        next_action: form.nextAction,
        priority: form.priority,
      };

      if (form.id) {
        // Update existing
        const { data: updated, error } = await supabase
          .from('stakeholders')
          .update(row)
          .eq('id', form.id)
          .select();
        
        if (error) throw error;
        
        const mapped = {
          ...updated[0],
          recentDevelopments: updated[0].recent_developments,
          engagementHistory: updated[0].engagement_history,
          opportunityWindow: updated[0].opportunity_window,
          lastInteraction: updated[0].last_interaction,
          nextAction: updated[0].next_action,
        };
        
        setData(prev => prev.map(s => s.id === form.id ? mapped : s));
      } else {
        // Insert new
        const { data: inserted, error } = await supabase
          .from('stakeholders')
          .insert(row)
          .select();
        
        if (error) throw error;
        
        const mapped = {
          ...inserted[0],
          recentDevelopments: inserted[0].recent_developments,
          engagementHistory: inserted[0].engagement_history,
          opportunityWindow: inserted[0].opportunity_window,
          lastInteraction: inserted[0].last_interaction,
          nextAction: inserted[0].next_action,
        };
        
        setData(prev => [...prev, mapped]);
      }
      
      setModal(null);
    } catch (err) {
      console.error('Error saving stakeholder:', err);
      alert('Error saving stakeholder: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this stakeholder from the register?")) {
      try {
        const { error } = await supabase
          .from('stakeholders')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        setData(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        console.error('Error deleting stakeholder:', err);
        alert('Error deleting stakeholder: ' + err.message);
      }
    }
  };

  const navItems = [
    { id:"dashboard",    Icon:LayoutDashboard, label:"Dashboard"    },
    { id:"stakeholders", Icon:Users,           label:"Stakeholders" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        body { background: ${T.bg}; font-family: 'Plus Jakarta Sans', sans-serif; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:${T.bg}; }
        ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:3px; }
        select option { background:${T.card}; color:${T.text}; }
      `}</style>

      <div style={{ display:"flex", height:"100vh",
        background:T.bg, fontFamily:"'Plus Jakarta Sans', sans-serif",
        overflow:"hidden" }}>

        {/* sidebar */}
        <div style={{ width:220, flexShrink:0, display:"flex", flexDirection:"column",
          background:T.card, borderRight:`1px solid ${T.border}` }}>

          {/* logo */}
          <div style={{ padding:"22px 20px 14px" }}>
            <div style={{ fontFamily:"'Syne', sans-serif", fontWeight:800,
              fontSize:20, lineHeight:1.1 }}>
              <span style={{ color:T.text }}>Stake</span>
              <span style={{ color:T.accentL }}>Hub</span>
            </div>
            <div style={{ fontSize:11, color:T.muted, marginTop:3 }}>
              Engagement Dashboard
            </div>
          </div>

          {/* nav */}
          <nav style={{ padding:"0 10px", flex:1 }}>
            {navItems.map(({ id, Icon, label }) => {
              const active = view===id;
              return (
                <button key={id} onClick={()=>setView(id)}
                  style={{ width:"100%", display:"flex", alignItems:"center",
                    gap:10, padding:"9px 12px", borderRadius:8, marginBottom:2,
                    background: active ? T.accent+"22" : "transparent",
                    border: active ? `1px solid ${T.accent}33` : "1px solid transparent",
                    color: active ? T.accentL : T.muted,
                    fontSize:13, fontWeight:500, cursor:"pointer", textAlign:"left" }}>
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* project badge */}
          <div style={{ margin:12, padding:12, borderRadius:10,
            background:T.bg, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:10, color:T.muted,
              textTransform:"uppercase", letterSpacing:.5, marginBottom:3 }}>Project</div>
            <div style={{ fontSize:13, fontWeight:600, color:T.text }}>
              Infrastructure Demo
            </div>
            <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
              {data.length} stakeholders registered
            </div>
          </div>
        </div>

        {/* main area */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* header */}
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", padding:"16px 24px",
            borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
            <div>
              <h1 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800,
                fontSize:22, color:T.text, lineHeight:1 }}>
                {view==="dashboard" ? "Dashboard" : "Stakeholders"}
              </h1>
              <p style={{ fontSize:12, color:T.muted, marginTop:4 }}>
                {view==="dashboard"
                  ? "Overview of engagement status and priority areas"
                  : "Register — search, filter and manage all stakeholders"}
              </p>
            </div>
            {view==="dashboard" && (
              <button onClick={()=>setView("stakeholders")}
                style={{ display:"flex", alignItems:"center", gap:6,
                  padding:"8px 16px", borderRadius:8, fontSize:12,
                  fontWeight:600, background:"transparent",
                  border:`1px solid ${T.border}`,
                  color:T.muted, cursor:"pointer" }}>
                <Users size={13} /> View All
              </button>
            )}
          </div>

          {/* content */}
          <div style={{ flex:1, overflowY:"auto", padding:24 }}>
            {view==="dashboard" && (
              <Dashboard data={data} />
            )}
            {view==="stakeholders" && (
              <StakeholderTable
                data={data}
                onAdd={()=>setModal({ type:"add" })}
                onEdit={s=>setModal({ type:"edit", data:s })}
                onDelete={handleDelete}
                onView={s=>setModal({ type:"detail", data:s })}
              />
            )}
          </div>
        </div>
      </div>

      {/* modals */}
      {modal?.type==="add" && (
        <StakeholderForm onSave={handleSave} onClose={()=>setModal(null)} />
      )}
      {modal?.type==="edit" && (
        <StakeholderForm initial={modal.data} onSave={handleSave} onClose={()=>setModal(null)} />
      )}
      {modal?.type==="detail" && (
        <DetailModal
          s={modal.data}
          onClose={()=>setModal(null)}
          onEdit={()=>setModal({ type:"edit", data:modal.data })}
        />
      )}
    </>
  );
}
