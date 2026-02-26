import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, BarChart3, Palette, Printer, Scissors, Sticker, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import Topbar from '../components/Topbar';
import DataTable from '../components/DataTable';

const API_BASE = import.meta.env.VITE_API_URL || '';

/* ── Toast ── */
function ToastContainer({ toasts, removeToast }) {
    return (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    padding: '12px 20px', borderRadius: '8px',
                    background: t.type === 'success' ? 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))' :
                        t.type === 'error' ? 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))' :
                            'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(79,70,229,0.95))',
                    color: '#fff', fontSize: '13px', fontWeight: 500,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: '10px', minWidth: '280px',
                    animation: 'slideInRight 0.3s ease-out', cursor: 'pointer',
                }} onClick={() => removeToast(t.id)}>
                    <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
                    <span style={{ flex: 1 }}>{t.message}</span>
                    <X size={14} style={{ opacity: 0.7 }} />
                </div>
            ))}
        </div>
    );
}

/* ── Stat Card ── */
function StatCard({ icon: Icon, label, value, color, sub }) {
    return (
        <div className="stat-card">
            <div className="stat-card-header">
                <div className={`stat-card-icon ${color}`}><Icon size={20} /></div>
                <span className="stat-card-label">{label}</span>
            </div>
            <div className="stat-card-value">{value}</div>
            {sub && <div className="stat-card-sub">{sub}</div>}
        </div>
    );
}

const MONTHS = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

/* ── Main Page ── */
export default function DesignStatisticsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState({});
    const [dateLabel, setDateLabel] = useState('');
    const [teamOptions, setTeamOptions] = useState([]);

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [userFilter, setUserFilter] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });

    // Toasts
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);
    const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page, per_page: 20, year, month });
            if (userFilter.trim()) params.append('user', userFilter.trim());
            if (teamFilter.trim()) params.append('team', teamFilter.trim());

            const res = await fetch(`${API_BASE}/api/design-statistics?${params}`);
            const json = await res.json();

            if (json.success) {
                setData(json.data || []);
                setSummary(json.summary || {});
                setPagination(json.pagination || { current_page: 1, last_page: 1, per_page: 20, total: 0 });
                setDateLabel(json.date || '');
                if (json.teams) setTeamOptions(json.teams);
            } else {
                setError(json.message || 'Failed to load data');
                setData([]);
            }
        } catch (err) {
            setError(err.message);
            setData([]);
            addToast('Error loading data: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [year, month, page, teamFilter]);
    useEffect(() => { setPage(1); }, [year, month, teamFilter]);

    // Debounced user search
    const [userSearchTimeout, setUserSearchTimeout] = useState(null);
    const handleUserSearch = (val) => {
        setUserFilter(val);
        if (userSearchTimeout) clearTimeout(userSearchTimeout);
        setUserSearchTimeout(setTimeout(() => {
            setPage(1);
            // trigger re-fetch via useEffect won't work for userFilter alone
            // so we call fetchData directly after setting page
        }, 400));
    };
    // Re-fetch when userFilter changes (with debounce effect)
    useEffect(() => {
        const timer = setTimeout(() => { fetchData(); }, 300);
        return () => clearTimeout(timer);
    }, [userFilter]);

    // Month navigation
    const handlePrevMonth = () => {
        if (month === 1) { setMonth(12); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const handleNextMonth = () => {
        if (month === 12) { setMonth(1); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    // Generate year options (2024 to current+1)
    const yearOptions = [];
    for (let y = 2024; y <= now.getFullYear() + 1; y++) yearOptions.push(y);

    // Table columns matching screenshot order: DATE, USER, TEAM, PRINT DESIGNS, EMBROIDERY DESIGNS, STICKER DESIGNS, TOTAL DESIGNS
    const columns = useMemo(() => [
        {
            key: 'date', label: 'Date', width: '8%',
            render: () => <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{dateLabel || `${String(month).padStart(2, '0')}/${year}`}</span>,
        },
        {
            key: 'user', label: 'User', width: '22%',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                        src={row.avatar}
                        alt={row.name}
                        style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            objectFit: 'cover', border: '2px solid var(--border-color)',
                        }}
                        onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(row.name) + '&background=6366f1&color=fff&size=32'; }}
                    />
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{row.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({row.role?.name || '—'})</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'team', label: 'Team', width: '14%',
            render: (row) => {
                const teamName = row.user_detail?.team?.name;
                if (!teamName) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
                return (
                    <span style={{
                        padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                        background: 'rgba(99,102,241,0.12)', color: '#6366f1',
                        whiteSpace: 'nowrap',
                    }}>
                        {teamName}
                    </span>
                );
            },
        },
        {
            key: 'print_count', label: 'Print Designs', width: '14%', style: { textAlign: 'center' }, tdStyle: { textAlign: 'center' },
            render: (row) => (
                <span style={{
                    fontWeight: 600, fontSize: '13px',
                    color: row.print_count > 0 ? '#10b981' : 'var(--text-muted)',
                }}>
                    {row.print_count || 0} prints
                </span>
            ),
        },
        {
            key: 'embroidery_count', label: 'Embroidery Designs', width: '14%', style: { textAlign: 'center' }, tdStyle: { textAlign: 'center' },
            render: (row) => (
                <span style={{
                    fontWeight: 600, fontSize: '13px',
                    color: row.embroidery_count > 0 ? '#a855f7' : 'var(--text-muted)',
                }}>
                    {row.embroidery_count || 0} embroidery
                </span>
            ),
        },
        {
            key: 'sticker_count', label: 'Sticker Designs', width: '14%', style: { textAlign: 'center' }, tdStyle: { textAlign: 'center' },
            render: (row) => (
                <span style={{
                    fontWeight: 600, fontSize: '13px',
                    color: row.sticker_count > 0 ? '#f97316' : 'var(--text-muted)',
                }}>
                    {row.sticker_count || 0} stickers
                </span>
            ),
        },
        {
            key: 'designs_count', label: 'Total Designs', width: '14%', style: { textAlign: 'center' }, tdStyle: { textAlign: 'center' },
            render: (row) => (
                <span style={{
                    fontWeight: 700, fontSize: '14px',
                    color: row.designs_count > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>
                    {row.designs_count || 0} designs
                </span>
            ),
        },
    ], [dateLabel, month, year]);

    // Footer totals row
    const footerRow = useMemo(() => {
        if (!data.length) return null;
        return (
            <tr>
                <td colSpan={3} style={{ fontWeight: 700, padding: '14px 16px' }}>
                    TOTAL: {pagination.total} designers
                </td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: '#10b981', padding: '14px 16px' }}>
                    {summary.total_print || 0} prints
                </td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: '#a855f7', padding: '14px 16px' }}>
                    {summary.total_embroidery || 0} embroidery
                </td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: '#f97316', padding: '14px 16px' }}>
                    {summary.total_sticker || 0} stickers
                </td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '15px', padding: '14px 16px' }}>
                    {summary.total_designs || 0} designs
                </td>
            </tr>
        );
    }, [data, summary, pagination]);

    return (
        <>
            <Topbar
                section="Analytics"
                breadcrumb="Design Statistics"
                title="Design Statistics"
                onRefresh={fetchData}
                loading={loading}
                actions={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button className="btn btn-ghost" onClick={handlePrevMonth} style={{ padding: '6px' }}><ChevronLeft size={16} /></button>
                        <div style={{
                            padding: '6px 16px', borderRadius: '8px',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                            fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)',
                            minWidth: '130px', textAlign: 'center',
                        }}>
                            {MONTHS.find(m => m.value === month)?.label} {year}
                        </div>
                        <button className="btn btn-ghost" onClick={handleNextMonth} style={{ padding: '6px' }}><ChevronRight size={16} /></button>
                    </div>
                }
            />
            <div className="page-content">

                {/* Stats Cards */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
                    <StatCard icon={Palette} label="Total Designs" value={summary.total_designs || 0} color="blue" sub={`${pagination.total || 0} designers`} />
                    <StatCard icon={Printer} label="Print" value={summary.total_print || 0} color="green" sub="Print designs" />
                    <StatCard icon={Scissors} label="Embroidery" value={summary.total_embroidery || 0} color="purple" sub="Embroidery designs" />
                    <StatCard icon={Sticker} label="Sticker" value={summary.total_sticker || 0} color="orange" sub="Sticker designs" />
                </div>

                {/* Filters */}
                <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* User search */}
                    <div style={{ position: 'relative', flex: '0 1 240px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            className="filter-input"
                            placeholder="Search by user..."
                            value={userFilter}
                            onChange={e => handleUserSearch(e.target.value)}
                            style={{ width: '100%', paddingLeft: '36px' }}
                        />
                    </div>

                    {/* Team filter */}
                    <select className="filter-select" value={teamFilter} onChange={e => setTeamFilter(e.target.value)} style={{ minWidth: '160px' }}>
                        <option value="">All Teams</option>
                        {teamOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    {/* Year filter */}
                    <select className="filter-select" value={year} onChange={e => setYear(Number(e.target.value))} style={{ minWidth: '100px' }}>
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    {/* Month filter */}
                    <select className="filter-select" value={month} onChange={e => setMonth(Number(e.target.value))} style={{ minWidth: '130px' }}>
                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>

                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        Showing {data.length} / {pagination.total} designers
                    </span>
                </div>

                {/* Table */}
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    error={error}
                    emptyMessage="No design statistics found"
                    emptyDescription="Try adjusting the month or filters."
                    pagination={pagination}
                    page={page}
                    onPageChange={setPage}
                    footerRow={footerRow}
                    tableId="design-statistics-table"
                />

            </div>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
}
