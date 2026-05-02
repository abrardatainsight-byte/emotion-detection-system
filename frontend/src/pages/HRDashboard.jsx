import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, LineChart, Line,
} from "recharts";
import {
  getGlobalPulse, getDistribution, getWeeklyTrend,
  getIntensity, getResults, getEmployees, getMatrix,
  triggerCapture, EMOTION_COLORS, ALL_EMOTIONS, relativeTime,
} from "../services/api.js";

// ─── constants ───────────────────────────────────────────────────────────────
const RANGES = ["1h", "Today", "Week", "Month"];
const rangeKey = (r) => r.toLowerCase();

const NAV = [
  {
    id: "Global Pulse",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    id: "Macro Analytics",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    id: "Insight Hub",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

// ─── helpers ─────────────────────────────────────────────────────────────────
function EmotionBadge({ emotion, score }) {
  const color = EMOTION_COLORS[emotion] || "#94A3B8";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px", borderRadius: 99,
      background: color + "1A", color, border: `1px solid ${color}33`,
      fontSize: 13, fontWeight: 600,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
      {emotion}
      {score != null && (
        <span style={{ opacity: 0.65, fontWeight: 400, fontFamily: "monospace" }}>
          {Math.round(score * 100)}%
        </span>
      )}
    </span>
  );
}

function RangeSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 10, padding: 3, gap: 2 }}>
      {RANGES.map((r) => (
        <button key={r} onClick={() => onChange(rangeKey(r))}
          style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 500, transition: "all .15s",
            background: rangeKey(r) === value ? "#fff" : "transparent",
            color: rangeKey(r) === value ? "#1E293B" : "#64748B",
            boxShadow: rangeKey(r) === value ? "0 1px 3px rgba(0,0,0,.1)" : "none",
          }}>
          {r}
        </button>
      ))}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      {label && <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#1E293B" }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color || p.fill }} />
          <span style={{ color: "#64748B" }}>{p.name}</span>
          <span style={{ fontWeight: 600, color: "#1E293B", marginLeft: "auto", paddingLeft: 12 }}>{Math.round(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

function ChartCard({ title, subtitle, children, action }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: "28px 28px 20px", boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>{title}</h3>
          {subtitle && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Skeleton({ h = 220 }) {
  return (
    <div style={{ height: h, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "200%", borderRadius: 10, animation: "shimmer 1.5s infinite" }} />
  );
}

function EmptyState({ message }) {
  return (
    <div style={{ height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" /><path d="M13 21l2-2 4 4" /><circle cx="18" cy="18" r="3" /></svg>
      <p style={{ marginTop: 12, fontSize: 14 }}>{message}</p>
    </div>
  );
}

// ─── Global Pulse tab ─────────────────────────────────────────────────────────
function GlobalPulseTab({ range }) {
  const [pulse, setPulse] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    try { setPulse(await getGlobalPulse(range)); } catch {}
  }, [range]);

  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, [load]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try { await triggerCapture(); setTimeout(() => { load(); setAnalyzing(false); }, 4000); }
    catch { setAnalyzing(false); }
  };

  const dominant = pulse?.dominant_emotion || "Neutral";
  const hex = EMOTION_COLORS[dominant] || "#5B4FDB";

  return (
    <div>
      {/* Emotion overview cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {["Happy", "Neutral", "Stress"].map((e) => {
          const c = EMOTION_COLORS[e];
          return (
            <div key={e} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)", borderTop: `3px solid ${c}` }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8" }}>{e}</p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: c }}>
                {pulse ? (pulse.live_ticker?.filter(t => t.includes(e)).length || "—") : "—"}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748B" }}>recent signals</p>
            </div>
          );
        })}
      </div>

      {/* 3-column hero grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 20 }}>

        {/* Total active */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8" }}>Total Active Talent</p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#DCFCE7", color: "#166534", borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} /> LIVE
            </span>
          </div>
          <p style={{ margin: "24px 0 0", fontSize: 72, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.04em", lineHeight: 1 }}>
            {pulse?.total_active ?? 0}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#94A3B8" }}>employees streaming in window</p>
          <button onClick={runAnalysis} disabled={analyzing}
            style={{ marginTop: 20, padding: "10px 0", background: analyzing ? "#94A3B8" : "linear-gradient(135deg,#4F46E5,#3B82F6)", color: "#fff", border: "none", borderRadius: 10, cursor: analyzing ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14 }}>
            {analyzing ? "Processing…" : "▶ Run Analysis"}
          </button>
        </div>

        {/* Dominant vibe orb */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" }}>
          <p style={{ margin: "0 0 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8", alignSelf: "flex-start" }}>Dominant Vibe</p>
          <div style={{
            width: 220, height: 220, borderRadius: "50%",
            background: `radial-gradient(circle at 35% 35%, ${hex}44 0%, ${hex}22 40%, ${hex}08 70%, transparent 85%)`,
            border: `2px solid ${hex}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 60px ${hex}22`,
            animation: "pulse 4s ease-in-out infinite",
          }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: hex }}>{dominant}</span>
          </div>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#F8FAFC", borderRadius: 99, fontSize: 13, color: "#475569", fontWeight: 500 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            Live monitoring active
          </div>
        </div>

        {/* Live ticker */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <svg width="14" height="14" fill="none" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8" }}>Live Ticker</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(pulse?.live_ticker || ["System connected. Monitoring…"]).slice(0, 5).map((line, i) => {
              const match = line.match(/— (\w+)/);
              const c = match ? (EMOTION_COLORS[match[1]] || "#94A3B8") : "#3B82F6";
              return (
                <div key={i} style={{ borderLeft: `3px solid ${c}`, paddingLeft: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.4 }}>{line}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Macro Analytics tab ──────────────────────────────────────────────────────
function MacroAnalyticsTab({ range }) {
  const [dist, setDist] = useState(null);
  const [trend, setTrend] = useState(null);
  const [intensity, setIntensity] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, t, i, m] = await Promise.all([
        getDistribution(range),
        getWeeklyTrend(),
        getIntensity(),
        getMatrix(range),
      ]);
      setDist(d); setTrend(t); setIntensity(i); setMatrix(m);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  // Pie data
  const pieData = dist
    ? ALL_EMOTIONS.map((e) => ({ name: e, value: dist.distribution[e] || 0, fill: EMOTION_COLORS[e] })).filter(d => d.value > 0)
    : [];
  const total = dist?.total || 0;

  // Emotion card row totals from distribution
  const emotionCards = ALL_EMOTIONS.map((e) => ({
    name: e,
    count: dist?.distribution[e] || 0,
    pct: total ? Math.round(((dist?.distribution[e] || 0) / total) * 100) : 0,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Emotion mini-cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 10 }}>
        {emotionCards.map(({ name, count, pct }) => {
          const c = EMOTION_COLORS[name];
          return (
            <div key={name} style={{ background: "#fff", borderRadius: 14, padding: "14px 10px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)", borderTop: `3px solid ${c}` }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>{name}</p>
              <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color: c, lineHeight: 1 }}>{count}</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748B" }}>{pct}%</p>
            </div>
          );
        })}
      </div>

      {/* Charts 2×2 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Chart 1 — Distribution donut */}
        <ChartCard title="Emotion Distribution" subtitle={`${total} total signals`}>
          {loading ? <Skeleton /> : pieData.length === 0 ? <EmptyState message="No signals in this window" /> : (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ height: 220, flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                      {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {pieData.map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: d.fill, flexShrink: 0 }} />
                    <span style={{ color: "#475569" }}>{d.name}</span>
                    <span style={{ color: "#94A3B8", fontFamily: "monospace", marginLeft: "auto", paddingLeft: 10 }}>
                      {Math.round((d.value / total) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Chart 2 — Weekly stacked area */}
        <ChartCard title="Weekly Emotion Trend" subtitle="last 7 days">
          {loading ? <Skeleton /> : !trend?.length ? <EmptyState message="Trend builds over multiple days" /> : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    {ALL_EMOTIONS.map((e) => (
                      <linearGradient key={e} id={`g-${e}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={EMOTION_COLORS[e]} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={EMOTION_COLORS[e]} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip content={<CustomTooltip />} />
                  {ALL_EMOTIONS.map((e) => (
                    <Area key={e} type="monotone" dataKey={e} name={e} stackId="1"
                      stroke={EMOTION_COLORS[e]} fill={`url(#g-${e})`} strokeWidth={1.5} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Chart 3 — Grouped bar (current vs prev) */}
        <ChartCard title="Emotion Frequency" subtitle="current window breakdown">
          {loading ? <Skeleton /> : pieData.length === 0 ? <EmptyState message="No data yet" /> : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} angle={-35} textAnchor="end" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Count" radius={[5, 5, 0, 0]}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Chart 4 — Intensity line */}
        <ChartCard title="Emotional Intensity" subtitle="daily wellbeing score 0-100"
          action={intensity ? <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 800, color: "#4F46E5" }}>{Math.round(intensity.filter(d => d.intensity > 0).slice(-1)[0]?.intensity || 0)}</span> : null}>
          {loading ? <Skeleton /> : !intensity?.some(d => d.intensity > 0) ? <EmptyState message="Score builds over time" /> : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={intensity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="intensity" name="Intensity"
                    stroke="#4F46E5" strokeWidth={2.5}
                    dot={{ r: 4, fill: "#4F46E5", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Correlation Matrix */}
      <ChartCard title="Model Validation — Confusion Matrix" subtitle={matrix ? `${matrix.sample_size} predictions · ${range} window` : "loading"}>
        {loading || !matrix ? <Skeleton h={320} /> : (
          <div style={{ textAlign: "center" }}>
            <img
              src={`data:image/png;base64,${matrix.image_base64}`}
              alt="Confusion matrix"
              style={{ maxWidth: "100%", borderRadius: 10 }}
            />
            {matrix.sample_size < 10 && (
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "#94A3B8" }}>
                ⚠ Fewer than 10 real predictions — showing representative demo matrix.
                More captures will generate the matrix from real model data.
              </p>
            )}
          </div>
        )}
      </ChartCard>
    </div>
  );
}

// ─── Insight Hub tab ──────────────────────────────────────────────────────────
function InsightHubTab({ range }) {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(async () => {
    try { setData(await getEmployees(range, debouncedSearch)); } catch {}
  }, [range, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const employees = data?.employees || [];

  return (
    <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)", overflow: "hidden" }}>
      {/* toolbar */}
      <div style={{ padding: "20px 28px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Deep-dive into employee patterns</h3>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94A3B8" }}>{data?.total ?? "—"} employees in this workspace</p>
        </div>
        <div style={{ position: "relative" }}>
          <svg width="14" height="14" fill="none" stroke="#94A3B8" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or role…"
            style={{ paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9, borderRadius: 99, border: "1px solid #E2E8F0", outline: "none", width: 220, fontSize: 13 }} />
        </div>
      </div>

      {/* table header */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1fr", padding: "12px 28px", background: "#F8FAFC", color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        <span>Employee</span><span>Role</span><span>Company</span><span>Live Vibe</span><span style={{ textAlign: "right" }}>Last Sync</span>
      </div>

      {/* rows */}
      {employees.length === 0 ? (
        <div style={{ padding: "48px 28px", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
          {debouncedSearch ? "No matches. Try a different search." : "No employees yet. Share the registration link with your team."}
        </div>
      ) : employees.map((emp, i) => (
        <div key={emp.username} style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1fr",
          padding: "16px 28px", borderBottom: "1px solid #F8FAFC",
          alignItems: "center", background: i % 2 === 0 ? "#fff" : "#FAFBFF",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: emp.current_emotion ? EMOTION_COLORS[emp.current_emotion] + "22" : "#E0E7FF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: emp.current_emotion ? EMOTION_COLORS[emp.current_emotion] : "#4F46E5" }}>
              {emp.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#0F172A" }}>{emp.username}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>@{emp.username}</p>
            </div>
          </div>
          <span style={{ fontSize: 13, color: "#475569" }}>{emp.role}</span>
          <span style={{ fontSize: 13, color: "#475569" }}>{emp.company}</span>
          <span>
            {emp.current_emotion
              ? <EmotionBadge emotion={emp.current_emotion} score={emp.current_score} />
              : <span style={{ fontSize: 13, color: "#CBD5E1" }}>No signal</span>}
          </span>
          <span style={{ textAlign: "right", fontSize: 12, color: "#94A3B8", fontFamily: "monospace" }}>
            {relativeTime(emp.last_sync)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function HRDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "HR Admin";
  const [tab, setTab] = useState("Global Pulse");
  const [range, setRange] = useState("week");

  const TAB_META = {
    "Global Pulse": "Real-time organizational sentiment patterns",
    "Macro Analytics": "Long-term behavioral trends and emotional contagion mapping",
    "Insight Hub": "Deep-dive into employee patterns and audit anomalies",
  };

  const handleExport = () => window.print();

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.85;transform:scale(1)} 50%{opacity:1;transform:scale(1.03)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @media print { #sidebar{display:none} #toolbar{display:none} }
      `}</style>

      <div style={{ display: "flex", height: "100vh", background: "#F8FAFC", fontFamily: '"Inter", system-ui, sans-serif' }}>

        {/* Sidebar */}
        <div id="sidebar" style={{ width: 72, background: "#fff", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0", zIndex: 10 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#4F46E5,#3B82F6)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 36, boxShadow: "0 4px 12px rgba(79,70,229,.35)" }}>L</div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            {NAV.map(({ id, icon }) => (
              <button key={id} onClick={() => setTab(id)} title={id}
                style={{ width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", background: tab === id ? "#EEF2FF" : "transparent", color: tab === id ? "#4F46E5" : "#94A3B8" }}>
                {icon}
              </button>
            ))}
          </div>
          <button onClick={() => { localStorage.clear(); navigate("/employee/login"); }} title="Sign out"
            style={{ width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer", background: "transparent", color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          </button>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>

          {/* Header */}
          <div style={{ padding: "36px 44px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8" }}>Lumora · {username}</p>
              <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.025em" }}>{tab}</h1>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748B" }}>{TAB_META[tab]}</p>
            </div>
            <div id="toolbar" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <RangeSelector value={range} onChange={setRange} />
              <button onClick={handleExport}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "#0F172A", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                Export PDF
              </button>
            </div>
          </div>

          {/* Tab nav */}
          <div style={{ padding: "0 44px", marginBottom: 28 }}>
            <div style={{ display: "flex", gap: 28, borderBottom: "1px solid #E2E8F0" }}>
              {NAV.map(({ id }) => (
                <span key={id} onClick={() => setTab(id)} style={{ cursor: "pointer", fontSize: 14, fontWeight: 500, color: tab === id ? "#4F46E5" : "#64748B", borderBottom: tab === id ? "2px solid #4F46E5" : "2px solid transparent", paddingBottom: 10, transition: "all .15s" }}>
                  {id}
                </span>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "0 44px 44px" }}>
            {tab === "Global Pulse" && <GlobalPulseTab range={range} />}
            {tab === "Macro Analytics" && <MacroAnalyticsTab range={range} />}
            {tab === "Insight Hub" && <InsightHubTab range={range} />}
          </div>
        </div>
      </div>
    </>
  );
}
