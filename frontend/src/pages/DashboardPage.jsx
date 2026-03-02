import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    BarChart3, TrendingUp, TrendingDown, DollarSign, Store, Image as ImageIcon,
    Palette, Package, ArrowUpCircle, ArrowDownCircle, Hash, RefreshCw, Filter,
    ChevronRight, Award, Users, CreditCard, Activity
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, ComposedChart, Line
} from 'recharts';
import Topbar from '../components/Topbar';

const API_BASE = import.meta.env.VITE_API_URL || '';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TABS = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'topup', label: 'Topup', icon: ArrowUpCircle },
    { key: 'stores', label: 'Stores', icon: Store },
    { key: 'media', label: 'Media', icon: ImageIcon },
    { key: 'design', label: 'Design', icon: Palette },
    { key: 'fulfillment', label: 'Fulfillment', icon: Package },
];

/* ── Color palette ── */
const COLORS = {
    primary: '#6366f1',
    income: '#10b981',
    expense: '#f43f5e',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    pink: '#ec4899',
    amber: '#f59e0b',
    teal: '#14b8a6',
    blue: '#3b82f6',
};

/* ── Format Helpers ── */
const fmtMoney = (v) => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMoneyShort = (v) => {
    const n = Number(v || 0);
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
};
const fmtNumber = (v) => Number(v || 0).toLocaleString('en-US');
const fmtNumberShort = (v) => {
    const n = Number(v || 0);
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toFixed(0);
};

/* Prepare chart data — fill yearly, monthly, or daily */
function fillChartData(data, keys, year, month) {
    if (!data || !data.length) return [];

    // Check data shape to determine grouping
    const isDaily = !!month && data.some(d => d.hasOwnProperty('day'));
    const isYearly = !year && data.some(d => d.hasOwnProperty('year'));

    if (isDaily) {
        const m = Number(month);
        const y = Number(year) || new Date().getFullYear();
        const daysInMonth = new Date(y, m, 0).getDate();
        const map = {};
        data.forEach(d => { map[Number(d.day)] = d; });

        return Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const existing = map[d] || {};
            const row = { name: `${d}/${m}` };
            keys.forEach(k => { row[k] = Number(existing[k] || 0); });
            return row;
        });
    } else if (isYearly) {
        // All-time: just map each year as-is, no gap filling
        return data.map(d => {
            const row = { name: String(d.year) };
            keys.forEach(k => { row[k] = Number(d[k] || 0); });
            return row;
        });
    } else {
        const map = {};
        data.forEach(d => { map[Number(d.month)] = d; });
        return Array.from({ length: 12 }, (_, i) => {
            const m = i + 1;
            const existing = map[m] || {};
            const row = { name: MONTHS_SHORT[i] };
            keys.forEach(k => { row[k] = Number(existing[k] || 0); });
            return row;
        });
    }
}

/* ───────────── Custom Tooltip ───────────── */
function ChartTooltip({ active, payload, label, formatter }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(15, 20, 36, 0.95)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 10,
            padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{label}</p>
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#cbd5e1' }}>{p.name}:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginLeft: 'auto' }}>
                        {formatter ? formatter(p.value) : p.value?.toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
}

/* ───────────── Smooth Area Chart ───────────── */
function SmoothAreaChart({ data, areas, height = 280, formatter, yFormatter }) {
    if (!data?.length) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>;
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    {areas.map(a => (
                        <linearGradient key={a.dataKey + '_grad'} id={`grad_${a.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={a.color} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={a.color} stopOpacity={0.02} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={yFormatter || fmtNumberShort} width={50} />
                <Tooltip content={<ChartTooltip formatter={formatter} />} />
                {areas.map(a => (
                    <Area
                        key={a.dataKey}
                        type="monotone"
                        dataKey={a.dataKey}
                        name={a.name || a.dataKey}
                        stroke={a.color}
                        strokeWidth={2.5}
                        fill={`url(#grad_${a.dataKey})`}
                        animationDuration={1200}
                        animationEasing="ease-out"
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );
}

/* ───────────── Smooth Bar Chart ───────────── */
function SmoothBarChart({ data, bars, height = 280, formatter, yFormatter }) {
    if (!data?.length) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>;
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barCategoryGap="20%">
                <defs>
                    {bars.map(b => (
                        <linearGradient key={b.dataKey + '_bgrad'} id={`bgrad_${b.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={b.color} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={b.color} stopOpacity={0.5} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={yFormatter || fmtNumberShort} width={50} />
                <Tooltip content={<ChartTooltip formatter={formatter} />} />
                {bars.map(b => (
                    <Bar
                        key={b.dataKey}
                        dataKey={b.dataKey}
                        name={b.name || b.dataKey}
                        fill={`url(#bgrad_${b.dataKey})`}
                        radius={[6, 6, 0, 0]}
                        animationDuration={800}
                        animationEasing="ease-out"
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}

/* ───────────── Horizontal Progress Bars ───────────── */
function HorizontalBar({ items, valueKey, labelKey = 'team_name', color = COLORS.primary, formatValue }) {
    if (!items || items.length === 0) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No data</div>;
    const maxVal = Math.max(...items.map(i => Number(i[valueKey] || 0)));
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {items.map((item, idx) => {
                const pct = maxVal > 0 ? (Number(item[valueKey]) / maxVal) * 100 : 0;
                return (
                    <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item[labelKey] || 'Unknown'}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color }}>{formatValue ? formatValue(item[valueKey]) : Number(item[valueKey]).toLocaleString()}</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(99,102,241,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                                width: `${pct}%`, height: '100%', borderRadius: 3,
                                background: `linear-gradient(90deg, ${color}cc, ${color})`,
                                transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                boxShadow: `0 0 8px ${color}40`,
                            }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ───────────── Mini Ranking Table ───────────── */
function MiniRankingTable({ items, columns }) {
    if (!items || items.length === 0) return null;
    const medals = ['🥇', '🥈', '🥉'];
    return (
        <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                <thead>
                    <tr>
                        <th style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textAlign: 'left', padding: '8px 10px' }}>#</th>
                        {columns.map((col, i) => (
                            <th key={i} style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textAlign: col.align || 'left', padding: '8px 10px' }}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx} style={{ background: idx < 3 ? 'rgba(99,102,241,0.04)' : 'transparent', borderRadius: 8 }}>
                            <td style={{ padding: '10px', fontSize: 14, borderRadius: '8px 0 0 8px' }}>
                                {idx < 3 ? medals[idx] : <span style={{ color: '#64748b', fontSize: 12 }}>{idx + 1}</span>}
                            </td>
                            {columns.map((col, i) => (
                                <td key={i} style={{
                                    padding: '10px', fontSize: 13, fontWeight: col.bold ? 600 : 400,
                                    color: col.color || 'var(--text-primary)', textAlign: col.align || 'left',
                                    borderRadius: i === columns.length - 1 ? '0 8px 8px 0' : 0,
                                }}>
                                    {col.render ? col.render(item) : item[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ───────────── Stat Card ───────────── */
function StatCard({ label, value, icon: Icon, color, sub }) {
    return (
        <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{
                position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%',
                background: `radial-gradient(circle, ${color}15, transparent 70%)`,
            }} />
            <div className="stat-card-header">
                <div className="stat-card-icon" style={{ background: `${color}15`, color }}>
                    <Icon size={20} />
                </div>
                <span className="stat-card-label">{label}</span>
            </div>
            <div className="stat-card-value" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{value}</div>
            <div className="stat-card-sub">{sub}</div>
        </div>
    );
}

/* ───────────── Chart Card ───────────── */
function ChartCard({ title, subtitle, children, style = {}, legend }) {
    return (
        <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 12, padding: '20px 20px 16px', ...style,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    {title && <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>}
                    {subtitle && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{subtitle}</p>}
                </div>
                {legend && (
                    <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                        {legend.map((l, i) => (
                            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                                {l.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}

/* ═══════════════════════════════════════════
   ██  MAIN DASHBOARD PAGE
   ═══════════════════════════════════════════ */

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('overview');
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState('');
    const [teamId, setTeamId] = useState('');

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({ tab: activeTab, year });
            if (month) params.append('month', month);
            if (teamId) params.append('team_id', teamId);
            const res = await fetch(`${API_BASE}/api/dashboard?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setData(json.data);
                if (json.teams) setTeams(json.teams);
            }
        } catch (err) { console.error('Dashboard error:', err); }
        finally { setLoading(false); }
    }, [activeTab, year, month, teamId]);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    const renderContent = () => {
        if (loading) return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 100, gap: 12 }}>
                <div className="spinner" style={{ width: 28, height: 28 }} />
                <span style={{ color: 'var(--text-muted)' }}>Loading dashboard...</span>
            </div>
        );
        if (!data) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No data available</div>;
        switch (activeTab) {
            case 'topup': return <TopupTab data={data} year={year} month={month} />;
            case 'stores': return <StoresTab teams={teams} />;
            case 'media': return <MediaTab data={data} year={year} month={month} />;
            case 'design': return <DesignTab data={data} year={year} month={month} />;
            case 'fulfillment': return <FulfillmentTab data={data} year={year} month={month} />;
            default: return <OverviewTab data={data} year={year} month={month} />;
        }
    };

    return (
        <>
            <Topbar section="Overview" breadcrumb="Dashboard" title="Dashboard" onRefresh={fetchDashboard} loading={loading} />
            <div className="page-content">
                {/* Tab Bar */}
                <div style={{
                    display: 'flex', gap: 2, marginBottom: 20, padding: 4,
                    background: 'var(--bg-card)', borderRadius: 10,
                    border: '1px solid var(--border-color)', overflow: 'auto',
                }}>
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontSize: 13, fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap',
                                background: isActive ? 'var(--primary)' : 'transparent',
                                color: isActive ? '#fff' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease',
                            }}>
                                <Icon size={15} /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Filters (Hidden for stores tab as it manages its own filters) */}
                {activeTab !== 'stores' && (
                    <div className="filters-bar" style={{ marginBottom: 20 }}>
                        <div className="filter-group">
                            <select className="filter-select year-select" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 90 }}>
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <select className="filter-select" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 120 }}>
                                <option value="">All Months</option>
                                {MONTHS_SHORT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <select className="filter-select" value={teamId} onChange={e => setTeamId(e.target.value)} style={{ width: 140 }}>
                                <option value="">All Teams</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {renderContent()}
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════
   ██  TAB: OVERVIEW
   ═══════════════════════════════════════════ */
function OverviewTab({ data, year, month }) {
    const { summary, monthly_trend, team_comparison } = data;
    const chartData = useMemo(() => fillChartData(monthly_trend, ['income', 'expense'], year, month), [monthly_trend, year, month]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {summary && (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <StatCard label="Total Income" value={fmtMoney(summary.total_income)} icon={ArrowDownCircle} color={COLORS.income} sub="From all topup" />
                    <StatCard label="Total Expense" value={fmtMoney(summary.total_expense)} icon={ArrowUpCircle} color={COLORS.expense} sub="From all topup" />
                    <StatCard label="Net Profit" value={fmtMoney(summary.net_profit)} icon={TrendingUp} color={COLORS.primary} sub="Income − Expense" />
                    <StatCard label="Transactions" value={fmtNumber(summary.topup_count)} icon={Hash} color={COLORS.amber} sub="Total topup" />
                    <StatCard label="Stores" value={fmtNumber(summary.total_stores)} icon={Store} color={COLORS.cyan} sub="Payment stores" />
                    <StatCard label="Media Spend" value={fmtMoney(summary.media_total)} icon={ImageIcon} color={COLORS.pink} sub={`${summary.media_count} transactions`} />
                    <StatCard label="Designs" value={fmtNumber(summary.total_designs)} icon={Palette} color={COLORS.purple} sub="Total designs" />
                    <StatCard label="Fulfillment" value={fmtNumber(summary.total_orders)} icon={Package} color={COLORS.teal} sub={fmtMoney(summary.total_fulfill_price)} />
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                <ChartCard title="Revenue Overview" subtitle="Monthly income vs expense trend"
                    legend={[{ label: 'Income', color: COLORS.income }, { label: 'Expense', color: COLORS.expense }]}>
                    <SmoothAreaChart
                        data={chartData}
                        areas={[
                            { dataKey: 'income', name: 'Income', color: COLORS.income },
                            { dataKey: 'expense', name: 'Expense', color: COLORS.expense },
                        ]}
                        formatter={fmtMoney}
                        yFormatter={fmtMoneyShort}
                        height={280}
                    />
                </ChartCard>

                <ChartCard title="Team Comparison" subtitle="Revenue by team">
                    <HorizontalBar items={team_comparison} valueKey="income" color={COLORS.primary} formatValue={fmtMoney} />
                </ChartCard>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   ██  TAB: TOPUP
   ═══════════════════════════════════════════ */
function TopupTab({ data, year, month }) {
    const { summary, monthly, by_method, by_team, top_vendors } = data;
    const chartData = useMemo(() => fillChartData(monthly, ['income', 'expense'], year, month), [monthly, year, month]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {summary && (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <StatCard label="Income" value={fmtMoney(summary.total_income)} icon={ArrowDownCircle} color={COLORS.income} sub="Total income" />
                    <StatCard label="Expense" value={fmtMoney(summary.total_expense)} icon={ArrowUpCircle} color={COLORS.expense} sub="Total expense" />
                    <StatCard label="Net" value={fmtMoney(summary.net)} icon={DollarSign} color={COLORS.primary} sub="Income − Expense" />
                    <StatCard label="Transactions" value={fmtNumber(summary.count)} icon={Hash} color={COLORS.amber} sub={`${summary.completed} paid · ${summary.pending} pending`} />
                </div>
            )}

            <ChartCard title="Monthly Trend" subtitle="Income vs Expense"
                legend={[{ label: 'Income', color: COLORS.income }, { label: 'Expense', color: COLORS.expense }]}>
                <SmoothAreaChart
                    data={chartData}
                    areas={[
                        { dataKey: 'income', name: 'Income', color: COLORS.income },
                        { dataKey: 'expense', name: 'Expense', color: COLORS.expense },
                    ]}
                    formatter={fmtMoney}
                    yFormatter={fmtMoneyShort}
                    height={300}
                />
            </ChartCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                <ChartCard title="By Payment Method" subtitle="Income distribution">
                    <HorizontalBar items={by_method} valueKey="income" labelKey="payment_method" color={COLORS.purple} formatValue={fmtMoney} />
                </ChartCard>
                <ChartCard title="Team Breakdown" subtitle="Income comparison">
                    <HorizontalBar items={by_team} valueKey="income" color={COLORS.cyan} formatValue={fmtMoney} />
                </ChartCard>
                <ChartCard title="Top Vendors" subtitle="By total transaction amount">
                    <MiniRankingTable
                        items={top_vendors}
                        columns={[
                            { key: 'vendor_name', label: 'Vendor', bold: true },
                            { key: 'total_amount', label: 'Amount', align: 'right', bold: true, color: COLORS.primary, render: r => fmtMoney(r.total_amount) },
                        ]}
                    />
                </ChartCard>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   ██  TAB: STORES
   ═══════════════════════════════════════════ */
function StoresTab({ teams }) {
    // ── Payment History local filter (default: all-time) ──
    const [phYear, setPhYear] = useState('');
    const [phMonth, setPhMonth] = useState('');

    // ── Stores section local filter (default: current year) ──
    const [storeYear, setStoreYear] = useState(new Date().getFullYear());
    const [storeMonth, setStoreMonth] = useState('');
    const [storeTeamId, setStoreTeamId] = useState('');

    const [localData, setLocalData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({ tab: 'stores', year: storeYear });
            if (storeMonth) params.append('month', storeMonth);
            if (storeTeamId) params.append('team_id', storeTeamId);
            if (phYear) params.append('ph_year', phYear);
            if (phMonth) params.append('ph_month', phMonth);
            const res = await fetch(`${API_BASE}/api/dashboard?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setLocalData(json.data);
            }
        } catch (err) { console.error('Stores tab fetch error:', err); }
        finally { setLoading(false); }
    }, [storeYear, storeMonth, storeTeamId, phYear, phMonth]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const chartData = useMemo(() => {
        if (!localData) return [];
        return fillChartData(localData.monthly, ['total_net', 'total_amount'], phYear, phMonth);
    }, [localData, phYear, phMonth]);

    if (!localData) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                {loading ? 'Loading stores data...' : 'No data available'}
            </div>
        );
    }

    const { payment_years } = localData;

    const sectionStyle = {
        background: 'var(--card-bg)', borderRadius: 14, padding: 20,
        border: '1px solid rgba(99,102,241,0.08)',
        display: 'flex', flexDirection: 'column', gap: 16,
    };
    const filterBarStyle = {
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        background: 'rgba(99,102,241,0.06)', borderRadius: 10, flexWrap: 'wrap',
    };
    const selectStyle = {
        background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer', outline: 'none',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ══════════════════════════════════════════
                ██ SECTION 1: PAYMENT HISTORY (own filter)
                ══════════════════════════════════════════ */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Payment History</h3>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                            {phYear ? `Year ${phYear}${phMonth ? ` · Month ${phMonth}` : ''}` : 'All time'}
                        </p>
                    </div>
                    <div style={filterBarStyle}>
                        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                        <select value={phYear} onChange={e => { setPhYear(e.target.value); setPhMonth(''); }} style={selectStyle}>
                            <option value="">All Years</option>
                            {(payment_years || []).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {phYear && (
                            <select value={phMonth} onChange={e => setPhMonth(e.target.value)} style={selectStyle}>
                                <option value="">All Months</option>
                                {MONTHS_SHORT.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                            </select>
                        )}
                        {loading && <div className="spinner" style={{ width: 16, height: 16 }} />}
                    </div>
                </div>

                {localData.ph_summary && (
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                        <StatCard label="Total Amount" value={fmtMoney(localData.ph_summary.total_amount)} icon={TrendingUp} color={COLORS.amber} sub="Before fees" />
                        <StatCard label="Net Payments" value={fmtMoney(localData.ph_summary.total_net)} icon={DollarSign} color={COLORS.income} sub="Actual received" />
                        <StatCard label="Transactions" value={fmtNumber(localData.ph_summary.tx_count)} icon={Hash} color={COLORS.cyan} sub="Payment records" />
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <ChartCard title="Monthly Payments" subtitle="Net amount vs Total amount"
                        legend={[{ label: 'Net', color: COLORS.income }, { label: 'Amount', color: COLORS.amber }]}>
                        <SmoothAreaChart
                            data={chartData}
                            areas={[
                                { dataKey: 'total_net', name: 'Net', color: COLORS.income },
                                { dataKey: 'total_amount', name: 'Amount', color: COLORS.amber },
                            ]}
                            formatter={fmtMoney}
                            yFormatter={fmtMoneyShort}
                            height={260}
                        />
                    </ChartCard>
                    <ChartCard title="By Payment Source" subtitle="Where the money came from">
                        <HorizontalBar items={localData.by_source} valueKey="total_net" labelKey="source" color={COLORS.purple} formatValue={fmtMoney} />
                    </ChartCard>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                ██ SECTION 2: STORES (dashboard filter)
                ══════════════════════════════════════════ */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Stores</h3>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                            Selected period: {storeYear}{storeMonth ? ` · Month ${storeMonth}` : ' · All months'}
                        </p>
                    </div>
                    {/* Stores Filter Bar (Pulled from global dashboard header) */}
                    <div className="filters-bar" style={{ gap: 10, background: 'rgba(99,102,241,0.06)', borderRadius: 10, padding: '10px 16px', display: 'flex' }}>
                        <select className="filter-select year-select" value={storeYear} onChange={e => setStoreYear(Number(e.target.value))} style={{ ...selectStyle, width: 90 }}>
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select className="filter-select" value={storeMonth} onChange={e => setStoreMonth(e.target.value)} style={{ ...selectStyle, width: 120 }}>
                            <option value="">All Months</option>
                            {MONTHS_SHORT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <select className="filter-select" value={storeTeamId} onChange={e => setStoreTeamId(e.target.value)} style={{ ...selectStyle, width: 140 }}>
                            <option value="">All Teams</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        {loading && <div className="spinner" style={{ width: 16, height: 16 }} />}
                    </div>
                </div>

                {localData.stores_summary && (
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                        <StatCard label="Total Stores" value={fmtNumber(localData.stores_summary.total_stores)} icon={Store} color={COLORS.primary} sub={`${localData.stores_summary.active_stores} active`} />
                        <StatCard label="Transactions" value={fmtNumber(localData.stores_summary.tx_count)} icon={Hash} color={COLORS.cyan} sub="In selected period" />
                    </div>
                )}

                <ChartCard title="Store Performance" subtitle="Total payments and amount per store"
                    legend={[{ label: 'Total Amount', color: COLORS.income }, { label: 'Transactions', color: COLORS.primary }]}>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={localData.top_stores} margin={{ top: 5, right: 20, left: 10, bottom: 0 }} barGap={8}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={fmtMoneyShort} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 500, fontSize: '13px' }}
                                cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                                formatter={(value, name) => [name === 'total_amount' ? fmtMoney(value) : fmtNumber(value), name === 'total_amount' ? 'Amount' : 'Transactions']}
                            />
                            <Bar yAxisId="left" dataKey="total_amount" name="total_amount" fill={COLORS.income} radius={[4, 4, 0, 0]} barSize={32} />
                            <Bar yAxisId="right" dataKey="total_payments" name="total_payments" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Top Stores" subtitle="By total payment amount">
                    <MiniRankingTable
                        items={localData.top_stores}
                        columns={[
                            { key: 'name', label: 'Store', bold: true },
                            { key: 'total_amount', label: 'Amount', align: 'right', bold: true, color: COLORS.income, render: r => fmtMoney(r.total_amount) },
                            { key: 'total_payments', label: 'Txns', align: 'right', render: r => fmtNumber(r.total_payments) },
                        ]}
                    />
                </ChartCard>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   ██  TAB: MEDIA
   ═══════════════════════════════════════════ */
function MediaTab({ data, year, month }) {
    const { summary, monthly, by_bank, by_team } = data;
    const chartData = useMemo(() => fillChartData(monthly, ['total'], year, month), [monthly, year, month]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {summary && (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <StatCard label="Total Spend" value={fmtMoney(summary.total_amount)} icon={ImageIcon} color={COLORS.pink} sub="Media transactions" />
                    <StatCard label="Transactions" value={fmtNumber(summary.count)} icon={Hash} color={COLORS.primary} sub="Total records" />
                    <StatCard label="Completed" value={fmtMoney(summary.completed_amount)} icon={Activity} color={COLORS.income} sub="Completed amount" />
                </div>
            )}

            <ChartCard title="Monthly Media Spend" subtitle="Spending trend over months">
                <SmoothAreaChart
                    data={chartData}
                    areas={[{ dataKey: 'total', name: 'Spend', color: COLORS.pink }]}
                    formatter={fmtMoney}
                    yFormatter={fmtMoneyShort}
                    height={280}
                />
            </ChartCard>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <ChartCard title="By Bank" subtitle="Distribution by bank">
                    <HorizontalBar items={by_bank} valueKey="total" labelKey="bank" color={COLORS.purple} formatValue={fmtMoney} />
                </ChartCard>
                <ChartCard title="Team Breakdown" subtitle="Media spend by team">
                    <HorizontalBar items={by_team} valueKey="total" color={COLORS.cyan} formatValue={fmtMoney} />
                </ChartCard>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   ██  TAB: DESIGN STATISTICS
   ═══════════════════════════════════════════ */
function DesignTab({ data, year, month }) {
    const { summary, monthly, by_team, top_designers } = data;
    const chartData = useMemo(() => fillChartData(monthly, ['total_designs', 'total_print', 'total_embroidery', 'total_sticker'], year, month), [monthly, year, month]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {summary && (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <StatCard label="Total Designs" value={fmtNumber(summary.total_designs)} icon={Palette} color={COLORS.purple} sub="All types" />
                    <StatCard label="Print" value={fmtNumber(summary.total_print)} icon={Palette} color={COLORS.blue} sub="Print designs" />
                    <StatCard label="Embroidery" value={fmtNumber(summary.total_embroidery)} icon={Palette} color={COLORS.amber} sub="Embroidery designs" />
                    <StatCard label="Sticker" value={fmtNumber(summary.total_sticker)} icon={Palette} color={COLORS.income} sub="Sticker designs" />
                </div>
            )}

            <ChartCard title="Design Output" subtitle="Monthly breakdown by type"
                legend={[
                    { label: 'Print', color: COLORS.blue },
                    { label: 'Embroidery', color: COLORS.amber },
                    { label: 'Sticker', color: COLORS.income },
                ]}>
                <SmoothAreaChart
                    data={chartData}
                    areas={[
                        { dataKey: 'total_print', name: 'Print', color: COLORS.blue },
                        { dataKey: 'total_embroidery', name: 'Embroidery', color: COLORS.amber },
                        { dataKey: 'total_sticker', name: 'Sticker', color: COLORS.income },
                    ]}
                    formatter={fmtNumber}
                    height={300}
                />
            </ChartCard>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <ChartCard title="Top Designers" subtitle="By total design count">
                    <MiniRankingTable
                        items={top_designers}
                        columns={[
                            { key: 'user_name', label: 'Designer', bold: true },
                            { key: 'total_designs', label: 'Designs', align: 'right', bold: true, color: COLORS.purple, render: r => fmtNumber(r.total_designs) },
                        ]}
                    />
                </ChartCard>
                <ChartCard title="Team Comparison" subtitle="Design output by team">
                    <HorizontalBar items={by_team} valueKey="total_designs" color={COLORS.purple} formatValue={fmtNumber} />
                </ChartCard>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   ██  TAB: FULFILLMENT STATISTICS
   ═══════════════════════════════════════════ */
function FulfillmentTab({ data, year, month }) {
    const { summary, monthly, by_team, top_fulfillers } = data;
    const chartData = useMemo(() => fillChartData(monthly, ['total_orders', 'total_price'], year, month), [monthly, year, month]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {summary && (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <StatCard label="Total Orders" value={fmtNumber(summary.total_orders)} icon={Package} color={COLORS.teal} sub="Fulfilled orders" />
                    <StatCard label="Total Revenue" value={fmtMoney(summary.total_price)} icon={DollarSign} color={COLORS.primary} sub="Fulfillment price" />
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <ChartCard title="Monthly Orders" subtitle="Order volume trend">
                    <SmoothAreaChart
                        data={chartData}
                        areas={[{ dataKey: 'total_orders', name: 'Orders', color: COLORS.teal }]}
                        formatter={fmtNumber}
                    />
                </ChartCard>
                <ChartCard title="Monthly Revenue" subtitle="Revenue trend">
                    <SmoothAreaChart
                        data={chartData}
                        areas={[{ dataKey: 'total_price', name: 'Revenue', color: COLORS.primary }]}
                        formatter={fmtMoney}
                        yFormatter={fmtMoneyShort}
                    />
                </ChartCard>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <ChartCard title="Top Fulfillers" subtitle="By order count">
                    <MiniRankingTable
                        items={top_fulfillers}
                        columns={[
                            { key: 'name', label: 'User', bold: true },
                            { key: 'total_orders', label: 'Orders', align: 'right', bold: true, color: COLORS.teal, render: r => fmtNumber(r.total_orders) },
                            { key: 'total_price', label: 'Revenue', align: 'right', color: COLORS.primary, render: r => fmtMoney(r.total_price) },
                        ]}
                    />
                </ChartCard>
                <ChartCard title="Team Comparison" subtitle="Orders by team">
                    <HorizontalBar items={by_team} valueKey="total_orders" color={COLORS.teal} formatValue={fmtNumber} />
                </ChartCard>
            </div>
        </div>
    );
}
