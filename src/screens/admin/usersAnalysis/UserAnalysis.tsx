"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { SiteHeader } from "@/components/admin/site-header";
import { postRequest, getRequest } from "@/Apis/Api";
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
  Globe,
  CpuIcon,
  CheckIcon,
  XIcon,
  ChevronDownIcon,
  HeartHandshake,
  TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MachineInfo {
  machine_code: string;
  machine_name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── LTV Formatter ────────────────────────────────────────────────────────────
const formatLTV = (raw: number): { display: string; suffix: string } => {
  if (raw >= 1_000_000_000) return { display: (raw / 1_000_000_000).toFixed(2), suffix: "B" };
  if (raw >= 1_000_000)     return { display: (raw / 1_000_000).toFixed(2),      suffix: "M" };
  if (raw >= 1_000)         return { display: (raw / 1_000).toFixed(1),           suffix: "K" };
  return { display: raw.toLocaleString(), suffix: "" };
};

// ─── Card Configs ─────────────────────────────────────────────────────────────
const CARD_CONFIGS = [
  { key: "totalCorporateUsers", label: "Corporate Users",      icon: BuildingIcon,   accent: "#8B5CF6", bg: "#F5F3FF" },
  { key: "totalCashUsers",      label: "Cash Users",           icon: Banknote,       accent: "#059669", bg: "#ECFDF5" },
  { key: "overallUsers",        label: "Total Unique Users",   icon: UsersIcon,      accent: "#F97316", bg: "#FFF7ED" },
  { key: "overAllTransactions", label: "Total Transactions",   icon: CreditCardIcon, accent: "#0EA5E9", bg: "#F0F9FF" },
  { key: "totalWomenAccess",    label: "Women Access",         icon: HeartHandshake, accent: "#EC4899", bg: "#FDF2F8", isWomen: true },
  { key: "totalLifeTimeValue",  label: "Lifetime Value (LTV)", icon: TrendingUp,     accent: "#D97706", bg: "#FFFBEB", isLTV: true   },
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

// ─── Multi-Select Machine Dropdown ───────────────────────────────────────────
const MachineMultiSelect = ({
  machines,
  selected,
  onChange,
  isMobile,
}: {
  machines: MachineInfo[];
  selected: string[];
  onChange: (codes: string[]) => void;
  isMobile: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = machines.filter(
    (m) =>
      m.machine_name.toLowerCase().includes(search.toLowerCase()) ||
      m.machine_code.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  const selectAll = () => onChange(machines.map((m) => m.machine_code));
  const clearAll  = () => onChange([]);

  const label =
    selected.length === 0
      ? "All Machines"
      : selected.length === 1
      ? machines.find((m) => m.machine_code === selected[0])?.machine_name ?? selected[0]
      : `${selected.length} Machines`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: selected.length > 0 ? "#EEF2FF" : "#F8FAFC",
          border: `1px solid ${selected.length > 0 ? "#C7D2FE" : "#E2E8F0"}`,
          borderRadius: 8, padding: "3px 10px", height: 32,
          cursor: "pointer", fontSize: 12, fontWeight: 600,
          color: selected.length > 0 ? "#4F46E5" : "#1E293B",
          whiteSpace: "nowrap", maxWidth: isMobile ? 140 : 200,
        }}
      >
        <CpuIcon style={{ width: 12, height: 12, flexShrink: 0 }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        {selected.length > 0 && (
          <span style={{
            background: "#6366F1", color: "#fff", borderRadius: 10,
            fontSize: 9, fontWeight: 800, padding: "1px 5px", flexShrink: 0,
          }}>
            {selected.length}
          </span>
        )}
        <ChevronDownIcon
          style={{
            width: 11, height: 11, flexShrink: 0, color: "#94A3B8",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .15s",
          }}
        />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 9999,
          background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,.12)",
          width: 260, maxHeight: 320, display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #F1F5F9" }}>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search machines…"
              style={{
                width: "100%", padding: "5px 8px", border: "1px solid #E2E8F0",
                borderRadius: 6, fontSize: 12, color: "#1E293B", outline: "none",
                background: "#F8FAFC",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 6, padding: "5px 10px", borderBottom: "1px solid #F1F5F9" }}>
            <button onClick={selectAll} style={{ flex: 1, padding: "4px 0", border: "1px solid #E2E8F0", borderRadius: 6, background: "#F8FAFC", fontSize: 11, fontWeight: 600, color: "#475569", cursor: "pointer" }}>Select All</button>
            <button onClick={clearAll}  style={{ flex: 1, padding: "4px 0", border: "1px solid #E2E8F0", borderRadius: 6, background: "#F8FAFC", fontSize: 11, fontWeight: 600, color: "#475569", cursor: "pointer" }}>Clear</button>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 10px", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>No machines found</div>
            ) : (
              filtered.map((m) => {
                const isSelected = selected.includes(m.machine_code);
                return (
                  <div
                    key={m.machine_code}
                    onClick={() => toggle(m.machine_code)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px", cursor: "pointer",
                      background: isSelected ? "#F5F3FF" : "transparent",
                      borderBottom: "1px solid #F8FAFC", transition: "background .1s",
                    }}
                  >
                    <div style={{
                      width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${isSelected ? "#6366F1" : "#D1D5DB"}`,
                      background: isSelected ? "#6366F1" : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .1s",
                    }}>
                      {isSelected && <CheckIcon style={{ width: 9, height: 9, color: "#fff", strokeWidth: 3 }} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.machine_name}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>#{m.machine_code}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selected.length > 0 && (
            <div style={{
              padding: "6px 10px", borderTop: "1px solid #F1F5F9",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#FAFAFA",
            }}>
              <span style={{ fontSize: 11, color: "#6366F1", fontWeight: 600 }}>{selected.length} selected</span>
              <button onClick={clearAll} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer", fontSize: 11, color: "#EF4444", fontWeight: 600, padding: 0 }}>
                <XIcon style={{ width: 10, height: 10 }} /> Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Tooltip ─────────────────────────────────────────────────────────────────
const MiniTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", boxShadow: "0 4px 12px rgba(0,0,0,.1)", maxWidth: 180 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</p>
      {payload.map((e: any) => (
        <div key={e.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#374151", flex: 1 }}>{e.name}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{Number(e.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Stat Card (updated) ──────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, accent, bg, isMobile, isLTV, isWomen }: any) => {
  const ltvParsed = isLTV ? formatLTV(Number(value) || 0) : null;

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${accent}28`,
      borderRadius: 14,
      padding: isMobile ? "12px" : "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 10 : 12,
      boxShadow: `0 2px 10px ${accent}12`,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow blob */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 70, height: 70, borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}1A 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Icon badge */}
      <div style={{
        width: isMobile ? 36 : 40,
        height: isMobile ? 36 : 40,
        borderRadius: 11,
        background: `linear-gradient(135deg, ${accent}20 0%, ${bg} 100%)`,
        border: `1.5px solid ${accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon style={{ width: isMobile ? 16 : 18, height: isMobile ? 16 : 18, color: accent }} />
      </div>

      {/* Text */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          fontSize: 9, fontWeight: 700, color: "#94A3B8",
          textTransform: "uppercase", letterSpacing: "0.07em",
          marginBottom: 3, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {label}
        </p>

        {isLTV && ltvParsed ? (
          /* ── LTV: gradient number + M/B badge ── */
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{
              fontSize: isMobile ? 20 : 23,
              fontWeight: 900,
              lineHeight: 1,
              background: `linear-gradient(135deg, ${accent} 0%, #FBBF24 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}>
              {ltvParsed.display}
            </span>
            {ltvParsed.suffix && (
              <span style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                background: `linear-gradient(135deg, ${accent}, #F59E0B)`,
                borderRadius: 6,
                padding: "1px 6px",
                lineHeight: "18px",
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}>
                {ltvParsed.suffix}
              </span>
            )}
          </div>
        ) : isWomen ? (
          /* ── Women Access: value + ♀ badge ── */
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <p style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: accent,
              background: `${accent}18`,
              borderRadius: 5,
              padding: "1px 6px",
              lineHeight: "18px",
              flexShrink: 0,
            }}>
              ♀
            </span>
          </div>
        ) : (
          /* ── Default ── */
          <p style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        )}
      </div>

      {/* Bottom accent bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent} 0%, ${accent}44 100%)`,
      }} />
    </div>
  );
};

// ─── Overview Chart ───────────────────────────────────────────────────────────
const OverviewChart = ({ title, subtitle, data, series, chartType, chartH }: any) => (
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
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<MiniTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              {series.map((s: any) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={18} />)}
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                {series.map((s: any) => (
                  <linearGradient key={s.key} id={`ov-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor={s.color} stopOpacity={0.18} />
                    <stop offset="90%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<MiniTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              {series.map((s: any) => (
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
const SectionPanel = ({ label, data, accent, gradId, chartType, isMobile, timeKey }: any) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!data?.length) return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, opacity: 0.5 }}>
      <BarChart2 style={{ width: 13, height: 13, color: "#CBD5E1" }} />
      <span style={{ fontSize: 12, color: "#94A3B8" }}>{label} — no data</span>
    </div>
  );

  const vk = Object.keys(data[0]).find((k) => k !== timeKey);

  const formatLabel = (item: any) => {
    const val = Number(item[timeKey]);
    if (timeKey === "month") return MONTH_NAMES[val - 1] ?? val;
    if (timeKey === "day")   return `D${val}`;
    return `${val}`;
  };

  const chartData = data.map((item: any) => ({
    label: formatLabel(item),
    value: Number(item[vk]) || 0,
  }));

  const total  = chartData.reduce((s: number, d: any) => s + d.value, 0);
  const maxVal = Math.max(...chartData.map((d: any) => d.value));
  const chartH = isMobile ? 130 : 160;

  const bodyLayout: React.CSSProperties = isMobile
    ? { display: "flex", flexDirection: "column" }
    : { display: "grid", gridTemplateColumns: "1fr 1fr" };

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
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

      {!collapsed && (
        <div style={bodyLayout}>
          <div style={{ padding: isMobile ? "10px 8px 6px" : "10px 8px 10px 10px", borderRight: isMobile ? "none" : "1px solid #F8FAFC", borderBottom: isMobile ? "1px solid #F8FAFC" : "none" }}>
            <div style={{ width: "100%", height: chartH }}>
              <ResponsiveContainer>
                {chartType === "bar" ? (
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
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
                    <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<MiniTooltip />} />
                    <Area type="monotone" dataKey="value" name={vk} stroke={accent} strokeWidth={2} fill={`url(#${gradId})`} dot={false} activeDot={{ r: 3, fill: accent }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ overflowY: "auto", maxHeight: isMobile ? 160 : 200 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead style={{ position: "sticky", top: 0, background: "#FAFAFA", zIndex: 1 }}>
                <tr>
                  <th style={{ padding: "5px 10px", textAlign: "left", fontWeight: 600, color: "#64748B", fontSize: 10, borderBottom: "1px solid #F1F5F9" }}>Period</th>
                  <th style={{ padding: "5px 10px", textAlign: "right", fontWeight: 600, color: "#64748B", fontSize: 10, borderBottom: "1px solid #F1F5F9" }}>Value</th>
                  <th style={{ padding: "5px 10px", textAlign: "right", fontWeight: 600, color: "#64748B", fontSize: 10, borderBottom: "1px solid #F1F5F9" }}>Δ</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item: any, idx: number) => {
                  const prev   = idx > 0 ? Number(data[idx - 1][vk]) : null;
                  const curr   = Number(item[vk]);
                  const delta  = prev ? ((curr - prev) / prev * 100).toFixed(0) : null;
                  const isUp   = delta !== null && Number(delta) >= 0;
                  const barPct = maxVal > 0 ? (curr / maxVal) * 100 : 0;
                  return (
                    <tr key={item[timeKey]} style={{ borderBottom: "1px solid #F8FAFC" }}>
                      <td style={{ padding: "4px 10px", color: "#475569", fontWeight: 500 }}>{formatLabel(item)}</td>
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
                            {isUp ? "▲" : "▼"}{Math.abs(Number(delta))}%
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

// ─── Top 5 Table ──────────────────────────────────────────────────────────────
const Top5Table = ({ title, data, accent, isMobile }: any) => {
  if (!data?.length) return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12, padding: "14px 16px", opacity: 0.5 }}>
      <span style={{ fontSize: 12, color: "#94A3B8" }}>{title} — no data</span>
    </div>
  );

  const maxTx = Math.max(...data.map((d: any) => Number(d.totalTransactions)));

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
      <div style={{ padding: "9px 12px", borderBottom: "1px solid #F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent, display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{title}</span>
        </div>
        <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500 }}>Top 5</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead style={{ background: "#FAFAFA" }}>
          <tr>
            <th style={{ padding: "5px 10px", textAlign: "left", fontWeight: 600, color: "#64748B", fontSize: 10, borderBottom: "1px solid #F1F5F9" }}>#</th>
            <th style={{ padding: "5px 10px", textAlign: "left", fontWeight: 600, color: "#64748B", fontSize: 10, borderBottom: "1px solid #F1F5F9" }}>ID / MSISDN</th>
            <th style={{ padding: "5px 10px", textAlign: "right", fontWeight: 600, color: "#64748B", fontSize: 10, borderBottom: "1px solid #F1F5F9" }}>Transactions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item: any, idx: number) => {
            const tx     = Number(item.totalTransactions);
            const barPct = maxTx > 0 ? (tx / maxTx) * 100 : 0;
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <tr key={item.msisdn} style={{ borderBottom: "1px solid #F8FAFC" }}>
                <td style={{ padding: "6px 10px", color: "#94A3B8", fontWeight: 700, fontSize: 11 }}>{medals[idx] ?? `#${idx + 1}`}</td>
                <td style={{ padding: "6px 10px", color: "#1E293B", fontWeight: 600, fontFamily: "monospace", fontSize: 11 }}>{item.msisdn}</td>
                <td style={{ padding: "6px 10px", textAlign: "right" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    <span style={{ color: accent, fontWeight: 700 }}>{tx.toLocaleString()}</span>
                    <div style={{ width: 48, height: 3, borderRadius: 2, background: "#F1F5F9" }}>
                      <div style={{ width: `${barPct}%`, height: "100%", background: accent, borderRadius: 2 }} />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export function AdminUserAnalysis() {
  const currentYear = new Date().getFullYear();

  const [year,             setYear]             = useState<number | null>(currentYear);
  const [month,            setMonth]            = useState<number | null>(null);
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [machines,         setMachines]         = useState<MachineInfo[]>([]);
  const [machinesLoading,  setMachinesLoading]  = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [analysis,         setAnalysis]         = useState<any>(null);
  const [chartType,        setChartType]        = useState("bar");

  const bp       = useBreakpoint();
  const isMobile = bp === "xs" || bp === "sm";
  const isTablet = bp === "md";

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setMachinesLoading(true);
        const res = await getRequest<{ data?: MachineInfo[] }>("admin/getMachinesWithMachineCode");
        setMachines(res?.data ?? []);
      } catch (e) {
        console.error("Failed to fetch machines:", e);
      } finally {
        setMachinesLoading(false);
      }
    };
    fetchMachines();
  }, []);

  const fetchAnalysis = useCallback(async (
    y: number | null,
    m: number | null,
    machineCodes: string[]
  ) => {
    try {
      setLoading(true);
      const body: Record<string, any> = {};
      if (y !== null)              body.year         = y;
      if (m !== null)              body.month        = m;
      if (machineCodes.length > 0) body.machineCodes = machineCodes;
      const res = await postRequest("admin/userAnalysis", body);
      setAnalysis(res?.data ?? res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalysis(year, month, selectedMachines); }, []);

  const handleYear = (dir: "prev" | "next") => {
    if (year === null) return;
    const next = dir === "prev" ? year - 1 : year + 1;
    if (next >= 2020 && next <= currentYear) {
      setYear(next);
      setMonth(null);
      fetchAnalysis(next, null, selectedMachines);
    }
  };

  const handleYearSelect = (val: string) => {
    if (val === "overall") {
      setYear(null); setMonth(null);
      fetchAnalysis(null, null, selectedMachines);
    } else {
      const y = Number(val);
      setYear(y); setMonth(null);
      fetchAnalysis(y, null, selectedMachines);
    }
  };

  const handleMonth = (val: string) => {
    const m = val === "" ? null : Number(val);
    setMonth(m);
    fetchAnalysis(year, m, selectedMachines);
  };

  const handleMachinesChange = (codes: string[]) => {
    setSelectedMachines(codes);
    fetchAnalysis(year, month, codes);
  };

  const periodType = analysis?.period?.type ?? "yearly";
  const timeKey    = periodType === "monthly" ? "day"
                   : periodType === "yearly"  ? "month"
                   :                            "year";

  const getMap = (arr: any[]) => {
    if (!arr?.length) return {};
    const vk = Object.keys(arr[0]).find((k) => k !== timeKey);
    return Object.fromEntries(arr.map((item: any) => [item[timeKey], Number(item[vk]) || 0]));
  };

  const buildLabels = () => {
    if (timeKey === "day") {
      const lastDay = new Date(year!, month!, 0).getDate();
      return Array.from({ length: lastDay }, (_, i) => ({ key: i + 1, label: `${i + 1}` }));
    }
    if (timeKey === "month") {
      return MONTH_NAMES.map((m, i) => ({ key: i + 1, label: m }));
    }
    const years = new Set([
      ...(analysis?.appUsers            ?? []).map((d: any) => d[timeKey]),
      ...(analysis?.corporateUsers      ?? []).map((d: any) => d[timeKey]),
      ...(analysis?.cashCollectionUsers ?? []).map((d: any) => d[timeKey]),
    ]);
    return [...years].sort().map((y) => ({ key: y, label: `${y}` }));
  };

  const labels = analysis ? buildLabels() : [];

  const usersData = labels.map(({ key, label }: any) => ({
    label,
    "App Users":       getMap(analysis?.appUsers)[key]            || 0,
    "Corporate Users": getMap(analysis?.corporateUsers)[key]      || 0,
    "Cash Users":      getMap(analysis?.cashCollectionUsers)[key] || 0,
  }));

  const txData = labels.map(({ key, label }: any) => ({
    label,
    App:       getMap(analysis?.appTransactions)[key]       || 0,
    Cash:      getMap(analysis?.cashCollectionUsers)[key]   || 0,
    Corporate: getMap(analysis?.corporateTransactions)[key] || 0,
  }));

  const usersSeries = [
    { key: "App Users",       label: "App",       color: "#6366F1" },
    { key: "Corporate Users", label: "Corporate", color: "#8B5CF6" },
    { key: "Cash Users",      label: "Cash",      color: "#059669" },
  ];
  const txSeries = [
    { key: "App",       label: "App",       color: "#3B82F6" },
    { key: "Cash",      label: "Cash",      color: "#F59E0B" },
    { key: "Corporate", label: "Corporate", color: "#EC4899" },
  ];

  const stats = analysis ? {
    overallUsers:         analysis.overAllUsers,
    totalCorporateUsers:  analysis.totalCorporateUsers,
    totalCashUsers:       analysis.totalCashUsers,
    overAllTransactions:  analysis.overAllTransactions,
    totalWomenAccess:     analysis.totalWomenAccess,
    totalLifeTimeValue:   analysis.totalLifeTimeValue,  // raw number — StatCard formats it
  } : {};

  const downloadData = () => {
    if (!analysis) return;
    const label = periodType === "monthly" ? `${year}_${String(month).padStart(2, "0")}`
                : periodType === "yearly"  ? `${year}`
                :                            "overall";
    const machineLabel = selectedMachines.length > 0 ? `_machines_${selectedMachines.join("-")}` : "";
    const a = document.createElement("a");
    a.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysis, null, 2));
    a.download = `user_analysis_${label}${machineLabel}.json`;
    a.click();
  };

  const px           = isMobile ? 12 : 20;
  const gap          = isMobile ? 8 : 10;
  // 6 cards when overall (Women visible), 5 cards otherwise — always 3 cols on desktop
  const cardCols     = isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)";
  const overviewCols = isMobile ? "1fr" : "1fr 1fr";
  const sectionCols  = isMobile || isTablet ? "1fr" : "1fr 1fr";
  const overviewH    = isMobile ? 180 : 200;

  const periodLabel = periodType === "monthly" ? `${MONTH_FULL[month! - 1]} ${year}`
                    : periodType === "yearly"  ? `${year}`
                    :                            "All Time";

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
        select option { background: #fff; color: #1E293B; }
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

            {/* Year selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#F8FAFC", borderRadius: 8, padding: "3px 4px", border: "1px solid #E2E8F0" }}>
              <button onClick={() => handleYear("prev")} disabled={year === null || year <= 2020} style={{ border: "none", background: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "#64748B", opacity: (year === null || year <= 2020) ? 0.3 : 1, display: "flex", alignItems: "center" }}>
                <ChevronLeftIcon style={{ width: 14, height: 14 }} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 6px" }}>
                {year === null ? <Globe style={{ width: 13, height: 13, color: "#6366F1" }} /> : <CalendarIcon style={{ width: 13, height: 13, color: "#6366F1" }} />}
                <select value={year === null ? "overall" : year} onChange={(e) => handleYearSelect(e.target.value)} style={{ background: "none", border: "none", fontWeight: 700, fontSize: 13, color: "#1E293B", cursor: "pointer", outline: "none" }}>
                  <option value="overall">Overall</option>
                  {Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i).map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button onClick={() => handleYear("next")} disabled={year === null || year >= currentYear} style={{ border: "none", background: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "#64748B", opacity: (year === null || year >= currentYear) ? 0.3 : 1, display: "flex", alignItems: "center" }}>
                <ChevronRightIcon style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Month selector */}
            {year !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#F8FAFC", borderRadius: 8, padding: "3px 10px", border: "1px solid #E2E8F0", height: 32 }}>
                <CalendarIcon style={{ width: 12, height: 12, color: "#8B5CF6" }} />
                <select value={month ?? ""} onChange={(e) => handleMonth(e.target.value)} style={{ background: "none", border: "none", fontWeight: 600, fontSize: 12, color: "#1E293B", cursor: "pointer", outline: "none" }}>
                  <option value="">All Months</option>
                  {MONTH_FULL.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                </select>
              </div>
            )}

            {/* Machine multi-select */}
            {machinesLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, height: 32, background: "#F8FAFC", borderRadius: 8, padding: "3px 10px", border: "1px solid #E2E8F0", fontSize: 12, color: "#94A3B8" }}>
                <div style={{ width: 12, height: 12, border: "2px solid #E2E8F0", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Loading…
              </div>
            ) : machines.length > 0 ? (
              <MachineMultiSelect machines={machines} selected={selectedMachines} onChange={handleMachinesChange} isMobile={isMobile} />
            ) : null}

            {/* Period badge */}
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", background: "#EEF2FF", borderRadius: 6, padding: "3px 10px", border: "1px solid #C7D2FE" }}>
              {periodLabel}
            </span>

            {/* Chart type toggle */}
            <div style={{ display: "flex", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 3, gap: 2 }}>
              {[{ id: "bar", Icon: BarChart2, label: "Bar" }, { id: "line", Icon: LineChartIcon, label: "Line" }].map(({ id, Icon, label }) => (
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
          <button onClick={downloadData} style={{ display: "flex", alignItems: "center", gap: 6, padding: isMobile ? "6px 10px" : "6px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748B" }}>
            <DownloadIcon style={{ width: 13, height: 13 }} />
            {!isMobile && "Export"}
          </button>
        </div>

        {/* Active machine pills */}
        {selectedMachines.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Machines:</span>
            {selectedMachines.map((code) => {
              const machine = machines.find((m) => m.machine_code === code);
              return (
                <span key={code} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 20, padding: "2px 8px 2px 10px", fontSize: 11, fontWeight: 600, color: "#4F46E5" }}>
                  {machine?.machine_name ?? code}
                  <span style={{ fontSize: 9, color: "#94A3B8", fontFamily: "monospace" }}>#{code}</span>
                  <button onClick={() => handleMachinesChange(selectedMachines.filter((c) => c !== code))} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "#A5B4FC" }}>
                    <XIcon style={{ width: 10, height: 10 }} />
                  </button>
                </span>
              );
            })}
            <button onClick={() => handleMachinesChange([])} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 11, color: "#EF4444", fontWeight: 600, padding: "2px 6px" }}>
              Clear all
            </button>
          </div>
        )}

        {/* Loader */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "70px 0", gap: 12 }}>
            <div style={{ width: 34, height: 34, border: "3px solid #E2E8F0", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Loading…</p>
          </div>
        )}

        {!loading && analysis && (
          <>
            {/* Stat Cards — 3 columns so Women & LTV cards have proper breathing room */}
            <div style={{ display: "grid", gridTemplateColumns: cardCols, gap, marginBottom: gap + 4 }}>
              {CARD_CONFIGS
                .filter((cfg) => (cfg as any).isWomen ? year === null : true)
                .map((cfg) => (
                <StatCard
                  key={cfg.key}
                  label={cfg.label}
                  // Pass raw number for LTV (formatter runs inside); formatted string for rest
                  value={
                    (cfg as any).isLTV
                      ? ((stats as any)[cfg.key] || 0)
                      : ((stats as any)[cfg.key] || 0).toLocaleString()
                  }
                  icon={cfg.icon}
                  accent={cfg.accent}
                  bg={cfg.bg}
                  isMobile={isMobile}
                  isLTV={(cfg as any).isLTV}
                  isWomen={(cfg as any).isWomen}
                />
              ))}
            </div>

            {/* Overview Charts */}
            <div style={{ display: "grid", gridTemplateColumns: overviewCols, gap, marginBottom: gap + 4 }}>
              <OverviewChart title="Overall Users" subtitle="App · Corporate · Cash" data={usersData} series={usersSeries} chartType={chartType} chartH={overviewH} />
              <OverviewChart title="Overall Transactions" subtitle="App · Cash · Corporate" data={txData} series={txSeries} chartType={chartType} chartH={overviewH} />
            </div>

            {/* Section Panels */}
            <div style={{ display: "grid", gridTemplateColumns: sectionCols, gap, marginBottom: gap + 4 }}>
              <SectionPanel label="Corporate Users"        data={analysis.corporateUsers}        accent="#8B5CF6" gradId="g-cu"  chartType={chartType} isMobile={isMobile} timeKey={timeKey} />
              <SectionPanel label="Corporate Transactions" data={analysis.corporateTransactions} accent="#EC4899" gradId="g-ct"  chartType={chartType} isMobile={isMobile} timeKey={timeKey} />
              <SectionPanel label="Cash Users"             data={analysis.cashCollectionUsers}   accent="#059669" gradId="g-cc"  chartType={chartType} isMobile={isMobile} timeKey={timeKey} />
              <SectionPanel label="Cash Transactions"      data={analysis.cashCollectionUsers}   accent="#F59E0B" gradId="g-cst" chartType={chartType} isMobile={isMobile} timeKey={timeKey} />
              <SectionPanel label="App Users"              data={analysis.appUsers}              accent="#6366F1" gradId="g-au"  chartType={chartType} isMobile={isMobile} timeKey={timeKey} />
              <SectionPanel label="App Transactions"       data={analysis.appTransactions}       accent="#3B82F6" gradId="g-at"  chartType={chartType} isMobile={isMobile} timeKey={timeKey} />
            </div>

            {/* Top 5 Tables */}
            <div style={{ display: "grid", gridTemplateColumns: sectionCols, gap, marginBottom: gap + 4 }}>
              <Top5Table title="Top 5 App Users"       data={analysis.top5AppUsers}       accent="#6366F1" isMobile={isMobile} />
              <Top5Table title="Top 5 Corporate Users" data={analysis.top5CorporateUsers} accent="#8B5CF6" isMobile={isMobile} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}