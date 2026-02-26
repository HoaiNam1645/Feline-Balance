import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Download, Filter, Database, X } from 'lucide-react';
import Topbar from '../components/Topbar';
import StatsCards from '../components/StatsCards';

const API_BASE = import.meta.env.VITE_API_URL || '';

const MONTHS = [
    { key: 't1', label: 'T1' },
    { key: 't2', label: 'T2' },
    { key: 't3', label: 'T3' },
    { key: 't4', label: 'T4' },
    { key: 't5', label: 'T5' },
    { key: 't6', label: 'T6' },
    { key: 't7', label: 'T7' },
    { key: 't8', label: 'T8' },
    { key: 't9', label: 'T9' },
    { key: 't10', label: 'T10' },
    { key: 't11', label: 'T11' },
    { key: 't12', label: 'T12' },
];

function formatMoney(value) {
    if (value == null || value === 0) return null;
    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }) + '$';
}

function MoneyCell({ value, className = '' }) {
    const formatted = formatMoney(value);
    if (!formatted) return <span className={`money-value zero ${className}`}>—</span>;
    const cls = value > 0 ? 'positive' : value < 0 ? 'negative' : 'zero';
    return <span className={`money-value ${cls} ${className}`}>{formatted}</span>;
}

function StatusBadge({ status }) {
    if (!status) return <span className="status-badge pending">Unknown</span>;
    const s = status.toLowerCase();
    let cls = 'pending';
    if (s === 'active' || s === 'connected') cls = 'active';
    else if (s === 'inactive' || s === 'disconnected' || s === 'banned') cls = 'inactive';
    return <span className={`status-badge ${cls}`}>{status}</span>;
}

export default function ProfilesPage() {
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [teamFilter, setTeamFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [teams, setTeams] = useState([]);

    // Inline editing states
    const [editingRowId, setEditingRowId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // Fetch teams from DB
    useEffect(() => {
        fetch(`${API_BASE}/api/teams`)
            .then(res => res.json())
            .then(json => { if (json.success) setTeams(json.data); })
            .catch(() => { });
    }, []);

    // Toast notifications
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);
    const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    // Pagination states
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ year, page, per_page: 15 });
            if (teamFilter) params.append('team_id', teamFilter);
            if (statusFilter) params.append('status', statusFilter);
            if (search) params.append('search', search);

            const res = await fetch(`${API_BASE}/api/profiles?${params}`);
            const json = await res.json();

            if (json.success) {
                setData(json.data);
                setSummary(json.summary);
                if (json.pagination) {
                    setPagination(json.pagination);
                }
            } else {
                setError('Failed to load data');
            }
        } catch (err) {
            setError(err.message);
            // Use demo data for preview when API is down
            setData(getDemoData());
            setSummary({
                total_profiles: 8,
                total_net_earning: 45230.50,
                total_on_hold: 12450.00,
                total_paid: 32780.50,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [year, teamFilter, statusFilter, page]);

    const handleEditClick = (row) => {
        setEditingRowId(row.id);
        setEditFormData({
            team_id: row.team_id || '',
            profile_name: row.profile_name || '',
            profile_code: row.profile_code || '',
            status: row.status || '',
            bank_last4: row.bank_last4 || '',
        });
    };

    const handleCancelEdit = () => {
        setEditingRowId(null);
        setEditFormData({});
    };

    const handleSaveEdit = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/api/profiles/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(editFormData)
            });
            const json = await res.json();

            if (json.success) {
                setEditingRowId(null);
                addToast('Profile updated successfully!');
                fetchData();
            } else {
                addToast(json.message || 'Update failed!', 'error');
            }
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        }
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') fetchData();
    };



    const statuses = useMemo(() => {
        const set = new Set(data.map((d) => d.status).filter(Boolean));
        return [...set].sort();
    }, [data]);

    // Reset page to 1 when filters change (using a separate useEffect for filters)
    useEffect(() => {
        setPage(1);
    }, [year, teamFilter, statusFilter, search]);

    // Compute totals row
    const totals = useMemo(() => {
        // Backend now returns the comprehensive totals in summary!
        const t = {
            net_earning: summary.total_net_earning || 0,
            on_hold_amount: summary.total_on_hold || 0,
            total_paid: summary.total_paid || 0,
        };
        MONTHS.forEach((m) => (t[m.key] = summary[m.key] || 0));
        return t;
    }, [summary]);

    const yearOptions = [];
    for (let y = 2024; y <= new Date().getFullYear() + 1; y++) yearOptions.push(y);

    return (
        <>
            <Topbar onRefresh={fetchData} loading={loading} />
            <div className="page-content">
                <StatsCards summary={summary} />

                {/* Filters */}
                <div className="filters-bar">
                    <div className="filter-group">
                        <Search size={15} style={{ color: 'var(--text-muted)' }} />
                        <input
                            id="search-input"
                            className="filter-input"
                            placeholder="Search profile name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>

                    <div className="filter-group">
                        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                        <select
                            id="team-filter"
                            className="filter-select"
                            value={teamFilter}
                            onChange={(e) => setTeamFilter(e.target.value)}
                        >
                            <option value="">All Teams</option>
                            {teams.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select
                            id="status-filter"
                            className="filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            {statuses.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select
                            id="year-filter"
                            className="filter-select year-select"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                        >
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginLeft: 'auto' }}>
                        <button className="btn btn-ghost" id="export-btn">
                            <Download size={14} /> Export
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="table-container">
                    {loading ? (
                        <div className="table-loading">
                            <div className="spinner" />
                            <span>Loading profiles...</span>
                        </div>
                    ) : error && data.length === 0 ? (
                        <div className="table-empty">
                            <Database className="table-empty-icon" size={60} />
                            <h3>Unable to load data</h3>
                            <p>{error}</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="table-empty">
                            <Database className="table-empty-icon" size={60} />
                            <h3>No profiles found</h3>
                            <p>Try adjusting your filters or add new profiles.</p>
                        </div>
                    ) : (
                        <div className="table-scroll">
                            <table className="data-table" id="profiles-table" style={{ minWidth: '1800px' }}>
                                <thead>
                                    <tr>
                                        <th className="sticky-col col-team">#</th>
                                        <th className="sticky-col col-status">Team</th>
                                        <th className="sticky-col col-name">Profile</th>
                                        <th className="sticky-col col-action">Action</th>
                                        <th>Status</th>
                                        <th>Bank</th>
                                        <th className="text-right">Net Earning</th>
                                        <th className="text-right">On Hold</th>
                                        <th className="text-right">Total Paid</th>
                                        {MONTHS.map((m) => (
                                            <th key={m.key} className="month-col text-right">
                                                {m.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, idx) => {
                                        const isEditing = editingRowId === row.id;
                                        return (
                                            <tr key={row.id || idx}>
                                                <td className="sticky-col col-team">{idx + 1}</td>
                                                <td className="sticky-col col-status">
                                                    {isEditing ? (
                                                        <select
                                                            className="filter-select"
                                                            style={{ width: '100%', minWidth: '80px', padding: '4px 8px' }}
                                                            name="team_id"
                                                            value={editFormData.team_id}
                                                            onChange={handleEditFormChange}
                                                        >
                                                            <option value="">Select...</option>
                                                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className="team-badge">{row.team_name || '—'}</span>
                                                    )}
                                                </td>
                                                <td className="sticky-col col-name">
                                                    {isEditing ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <input
                                                                className="filter-input"
                                                                style={{ width: '100%', padding: '4px 8px' }}
                                                                name="profile_name"
                                                                placeholder="Name"
                                                                value={editFormData.profile_name}
                                                                onChange={handleEditFormChange}
                                                            />
                                                            <input
                                                                className="filter-input"
                                                                style={{ width: '100%', padding: '4px 8px', fontSize: '11px' }}
                                                                name="profile_code"
                                                                placeholder="Code"
                                                                value={editFormData.profile_code}
                                                                onChange={handleEditFormChange}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="profile-name">{row.profile_name || row.id}</span>
                                                            {row.profile_code && (
                                                                <span className="profile-code">{row.profile_code}</span>
                                                            )}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="sticky-col col-action">
                                                    {isEditing ? (
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleSaveEdit(row.id)}>Save</button>
                                                            <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleCancelEdit}>Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleEditClick(row)}>Edit</button>
                                                    )}
                                                </td>
                                                <td>
                                                    {isEditing ? (
                                                        <select
                                                            className="filter-select"
                                                            style={{ padding: '4px 8px' }}
                                                            name="status"
                                                            value={editFormData.status}
                                                            onChange={handleEditFormChange}
                                                        >
                                                            <option value="Active">Active</option>
                                                            <option value="Inactive">Inactive</option>
                                                            <option value="Pending">Pending</option>
                                                        </select>
                                                    ) : (
                                                        <StatusBadge status={row.status} />
                                                    )}
                                                </td>
                                                <td>
                                                    {isEditing ? (
                                                        <input
                                                            className="filter-input"
                                                            style={{ width: '70px', padding: '4px 8px' }}
                                                            name="bank_last4"
                                                            maxLength="4"
                                                            value={editFormData.bank_last4}
                                                            onChange={handleEditFormChange}
                                                        />
                                                    ) : (
                                                        row.bank_last4 ? (
                                                            <span style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
                                                                •••• {row.bank_last4}
                                                            </span>
                                                        ) : '—'
                                                    )}
                                                </td>
                                                <td className="text-right">
                                                    <MoneyCell value={row.net_earning} />
                                                </td>
                                                <td className="text-right">
                                                    <MoneyCell value={row.on_hold_amount} className="on-hold" />
                                                </td>
                                                <td className="text-right">
                                                    <MoneyCell value={row.total_paid} />
                                                </td>
                                                {
                                                    MONTHS.map((m) => (
                                                        <td
                                                            key={m.key}
                                                            className={`month-col text-right ${row[m.key] ? 'has-value' : ''}`}
                                                        >
                                                            <MoneyCell value={row[m.key]} />
                                                        </td>
                                                    ))
                                                }
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td className="sticky-col col-team" style={{ fontWeight: 700, borderRight: 'none', zIndex: 20, backgroundColor: 'var(--bg-table-header)' }}>
                                            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', whiteSpace: 'nowrap' }}>
                                                TOTAL ({summary.total_profiles ?? data.length} profiles)
                                            </div>
                                            &nbsp;
                                        </td>
                                        <td className="sticky-col col-status" style={{ borderRight: 'none', zIndex: 19, backgroundColor: 'var(--bg-table-header)' }}></td>
                                        <td className="sticky-col col-name" style={{ borderRight: 'none', zIndex: 18, backgroundColor: 'var(--bg-table-header)' }}></td>
                                        <td className="sticky-col col-action" style={{ borderRight: '1px solid var(--border-color)', zIndex: 17, backgroundColor: 'var(--bg-table-header)' }}></td>
                                        <td></td>
                                        <td></td>
                                        <td className="text-right">
                                            <MoneyCell value={totals.net_earning} />
                                        </td>
                                        <td className="text-right">
                                            <MoneyCell value={totals.on_hold_amount} className="on-hold" />
                                        </td>
                                        <td className="text-right">
                                            <MoneyCell value={totals.total_paid} />
                                        </td>
                                        {MONTHS.map((m) => (
                                            <td key={m.key} className="month-col text-right">
                                                <MoneyCell value={totals[m.key]} />
                                            </td>
                                        ))}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* Pagination / Footer Info */}
                    {!loading && data.length > 0 && (
                        <div className="table-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                Showing {(pagination.current_page - 1) * pagination.per_page + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} profiles • Year {year}
                            </div>

                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <button
                                    className="btn btn-ghost"
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    style={{ padding: '4px 10px', fontSize: '13px' }}
                                >
                                    Prev
                                </button>

                                <div style={{ display: 'flex', gap: '2px', margin: '0 8px' }}>
                                    {(() => {
                                        const pages = [];
                                        const last = Math.max(1, pagination.last_page);

                                        if (last <= 5) {
                                            for (let i = 1; i <= last; i++) pages.push(i);
                                        } else {
                                            if (page <= 3) {
                                                pages.push(1, 2, 3, 4, '...', last);
                                            } else if (page >= last - 2) {
                                                pages.push(1, '...', last - 3, last - 2, last - 1, last);
                                            } else {
                                                pages.push(1, '...', page - 1, page, page + 1, '...', last);
                                            }
                                        }

                                        return pages.map((p, idx) => (
                                            p === '...' ? (
                                                <span key={`ellipsis-${idx}`} style={{ padding: '4px 8px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>...</span>
                                            ) : (
                                                <button
                                                    key={p}
                                                    className="btn btn-ghost"
                                                    style={{
                                                        padding: '4px',
                                                        minWidth: '32px',
                                                        height: '32px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: page === p ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                        color: page === p ? 'var(--primary)' : 'var(--text-secondary)',
                                                        fontWeight: page === p ? 600 : 400,
                                                        borderRadius: '4px'
                                                    }}
                                                    onClick={() => setPage(p)}
                                                >
                                                    {p}
                                                </button>
                                            )
                                        ));
                                    })()}
                                </div>

                                <button
                                    className="btn btn-ghost"
                                    disabled={page >= Math.max(1, pagination.last_page)}
                                    onClick={() => setPage(page + 1)}
                                    style={{ padding: '4px 10px', fontSize: '13px' }}
                                >
                                    Next
                                </button>
                            </div>

                            <div>Last updated: {new Date().toLocaleString()}</div>
                        </div>
                    )}
                </div>
            </div >

            {/* Toast notifications */}
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
        </>
    );
}

/* ============ DEMO DATA ============ */
function getDemoData() {
    return [
        {
            id: 'abc123def456ghi789jk01',
            profile_name: 'Shop TikTok US 01',
            profile_code: 'TT-US-001',
            seller_id: '7496282814211197303',
            team_id: 2, team_name: 'Team Alpha',
            status: 'Active',
            bank_last4: '4892',
            beneficiary_name: 'John Doe',
            net_earning: 8520.40,
            on_hold_amount: 1230.00,
            total_paid: 7290.40,
            t1: 1200.00, t2: 980.50, t3: 1450.00, t4: 870.00, t5: 1100.00, t6: 690.90,
            t7: 0, t8: 0, t9: 0, t10: 0, t11: 0, t12: 0,
        },
        {
            id: 'bcd234efg567hij890kl02',
            profile_name: 'Shop TikTok US 02',
            profile_code: 'TT-US-002',
            seller_id: '7496282814211197304',
            team_id: 2, team_name: 'Team Alpha',
            status: 'Active',
            bank_last4: '3351',
            beneficiary_name: 'Jane Smith',
            net_earning: 6340.20,
            on_hold_amount: 2100.00,
            total_paid: 4240.20,
            t1: 850.00, t2: 720.00, t3: 910.20, t4: 660.00, t5: 1100.00, t6: 0,
            t7: 0, t8: 0, t9: 0, t10: 0, t11: 0, t12: 0,
        },
        {
            id: 'cde345fgh678ijk901lm03',
            profile_name: 'Shop TikTok US 03',
            profile_code: 'TT-US-003',
            seller_id: '7496282814211197305',
            team_id: 3, team_name: 'Team Beta',
            status: 'Active',
            bank_last4: '7788',
            beneficiary_name: 'Alice Wong',
            net_earning: 12450.80,
            on_hold_amount: 3200.00,
            total_paid: 9250.80,
            t1: 2100.00, t2: 1850.00, t3: 1700.00, t4: 1500.80, t5: 2100.00, t6: 0,
            t7: 0, t8: 0, t9: 0, t10: 0, t11: 0, t12: 0,
        },
        {
            id: 'def456ghi789jkl012mn04',
            profile_name: 'Shop TikTok US 04',
            profile_code: 'TT-US-004',
            seller_id: '7496282814211197306',
            team_id: 3, team_name: 'Team Beta',
            status: 'Inactive',
            bank_last4: '9012',
            beneficiary_name: 'Bob Lee',
            net_earning: 3120.00,
            on_hold_amount: 0,
            total_paid: 3120.00,
            t1: 520.00, t2: 800.00, t3: 600.00, t4: 1200.00, t5: 0, t6: 0,
            t7: 0, t8: 0, t9: 0, t10: 0, t11: 0, t12: 0,
        },
        {
            id: 'efg567hij890klm123no05',
            profile_name: 'Shop TikTok UK 01',
            profile_code: 'TT-UK-001',
            seller_id: '7496282814211197307',
            team_id: 4, team_name: 'Team Gamma',
            status: 'Active',
            bank_last4: '5566',
            beneficiary_name: 'Charlie Brown',
            net_earning: 5430.10,
            on_hold_amount: 1820.00,
            total_paid: 3610.10,
            t1: 700.00, t2: 650.00, t3: 820.10, t4: 540.00, t5: 900.00, t6: 0,
            t7: 0, t8: 0, t9: 0, t10: 0, t11: 0, t12: 0,
        },
        {
            id: 'fgh678ijk901lmn234op06',
            profile_name: 'Shop TikTok UK 02',
            profile_code: 'TT-UK-002',
            seller_id: '7496282814211197308',
            team_id: 4, team_name: 'Team Gamma',
            status: 'Pending',
            bank_last4: '2244',
            beneficiary_name: 'Diana Prince',
            net_earning: 2890.00,
            on_hold_amount: 2890.00,
            total_paid: 0,
            t1: 0, t2: 0, t3: 0, t4: 0, t5: 0, t6: 0,
            t7: 0, t8: 0, t9: 0, t10: 0, t11: 0, t12: 0,
        },
        {
            id: 'ghi789jkl012mno345pq07',
            profile_name: 'Shop TikTok US 05',
            profile_code: 'TT-US-005',
            seller_id: '7496282814211197309',
            team_id: 2, team_name: 'Team Alpha',
            status: 'Active',
            bank_last4: '6677',
            beneficiary_name: 'Eve Adams',
            net_earning: 4280.00,
            on_hold_amount: 910.00,
            total_paid: 3370.00,
            t1: 600.00, t2: 580.00, t3: 720.00, t4: 470.00, t5: 1000.00, t6: 0,
            t7: 0, t8: 0, t9: 0, t10: 0, t11: 0, t12: 0,
        },
        {
            id: 'hij890klm123nop456qr08',
            profile_name: 'Shop TikTok DE 01',
            profile_code: 'TT-DE-001',
            seller_id: '7496282814211197310',
            team_id: 5, team_name: 'Team Delta',
            status: 'Active',
            bank_last4: '8899',
            beneficiary_name: 'Frank Miller',
            net_earning: 2200.00,
            on_hold_amount: 300.00,
            total_paid: 1900.00,
            t1: 400.00, t2: 350.00, t3: 380.00, t4: 320.00, t5: 450.00, t6: 0,
            t7: 0, t8: 0, t9: 0, t10: 0, t11: 0, t12: 0,
        },
    ];
}
