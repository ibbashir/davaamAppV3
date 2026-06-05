"use client";

import React, { useEffect, useState, useCallback } from "react";
import { SiteHeader } from "@/components/superAdmin/site-header";
import { postRequest } from "@/Apis/Api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  CalendarIcon,
  UsersIcon,
  CreditCardIcon,
  BuildingIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  Banknote,
  BarChart2,
  LineChartIcon,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CARD_CONFIGS = [
  { key: "totalAppUsers",       label: "App Users",       icon: UsersIcon,      accent: "#6366F1", bg: "#EEF2FF" },
  { key: "totalCorporateUsers", label: "Corporate",       icon: BuildingIcon,   accent: "#8B5CF6", bg: "#F5F3FF" },
  { key: "totalCashUsers",      label: "Cash Users",      icon: Banknote,       accent: "#059669", bg: "#ECFDF5" },
  { key: "totalOfflineUsers",        label: "Offline Users",   icon: Banknote,       accent: "#059669", bg: "#ECFDF5" },
  { key: "totalTransactions",   label: "Transactions",    icon: CreditCardIcon, accent: "#0EA5E9", bg: "#F0F9FF" },
];


// ─── Responsive hook ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState("lg");
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setBp("xs");
      else if (w < 640) setBp("sm");
      else if (w < 1024) setBp("md");
      else setBp("lg");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return bp;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
const MiniTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", boxShadow: "0 4px 12px rgba(0,0,0,.1)", maxWidth: 180 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</p>
      {payload.map((e) => (
        <div key={e.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#374151", flex: 1 }}>{e.name}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{Number(e.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, accent, bg, isMobile }) => (
  <div style={{
    background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12,
    padding: isMobile ? "12px" : "14px 16px",
    display: "flex", alignItems: "center", gap: isMobile ? 10 : 12,
    boxShadow: "0 1px 4px rgba(0,0,0,.05)", position: "relative", overflow: "hidden",
  }}>
    <div style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon style={{ width: isMobile ? 14 : 16, height: isMobile ? 14 : 16, color: accent }} />
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <p style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p>
      <p style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>{value}</p>
    </div>
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.7 }} />
  </div>
);

// ─── Overview chart ───────────────────────────────────────────────────────────
const OverviewChart = ({ title, subtitle, data, series, chartType, chartH }) => (
  <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
    <div style={{ padding: "10px 14px", borderBottom: "1px solid #F8FAFC", display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{title}</span>
      <span style={{ fontSize: 11, color: "#94A3B8" }}>{subtitle}</span>
    </div>
    <div style={{ padding: "8px 10px 10px" }}>
      <div style={{ width: "100%", height: chartH }}>
        <ResponsiveContainer>
          {chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<MiniTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              {series.map((s) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={18} />)}
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                {series.map((s) => (
                  <linearGradient key={s.key} id={`ov-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor={s.color} stopOpacity={0.18} />
                    <stop offset="90%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<MiniTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              {series.map((s) => (
                <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} fill={`url(#ov-${s.key})`} dot={false} activeDot={{ r: 3 }} />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// ─── Section Panel ─────────────────────────────────────────────────────────────
const SectionPanel = ({ label, data, accent, gradId, chartType, isMobile }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!data?.length) return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, opacity: 0.5 }}>
      <BarChart2 style={{ width: 13, height: 13, color: "#CBD5E1" }} />
      <span style={{ fontSize: 12, color: "#94A3B8" }}>{label} — no data</span>
    </div>
  );

  const vk = Object.keys(data[0]).find((k) => k !== "month");
  const chartData = data.map((item) => ({ month: MONTH_NAMES[item.month - 1], value: Number(item[vk]) || 0 }));
  const total = chartData.reduce((s, d) => s + d.value, 0);
  const max = Math.max(...chartData.map((d) => d.value));
  const chartH = isMobile ? 130 : 160;

  // On mobile: chart on top, table below (stacked). On desktop: side-by-side.
  const bodyLayout = isMobile
    ? { display: "flex", flexDirection: "column" }
    : { display: "grid", gridTemplateColumns: "1fr 1fr" };

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
      {/* Header */}
      <div
        onClick={() => isMobile && setCollapsed((v) => !v)}
        style={{ padding: "9px 12px", borderBottom: "1px solid #F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: isMobile ? "pointer" : "default" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent, display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: accent, background: accent + "18", borderRadius: 6, padding: "2px 8px" }}>
            {total.toLocaleString()}
          </span>
          {isMobile && (
            <span style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1, transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform .2s", display: "inline-block" }}>▾</span>
          )}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={bodyLayout}>
          {/* Chart */}
          <div style={{ padding: isMobile ? "10px 8px 6px" : "10px 8px 10px 10px", borderRight: isMobile ? "none" : "1px solid #F8FAFC", borderBottom: isMobile ? "1px solid #F8FAFC" : "none" }}>
            <div style={{ width: "100%", height: chartH }}>
              <ResponsiveContainer>
                {chartType === "bar" ? (
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 8, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<MiniTooltip />} />
                    <Bar dataKey="value" name={vk} fill={accent} radius={[3, 3, 0, 0]} maxBarSize={14} />
                  </BarChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="10%" stopColor={accent} stopOpacity={0.22} />
                        <stop offset="90%" stopColor={accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 8, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<MiniTooltip />} />
                    <Area type="monotone" dataKey="value" name={vk} stroke={accent} strokeWidth={2} fill={`url(#${gradId})`} dot={false} activeDot={{ r: 3, fill: accent }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowY: "auto", maxHeight: isMobile ? 160 : 180 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead style={{ position: "sticky", top: 0, background: "#FAFAFA", zIndex: 1 }}>
                <tr>
                  <th style={{ padding: "5px 10px", textAlign: "left", fontWeight: 600, color: "#64748B", fontSize: 10, borderBottom: "1px solid #F1F5F9" }}>Mo.</th>
                  <th style={{ padding: "5px 10px", textAlign: "right", fontWeight: 600, color: "#64748B", fontSize: 10, borderBottom: "1px solid #F1F5F9" }}>Value</th>
                  <th style={{ padding: "5px 10px", textAlign: "right", fontWeight: 600, color: "#64748B", fontSize: 10, borderBottom: "1px solid #F1F5F9" }}>Δ</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => {
                  const prev = idx > 0 ? Number(data[idx - 1][vk]) : null;
                  const curr = Number(item[vk]);
                  const delta = prev ? ((curr - prev) / prev * 100).toFixed(0) : null;
                  const isUp = delta !== null && Number(delta) >= 0;
                  const barPct = max > 0 ? (curr / max) * 100 : 0;
                  return (
                    <tr key={item.month} style={{ borderBottom: "1px solid #F8FAFC" }}>
                      <td style={{ padding: "4px 10px", color: "#475569", fontWeight: 500 }}>{MONTH_NAMES[item.month - 1]}</td>
                      <td style={{ padding: "4px 10px", textAlign: "right" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                          <span style={{ color: "#1E293B", fontWeight: 600 }}>{curr.toLocaleString()}</span>
                          <div style={{ width: 36, height: 3, borderRadius: 2, background: "#F1F5F9" }}>
                            <div style={{ width: `${barPct}%`, height: "100%", background: accent, borderRadius: 2 }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "4px 10px", textAlign: "right" }}>
                        {delta !== null ? (
                          <span style={{ fontSize: 10, fontWeight: 700, color: isUp ? "#059669" : "#DC2626" }}>
                            {isUp ? "▲" : "▼"}{Math.abs(delta)}%
                          </span>
                        ) : <span style={{ color: "#CBD5E1", fontSize: 10 }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "1px solid #E2E8F0", background: "#FAFAFA" }}>
                  <td style={{ padding: "5px 10px", fontWeight: 700, color: "#1E293B", fontSize: 11 }}>Total</td>
                  <td style={{ padding: "5px 10px", textAlign: "right", fontWeight: 700, color: "#1E293B", fontSize: 11 }} colSpan={2}>{total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export function SuperAdminUserAnalysis() {
  const currentYear = new Date().getFullYear();
  const [year, setYear]       = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [chartType, setChartType] = useState("line");
  const bp = useBreakpoint();

  const isMobile  = bp === "xs" || bp === "sm";
  const isTablet  = bp === "md";
  const isDesktop = bp === "lg";

  const fetchAnalysis = async (y) => {
    try {
      setLoading(true);
      const res = await postRequest("finance/userAnalysis", { year: y });
      setAnalysis(res?.data ?? res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalysis(year); }, []);

  const handleYear = (dir) => {
    const next = dir === "prev" ? year - 1 : year + 1;
    if (next >= 2020 && next <= currentYear) { setYear(next); fetchAnalysis(next); }
  };

  const downloadData = () => {
    if (!analysis) return;
    const a = document.createElement("a");
    a.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysis, null, 2));
    a.download = `user_analysis_${year}.json`;
    a.click();
  };

  const getMap = (arr) => {
    if (!arr?.length) return {};
    const vk = Object.keys(arr[0]).find((k) => k !== "month");
    return Object.fromEntries(arr.map((item) => [item.month, Number(item[vk]) || 0]));
  };

  const usersData = MONTH_NAMES.map((m, i) => ({
    month: m,
    "App Users":       getMap(analysis?.appUsers)[i + 1] || 0,
    "Corporate Users": getMap(analysis?.corporateUsers)[i + 1] || 0,
    "Cash Users":      getMap(analysis?.cashCollectionUsers)[i + 1] || 0,
    "Offline Users":      getMap(analysis?.offlineTransactions)[i + 1] || 0,
  }));

  const txData = MONTH_NAMES.map((m, i) => ({
    month: m,
    App:       getMap(analysis?.appTransactions)[i + 1] || 0,
    Cash:      getMap(analysis?.cashTransactions)[i + 1] || 0,
    Offline:   getMap(analysis?.offlineTransactions)[i + 1] || 0,
    Corporate: getMap(analysis?.corporateTransactions)[i + 1] || 0,
  }));

  const usersSeries = [
    { key: "App Users",       label: "App",       color: "#6366F1" },
    { key: "Corporate Users", label: "Corporate", color: "#8B5CF6" },
    { key: "Cash Users",      label: "Cash",      color: "#059669" },
    { key: "Offline Users",   label: "Offline",  color: "#78be06" },
  ];
  const txSeries = [
    { key: "App",       label: "App",       color: "#3B82F6" },
    { key: "Cash",      label: "Cash",      color: "#F59E0B" },
    { key: "Corporate", label: "Corporate", color: "#EC4899" },
    { key: "Offline",   label: "Offline",   color: "#EF4444" },
  ];

  const sum = (arr) => arr?.reduce((s, item) => s + Number(Object.values(item)[1] ?? 0), 0) || 0;
  const stats = analysis ? {
    totalAppUsers:       sum(analysis.appUsers),
    totalCorporateUsers: sum(analysis.corporateUsers),
    totalCashUsers:      sum(analysis.cashCollectionUsers),
    totalOfflineUsers:      sum(analysis.offlineTransactions),
    totalTransactions:
      sum(analysis.appTransactions) + sum(analysis.cashTransactions) +
      sum(analysis.offlineTransactions) + sum(analysis.corporateTransactions),
  } : {};

  // ── Layout tokens ──────────────────────────────────────────────────────────
  const px         = isMobile ? 12 : 20;
  const gap        = isMobile ? 8 : 10;
  const cardCols   = isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)";
  const overviewCols = isMobile ? "1fr" : "1fr 1fr";
  const sectionCols  = isMobile ? "1fr" : isTablet ? "1fr" : "1fr 1fr";
  const overviewH    = isMobile ? 180 : 200;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        /* Thin scrollbar for table containers */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
      `}</style>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: `16px ${px}px` }}>
        <SiteHeader title="User Analysis" />

        {/* ── Controls Bar ── */}
        <div style={{
          background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12,
          padding: isMobile ? "8px 10px" : "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8, marginBottom: 14, marginTop: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Year nav */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#F8FAFC", borderRadius: 8, padding: "3px 4px", border: "1px solid #E2E8F0" }}>
              <button onClick={() => handleYear("prev")} disabled={year <= 2020}
                style={{ border: "none", background: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "#64748B", opacity: year <= 2020 ? 0.3 : 1, display: "flex", alignItems: "center" }}>
                <ChevronLeftIcon style={{ width: 14, height: 14 }} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 6px" }}>
                <CalendarIcon style={{ width: 13, height: 13, color: "#6366F1" }} />
                <select value={year} onChange={(e) => { const y = Number(e.target.value); setYear(y); fetchAnalysis(y); }}
                  style={{ background: "none", border: "none", fontWeight: 700, fontSize: 13, color: "#1E293B", cursor: "pointer", outline: "none" }}>
                  {Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => handleYear("next")} disabled={year >= currentYear}
                style={{ border: "none", background: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "#64748B", opacity: year >= currentYear ? 0.3 : 1, display: "flex", alignItems: "center" }}>
                <ChevronRightIcon style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Chart type */}
            <div style={{ display: "flex", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 3, gap: 2 }}>
              {[{ id: "line", Icon: LineChartIcon, label: "Line" }, { id: "bar", Icon: BarChart2, label: "Bar" }].map(({ id, Icon, label }) => (
                <button key={id} onClick={() => setChartType(id)} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: isMobile ? "4px 10px" : "4px 12px",
                  borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  background: chartType === id ? "#6366F1" : "transparent",
                  color: chartType === id ? "#fff" : "#64748B",
                  transition: "all .15s",
                }}>
                  <Icon style={{ width: 12, height: 12 }} />
                  {!isMobile && label}
                </button>
              ))}
            </div>
          </div>

          {/* Export */}
          <button onClick={downloadData} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: isMobile ? "6px 10px" : "6px 14px",
            borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC",
            cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748B",
          }}>
            <DownloadIcon style={{ width: 13, height: 13 }} />
            {!isMobile && "Export"}
          </button>
        </div>

        {/* ── Loader ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "70px 0", gap: 12 }}>
            <div style={{ width: 34, height: 34, border: "3px solid #E2E8F0", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Loading…</p>
          </div>
        )}

        {!loading && analysis && (
          <>
            {/* ── Stat Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: cardCols, gap, marginBottom: gap + 5 }}>
              {CARD_CONFIGS.map((cfg) => (
                <StatCard key={cfg.key} label={cfg.label} value={(stats[cfg.key] || 0).toLocaleString()} icon={cfg.icon} accent={cfg.accent} bg={cfg.bg} isMobile={isMobile} />
              ))}
            </div>

            {/* ── Overview Charts ── */}
            <div style={{ display: "grid", gridTemplateColumns: overviewCols, gap, marginBottom: gap + 4 }}>
              <OverviewChart title="Overall Users" subtitle="App · Corporate · Cash" data={usersData} series={usersSeries} chartType={chartType} chartH={overviewH} />
              <OverviewChart title="Overall Transactions" subtitle="App · Cash · Corporate . Offline" data={txData} series={txSeries} chartType={chartType} chartH={overviewH} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}