import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, BarChart3, Package, DollarSign, Store, X, ChevronLeft, ChevronRight, Users, Filter } from 'lucide-react';
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
function StatCard({ icon: Icon, label, value, color, sub, isMoney }) {
    return (
        <div className="stat-card">
            <div className="stat-card-header">
                <div className={`stat-card-icon ${color}`}><Icon size={20} /></div>
                <span className="stat-card-label">{label}</span>
            </div>
            <div className="stat-card-value">
                {isMoney ? `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (value || 0)}
            </div>
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
export default function FulfillmentStatisticsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState({});
    const [dateLabel, setDateLabel] = useState('');
    const [teamOptions, setTeamOptions] = useState([]);
    const [fulfillUnitOptions, setFulfillUnitOptions] = useState([]);

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [userFilter, setUserFilter] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [fulfillUnitFilter, setFulfillUnitFilter] = useState('');
    const [type, setType] = useState('user'); // 'user' or 'store'
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });

    // Toasts
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((message, t = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type: t }]);
        setTimeout(() => setToasts(prev => prev.filter(tt => tt.id !== id)), 3500);
    }, []);
    const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ type, page, per_page: 20, year, month });
            if (userFilter.trim()) params.append('user', userFilter.trim());
            if (teamFilter.trim()) params.append('team', teamFilter.trim());
            if (fulfillUnitFilter) params.append('fulfill_id', fulfillUnitFilter);

            const res = await fetch(`${API_BASE}/api/fulfillment-statistics?${params}`);
            const json = await res.json();

            if (json.success) {
                setData(json.data || []);
                setSummary(json.summary || {});
                setPagination(json.pagination || { current_page: 1, last_page: 1, per_page: 20, total: 0 });
                setDateLabel(json.date || '');
                if (json.teams) setTeamOptions(json.teams);
                if (json.fulfill_units) setFulfillUnitOptions(json.fulfill_units);
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

    useEffect(() => { fetchData(); }, [year, month, page, teamFilter, fulfillUnitFilter, type]);
    useEffect(() => { setPage(1); }, [year, month, teamFilter, fulfillUnitFilter, type]);

    // Debounced user search
    const [userSearchTimeout, setUserSearchTimeout] = useState(null);
    const handleUserSearch = (val) => {
        setUserFilter(val);
        if (userSearchTimeout) clearTimeout(userSearchTimeout);
        setUserSearchTimeout(setTimeout(() => {
            setPage(1);
        }, 400));
    };

    // Re-fetch when userFilter changes
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

    const yearOptions = [];
    for (let y = 2024; y <= now.getFullYear() + 1; y++) yearOptions.push(y);

    // Columns config
    const columns = useMemo(() => {
        if (type === 'store') {
            return [
                {
                    key: 'date', label: 'DATE', width: '10%',
                    render: () => <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{dateLabel || `${String(month).padStart(2, '0')}/${year}`}</span>,
                },
                {
                    key: 'user', label: 'USER', width: '25%',
                    render: (row) => {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img
                                    src={row.avatar}
                                    alt={row.name}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        objectFit: 'cover', border: '2px solid var(--border-color)',
                                    }}
                                    onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(row.name || 'U') + '&background=6366f1&color=fff&size=32'; }}
                                />
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{row.name || '—'}</div>
                            </div>
                        );
                    },
                },
                {
                    key: 'acc_code', label: 'ACC CODE', width: '20%',
                    render: (row) => (
                        <span style={{
                            padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                            background: 'rgba(99,102,241,0.12)', color: '#6366f1',
                        }}>
                            {row.account_code || '—'}
                        </span>
                    ),
                },
                {
                    key: 'status', label: 'STATUS', width: '15%',
                    render: (row) => {
                        const s = row.status_name || '—';
                        return (
                            <span style={{
                                padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                background: s === 'Active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                color: s === 'Active' ? '#10b981' : '#ef4444',
                            }}>
                                {s}
                            </span>
                        );
                    },
                },
                {
                    key: 'total_ords', label: 'TOTAL ORDS', width: '15%', style: { textAlign: 'center' }, tdStyle: { textAlign: 'center' },
                    render: (row) => (
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#10b981' }}>
                            {row.order_count || 0} orders
                        </span>
                    ),
                },
                {
                    key: 'total_fulfill_price', label: 'TOTAL FULFILL PRICE', width: '15%', style: { textAlign: 'right' }, tdStyle: { textAlign: 'right' },
                    render: (row) => (
                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#f59e0b' }}>
                            ${Number(row.total_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    ),
                },
            ];
        }

        // For user type
        return [
            {
                key: 'date', label: 'DATE', width: '10%',
                render: () => <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{dateLabel || `${String(month).padStart(2, '0')}/${year}`}</span>,
            },
            {
                key: 'user', label: 'USER', width: '30%',
                render: (row) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                            src={row.avatar}
                            alt={row.name}
                            style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                objectFit: 'cover', border: '2px solid var(--border-color)',
                            }}
                            onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(row.name || 'U') + '&background=6366f1&color=fff&size=32'; }}
                        />
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{row.name}</div>
                            <div style={{ fontSize: '11px', color: '#3b82f6' }}>({row.role_name || '—'})</div>
                        </div>
                    </div>
                ),
            },
            {
                key: 'team', label: 'TEAM', width: '20%',
                render: (row) => {
                    const teamName = row.team_name;
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
                key: 'total_ords', label: 'TOTAL ORDS', width: '20%', style: { textAlign: 'center' }, tdStyle: { textAlign: 'center' },
                render: (row) => (
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#10b981' }}>
                        {row.order_count || 0} orders
                    </span>
                ),
            },
            {
                key: 'total_fulfill_price', label: 'TOTAL FULFILL PRICE', width: '20%', style: { textAlign: 'right' }, tdStyle: { textAlign: 'right' },
                render: (row) => (
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#f59e0b' }}>
                        ${Number(row.total_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                ),
            },
        ];
    }, [dateLabel, month, year, type]);

    const footerRow = useMemo(() => {
        if (!data.length) return null;
        return (
            <tr>
                <td colSpan={type === 'store' ? 4 : 3} style={{ fontWeight: 700, padding: '14px 16px' }}>
                    TOTAL: {pagination.total} {type === 'store' ? 'stores' : 'users'}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: '#10b981', padding: '14px 16px' }}>
                    {summary.total_ords || 0} orders
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#f59e0b', fontSize: '15px', padding: '14px 16px' }}>
                    ${Number(summary.total_fulfill_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
            </tr>
        );
    }, [data, summary, pagination, type]);

    return (
        <>
            <Topbar
                section="Analytics"
                breadcrumb="Fulfillment Statistics"
                title="Fulfillment Statistics"
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

                {/* Stats Cards (moved up) */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                    <StatCard icon={type === 'store' ? Store : Users} label={type === 'store' ? 'Total Stores' : 'Total Users'} value={pagination.total || 0} color="blue" sub={`In ${MONTHS.find(m => m.value === month)?.label}`} />
                    <StatCard icon={Package} label="Total Orders" value={summary.total_ords || 0} color="green" sub="Order Fulfillments" />
                    <StatCard icon={DollarSign} label="Total Fulfill Price" value={summary.total_fulfill_price || 0} color="orange" sub="Fulfillment cost" isMoney={true} />
                </div>

                {/* Filters Row */}
                <div className="filters-bar">
                    <div className="filter-group">
                        <Search size={15} style={{ color: 'var(--text-muted)' }} />
                        <input
                            className="filter-input"
                            placeholder="Select User..."
                            value={userFilter}
                            onChange={e => handleUserSearch(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                        <select className="filter-select" value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
                            <option value="">Select Team</option>
                            {teamOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select className="filter-select" value={fulfillUnitFilter} onChange={e => setFulfillUnitFilter(e.target.value)}>
                            <option value="">Fulfillment Unit</option>
                            {fulfillUnitOptions.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select className="filter-select year-select" value={year} onChange={e => setYear(Number(e.target.value))}>
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select className="filter-select" value={month} onChange={e => setMonth(Number(e.target.value))}>
                            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Tabs Row (Export + User/Store) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 600, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: '-2px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        Export
                    </button>

                    <button
                        onClick={() => setType('user')}
                        style={{
                            background: 'none', border: 'none', padding: '10px 16px', fontSize: '14px', fontWeight: 600,
                            cursor: 'pointer', color: type === 'user' ? '#6366f1' : 'var(--text-muted)',
                            borderBottom: type === 'user' ? '2px solid #6366f1' : '2px solid transparent',
                            marginBottom: '-1px'
                        }}>
                        User
                    </button>

                    <button
                        onClick={() => setType('store')}
                        style={{
                            background: 'none', border: 'none', padding: '10px 16px', fontSize: '14px', fontWeight: 600,
                            cursor: 'pointer', color: type === 'store' ? '#6366f1' : 'var(--text-muted)',
                            borderBottom: type === 'store' ? '2px solid #6366f1' : '2px solid transparent',
                            marginBottom: '-1px'
                        }}>
                        Store
                    </button>

                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: 'auto', marginBottom: '8px' }}>
                        Showing {data.length} / {pagination.total} {type === 'store' ? 'stores' : 'users'}
                    </span>
                </div>

                {/* Summary Row */}
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    error={error}
                    emptyMessage={`No ${type} statistics found`}
                    emptyDescription="Try adjusting the month or filters."
                    pagination={pagination}
                    page={page}
                    onPageChange={setPage}
                    footerRow={footerRow}
                    tableId={`fulfillment-statistics-${type}-table`}
                />

            </div>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
}
