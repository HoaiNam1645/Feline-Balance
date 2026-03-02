import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Trash2, Pencil, X, Filter, FolderKanban, ShieldCheck, Download, AlertTriangle, AlertCircle, RefreshCw, Upload, FileSpreadsheet, CheckCircle, Save, Database, Key, CheckCircle2, Clock, FileText } from 'lucide-react';
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
    const cls = s === 'active' ? 'active' : 'inactive';
    const display = s === 'active' ? 'Active' : s === 'die' ? 'Die' : status;
    return <span className={`status-badge ${cls}`}>{display}</span>;
}

export default function ProfilesPage({ onMenuClick }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const updateParam = useCallback((key, value) => {
        setSearchParams(prev => {
            if (value) prev.set(key, String(value));
            else prev.delete(key);
            return prev;
        }, { replace: true });
    }, [setSearchParams]);

    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userRole = useMemo(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user'));
            return u?.role || '';
        } catch { return ''; }
    }, []);
    const isSeller = userRole === 'Seller' || userRole === 'seller';


    const year = searchParams.has('year') ? Number(searchParams.get('year')) : new Date().getFullYear();
    const setYear = (v) => updateParam('year', v);

    const teamFilter = searchParams.get('team_id') || '';
    const setTeamFilter = (v) => updateParam('team_id', v);

    const statusFilter = searchParams.get('status') || '';
    const setStatusFilter = (v) => updateParam('status', v);

    const [search, setSearch] = useState('');
    const [teams, setTeams] = useState([]);

    // Inline editing states
    const [editingRowId, setEditingRowId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // Log modal states
    const [logModalProfileId, setLogModalProfileId] = useState(null);
    const [logModalTab, setLogModalTab] = useState('fetch'); // 'fetch' | '2fa'
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logsPage, setLogsPage] = useState(1);
    const [logsTotalPages, setLogsTotalPages] = useState(1);

    // 2FA logs states
    const [twoFaLogs, setTwoFaLogs] = useState([]);
    const [loadingTwoFaLogs, setLoadingTwoFaLogs] = useState(false);
    const [twoFaLogsPage, setTwoFaLogsPage] = useState(1);
    const [twoFaLogsTotalPages, setTwoFaLogsTotalPages] = useState(1);
    const [twoFaSort, setTwoFaSort] = useState('desc');
    const [twoFaRole, setTwoFaRole] = useState('');
    const [twoFaStatus, setTwoFaStatus] = useState('');

    // Import CSV states
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    // 2FA state
    const [faModalOpen, setFaModalOpen] = useState(false);
    const [faProfileName, setFaProfileName] = useState('');
    const [faCodeResult, setFaCodeResult] = useState('');
    const [faLoading, setFaLoading] = useState(false);

    // Fetch logs helper
    const openLogsModal = async (profileId, pageNum = 1) => {
        // Clear 2FA logs state when opening a new profile
        setTwoFaLogs([]);
        setTwoFaLogsPage(1);
        setTwoFaLogsTotalPages(1);
        setTwoFaSort('desc');
        setTwoFaRole('');
        setTwoFaStatus('');

        setLogModalProfileId(profileId);
        if (isSeller) {
            setLogModalTab('2fa');
            fetchTwoFaLogs(1, {}, profileId);
        } else {
            setLogModalTab('fetch');
            setLoadingLogs(true);
            setLogsPage(pageNum);
            try {
                const res = await fetch(`${API_BASE}/api/profiles/${profileId}/logs?page=${pageNum}`);
                const json = await res.json();
                if (json.success) {
                    setLogs(json.data.data);
                    setLogsTotalPages(json.data.last_page);
                } else {
                    addToast('Failed to fetch logs', 'error');
                }
            } catch (err) {
                addToast('Error fetching logs', 'error');
            } finally {
                setLoadingLogs(false);
            }
        }
    };

    // Fetch 2FA logs helper — filtered by profile
    const fetchTwoFaLogs = async (pageNum = 1, filters = {}, pId = null) => {
        const targetId = pId || logModalProfileId;
        if (!targetId) return;
        setLoadingTwoFaLogs(true);
        setTwoFaLogsPage(pageNum);

        const sortParam = filters.sort !== undefined ? filters.sort : twoFaSort;
        const roleParam = filters.role !== undefined ? filters.role : twoFaRole;
        const statusParam = filters.status !== undefined ? filters.status : twoFaStatus;

        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                page: pageNum,
                per_page: 20,
                sort: sortParam,
                ...(roleParam && { user_role: roleParam }),
                ...(statusParam && { status: statusParam }),
            }).toString();

            const res = await fetch(`${API_BASE}/api/profiles/${targetId}/2fa-logs?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setTwoFaLogs(json.data);
                setTwoFaLogsTotalPages(json.pagination?.last_page || 1);
            }
        } catch (err) {
            addToast('Error fetching 2FA logs', 'error');
        } finally {
            setLoadingTwoFaLogs(false);
        }
    };

    // Fetch teams and roles from DB
    const [roles, setRoles] = useState([]);
    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        fetch(`${API_BASE}/api/teams`, { headers })
            .then(res => res.json())
            .then(json => { if (json.success) setTeams(json.data); })
            .catch(() => { });

        fetch(`${API_BASE}/api/roles`, { headers })
            .then(res => res.json())
            .then(json => { if (json.success) setRoles(json.data); })
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
    const page = Number(searchParams.get('page')) || 1;
    const setPage = (v) => updateParam('page', v);
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

    const handleImportSellerCsv = async () => {
        if (!importFile) return;
        setImporting(true);
        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/profiles/import-seller-csv`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setImportResult(data.data);
                addToast(data.message, 'success');
                fetchData();
            } else {
                addToast(data.message || 'Import failed', 'error');
            }
        } catch (err) {
            addToast(err.message || 'Import failed', 'error');
        } finally {
            setImporting(false);
        }
    };

    const handleGet2FA = async (id, profileName) => {
        setFaProfileName(profileName);
        setFaModalOpen(true);
        setFaCodeResult('');
        setFaLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/profiles/${id}/2fa-code`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setFaCodeResult(json.data.code);
            } else {
                setFaCodeResult('Error: ' + json.message);
            }
        } catch (err) {
            setFaCodeResult('Error: ' + err.message);
        } finally {
            setFaLoading(false);
        }
    };

    const handleEditClick = (row) => {
        setEditingRowId(row.id);
        setEditFormData({
            team_id: row.team_id || '',
            profile_name: row.profile_name || '',
            profile_code: row.profile_code || '',
            status: row.status || '',
            bank_last4: row.bank_last4 || '',
            bank_full: row.bank_full || '',
            fa_code: row.fa_code || '',
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

    const canSee2FA = useMemo(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                return ['admin', 'super_admin'].includes(user.role);
            }
        } catch (e) { }
        return false;
    }, []);



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
            <Topbar onRefresh={fetchData} loading={loading} onMenuClick={onMenuClick} />
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
                            {statuses.map((s) => {
                                const lowerS = s ? s.toString().toLowerCase() : '';
                                const label = lowerS === 'active' ? 'Active' : lowerS === 'die' ? 'Die' : s;
                                return <option key={s} value={s}>{label}</option>;
                            })}
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

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost" onClick={() => { setImportResult(null); setImportFile(null); setImportModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Upload size={14} /> Import Seller
                        </button>
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
                                        <th>Seller</th>
                                        <th>Bank</th>
                                        {!isSeller && <th>Bank Full</th>}
                                        {canSee2FA && <th>2FA Code</th>}
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
                                                            <span className="profile-name">
                                                                {row.profile_name || row.id}
                                                            </span>
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
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleEditClick(row)}>Edit</button>
                                                            <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--accent-light)' }} onClick={() => openLogsModal(row.id)} title="View fetch logs"><FileText size={12} /> Logs</button>
                                                            {row.has_2fa && (
                                                                <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px', color: '#10b981' }} onClick={() => handleGet2FA(row.id, row.profile_name || row.id)} title="Get 2FA Code"><Key size={12} /> 2FA</button>
                                                            )}
                                                        </div>
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
                                                            <option value="active">Active</option>
                                                            <option value="die">Die</option>
                                                        </select>
                                                    ) : (
                                                        <StatusBadge status={row.status} />
                                                    )}
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.seller_name || '—'}</span>
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
                                                {!isSeller && (
                                                    <td>
                                                        {isEditing ? (
                                                            <input
                                                                className="filter-input"
                                                                style={{ width: '120px', padding: '4px 8px' }}
                                                                name="bank_full"
                                                                value={editFormData.bank_full}
                                                                onChange={handleEditFormChange}
                                                                placeholder="e.g. 123456789"
                                                            />
                                                        ) : (
                                                            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{row.bank_full || '—'}</span>
                                                        )}
                                                    </td>
                                                )}
                                                {canSee2FA && (
                                                    <td>
                                                        {isEditing ? (
                                                            <input
                                                                className="filter-input"
                                                                style={{ width: '100px', padding: '4px 8px' }}
                                                                name="fa_code"
                                                                value={editFormData.fa_code}
                                                                onChange={handleEditFormChange}
                                                            />
                                                        ) : (
                                                            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--accent-light)' }}>{row.fa_code || '—'}</span>
                                                        )}
                                                    </td>
                                                )}
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
                                        <td></td>
                                        <td></td>
                                        {canSee2FA && <td></td>}
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

            {/* Import CSV Modal */}
            {importModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setImportModalOpen(false)}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', width: '600px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideInUp 0.25s ease-out' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Import Seller Bank & Name</h3>
                            <button onClick={() => setImportModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}><X size={18} /></button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            {!importResult ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed var(--primary)', borderRadius: '8px', textAlign: 'center' }}>
                                        <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setImportFile(e.target.files[0])} style={{ display: 'none' }} id="import-csv-file" />
                                        <label htmlFor="import-csv-file" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <Upload size={32} style={{ color: 'var(--primary)' }} />
                                            {importFile ? (
                                                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{importFile.name}</div>
                                            ) : (
                                                <div style={{ color: 'var(--text-secondary)' }}>Click to upload CSV or XLSX file<br /><span style={{ fontSize: '12px' }}>Columns: SellerName, AccountNo, Store, Status, 2FACode</span></div>
                                            )}
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                                        <button className="btn btn-ghost" onClick={() => setImportModalOpen(false)}>Cancel</button>
                                        <button className="btn btn-primary" onClick={handleImportSellerCsv} disabled={!importFile || importing}>
                                            {importing ? 'Importing...' : 'Import Data'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Summary */}
                                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 0 }}>
                                        <div className="stat-card">
                                            <div className="stat-card-header">
                                                <span className="stat-card-label">Matched</span>
                                                <div className="stat-card-icon green">
                                                    <CheckCircle size={18} />
                                                </div>
                                            </div>
                                            <div className="stat-card-value" style={{ color: 'var(--success)' }}>
                                                {importResult.matched}
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-card-header">
                                                <span className="stat-card-label">Not Matched</span>
                                                <div className="stat-card-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                                                    <X size={18} />
                                                </div>
                                            </div>
                                            <div className="stat-card-value" style={{ color: 'var(--danger)' }}>
                                                {importResult.not_matched}
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-card-header">
                                                <span className="stat-card-label">Bank Changed</span>
                                                <div className="stat-card-icon amber">
                                                    <AlertTriangle size={18} />
                                                </div>
                                            </div>
                                            <div className="stat-card-value" style={{ color: 'var(--warning)' }}>
                                                {importResult.bank_changed}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Changes List */}
                                    {importResult.bank_change_alerts && importResult.bank_change_alerts.length > 0 && (
                                        <div className="table-container" style={{ boxShadow: 'none' }}>
                                            <div style={{ padding: '12px 16px', background: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                <AlertTriangle size={16} /> Data Updates & Bank Changes
                                            </div>
                                            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                                <table className="data-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Profile / Store</th>
                                                            <th>Old Bank</th>
                                                            <th>New AccountNo</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {importResult.bank_change_alerts.map((alert, i) => (
                                                            <tr key={i}>
                                                                <td style={{ color: 'var(--text-primary)' }}>{alert.profile_name}</td>
                                                                <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>•••• {alert.old_bank || '—'}</td>
                                                                <td style={{ fontFamily: 'monospace', color: 'var(--warning)', fontWeight: 600 }}>{alert.full_account}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Not Matched */}
                                    {importResult.not_matched > 0 && (
                                        <div className="table-container" style={{ boxShadow: 'none' }}>
                                            <div style={{ padding: '12px 16px', background: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                <AlertTriangle size={16} /> Unmatched Rows
                                            </div>
                                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                <table className="data-table">
                                                    <tbody>
                                                        {importResult.results.filter(r => r.status === 'not_matched').map((row, i) => (
                                                            <tr key={i}>
                                                                <td style={{ width: '40%', color: 'var(--text-primary)' }}>{row.store}</td>
                                                                <td style={{ color: 'var(--text-muted)' }}>{row.reason}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

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

            {/* Logs Modal (with tabs: Fetch Logs + 2FA Logs) */}
            {logModalProfileId && (
                <div className="modal-overlay" onClick={() => setLogModalProfileId(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', width: '90%' }}>
                        <div className="modal-header">
                            <h2>Logs</h2>
                            <button className="btn btn-ghost" onClick={() => setLogModalProfileId(null)}><X size={18} /></button>
                        </div>

                        {/* Tab bar */}
                        <div style={{ display: 'flex', gap: 2, padding: '0 20px 0', borderBottom: '1px solid var(--border-color)' }}>
                            {!isSeller && (
                                <button
                                    onClick={() => { setLogModalTab('fetch'); if (logs.length === 0) openLogsModal(logModalProfileId, 1); }}
                                    style={{
                                        padding: '10px 16px', fontSize: 13, fontWeight: logModalTab === 'fetch' ? 700 : 500,
                                        color: logModalTab === 'fetch' ? 'var(--primary)' : 'var(--text-secondary)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        borderBottom: logModalTab === 'fetch' ? '2px solid var(--primary)' : '2px solid transparent',
                                        display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1,
                                    }}
                                >
                                    <FileText size={14} /> Fetch Logs
                                </button>
                            )}
                            <button
                                onClick={() => { setLogModalTab('2fa'); fetchTwoFaLogs(1); }}
                                style={{
                                    padding: '10px 16px', fontSize: 13, fontWeight: logModalTab === '2fa' ? 700 : 500,
                                    color: logModalTab === '2fa' ? 'var(--primary)' : 'var(--text-secondary)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    borderBottom: logModalTab === '2fa' ? '2px solid var(--primary)' : '2px solid transparent',
                                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1,
                                }}
                            >
                                <ShieldCheck size={14} /> 2FA Logs
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* ── Fetch Logs Tab ── */}
                            {logModalTab === 'fetch' && (
                                <>
                                    {loadingLogs ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>Loading logs...</div>
                                    ) : logs.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No fetch logs found for this profile.</div>
                                    ) : (
                                        <div>
                                            <div className="table-scroll" style={{ maxHeight: 'calc(85vh - 240px)', margin: '-20px -24px', padding: '0' }}>
                                                <table className="data-table" style={{ width: '100%' }}>
                                                    <thead>
                                                        <tr>
                                                            <th className="sticky-col" style={{ left: 0, minWidth: '160px', zIndex: 10 }}>Time</th>
                                                            <th style={{ minWidth: '100px' }}>Status</th>
                                                            <th style={{ minWidth: '100px' }}>Duration</th>
                                                            <th style={{ minWidth: '300px' }}>Error Message</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {logs.map(log => (
                                                            <tr key={log.id}>
                                                                <td className="sticky-col" style={{ left: 0, background: 'var(--bg-table-row)' }}>
                                                                    {new Date(log.fetched_at).toLocaleString()}
                                                                </td>
                                                                <td>
                                                                    <span className={`status-badge ${log.status === 'success' ? 'active' : 'inactive'}`}>
                                                                        {log.status}
                                                                    </span>
                                                                </td>
                                                                <td>{log.duration_ms ? `${log.duration_ms} ms` : '-'}</td>
                                                                <td style={{ color: log.status === 'success' ? 'var(--text-muted)' : 'var(--danger)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                                                    {log.error_message || '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {logsTotalPages > 1 && (
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                                                    <button className="btn btn-ghost" disabled={logsPage <= 1} onClick={() => openLogsModal(logModalProfileId, logsPage - 1)} style={{ padding: '4px 12px' }}>Prev</button>
                                                    <span style={{ padding: '4px 12px', fontSize: '13px', background: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center' }}>{logsPage} / {logsTotalPages}</span>
                                                    <button className="btn btn-ghost" disabled={logsPage >= logsTotalPages} onClick={() => openLogsModal(logModalProfileId, logsPage + 1)} style={{ padding: '4px 12px' }}>Next</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ── 2FA Logs Tab ── */}
                            {logModalTab === '2fa' && (
                                <>
                                    {/* 2FA Filters */}
                                    <div style={{ margin: '-20px -24px 0 -24px', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                                        <select
                                            className="filter-select"
                                            value={twoFaSort}
                                            onChange={e => { setTwoFaSort(e.target.value); fetchTwoFaLogs(1, { sort: e.target.value }); }}
                                            style={{ minWidth: 140, padding: '8px 12px', fontSize: 13 }}
                                        >
                                            <option value="desc">Latest First</option>
                                            <option value="asc">Oldest First</option>
                                        </select>

                                        <select
                                            className="filter-select"
                                            value={twoFaRole}
                                            onChange={e => { setTwoFaRole(e.target.value); fetchTwoFaLogs(1, { role: e.target.value }); }}
                                            style={{ minWidth: 140, padding: '8px 12px', fontSize: 13 }}
                                        >
                                            <option value="">All Roles</option>
                                            {roles.map(r => (
                                                <option key={r.id} value={r.name}>{r.display_name}</option>
                                            ))}
                                        </select>

                                        <select
                                            className="filter-select"
                                            value={twoFaStatus}
                                            onChange={e => { setTwoFaStatus(e.target.value); fetchTwoFaLogs(1, { status: e.target.value }); }}
                                            style={{ minWidth: 140, padding: '8px 12px', fontSize: 13 }}
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="success">Success</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>

                                    {loadingTwoFaLogs ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>Loading 2FA logs...</div>
                                    ) : twoFaLogs.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No 2FA usage logs found.</div>
                                    ) : (
                                        <div>
                                            <div className="table-scroll" style={{ maxHeight: 'calc(85vh - 300px)', margin: '0 -24px -20px -24px', padding: '0' }}>
                                                <table className="data-table" style={{ width: '100%' }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ minWidth: '160px' }}>Time</th>
                                                            <th style={{ minWidth: '120px' }}>User</th>
                                                            <th style={{ minWidth: '100px' }}>Role</th>
                                                            <th style={{ minWidth: '140px' }}>Profile</th>
                                                            <th style={{ minWidth: '80px' }}>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {twoFaLogs.map(log => (
                                                            <tr key={log.id}>
                                                                <td>{new Date(log.created_at).toLocaleString()}</td>
                                                                <td style={{ fontWeight: 600 }}>{log.user_name}</td>
                                                                <td>
                                                                    <span style={{
                                                                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                                                                        background: log.user_role === 'super_admin' ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
                                                                        color: log.user_role === 'super_admin' ? '#ef4444' : '#818cf8',
                                                                    }}>
                                                                        {log.user_role}
                                                                    </span>
                                                                </td>
                                                                <td>{log.profile_name || '-'}</td>
                                                                <td>
                                                                    <span className={`status-badge ${log.success ? 'active' : 'inactive'}`}>
                                                                        {log.success ? 'Success' : 'Failed'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {twoFaLogsTotalPages > 1 && (
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                                                    <button className="btn btn-ghost" disabled={twoFaLogsPage <= 1} onClick={() => fetchTwoFaLogs(twoFaLogsPage - 1)} style={{ padding: '4px 12px' }}>Prev</button>
                                                    <span style={{ padding: '4px 12px', fontSize: '13px', background: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center' }}>{twoFaLogsPage} / {twoFaLogsTotalPages}</span>
                                                    <button className="btn btn-ghost" disabled={twoFaLogsPage >= twoFaLogsTotalPages} onClick={() => fetchTwoFaLogs(twoFaLogsPage + 1)} style={{ padding: '4px 12px' }}>Next</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 2FA Modal */}
            {faModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setFaModalOpen(false)}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', width: '400px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideInUp 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Key size={18} style={{ color: '#10b981' }} />
                                2FA Code
                            </h3>
                            <button onClick={() => setFaModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            {faLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 0' }}>
                                    <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Connecting to authenticator...</div>
                                </div>
                            ) : (
                                <div style={{
                                    background: faCodeResult.startsWith('Error') ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)',
                                    border: faCodeResult.startsWith('Error') ? '1px solid rgba(239, 68, 68, 0.2)' : '1px dashed var(--border-color)',
                                    padding: '24px',
                                    borderRadius: '8px',
                                    marginTop: '8px'
                                }}>
                                    {faCodeResult.startsWith('Error') ? (
                                        <div style={{ color: '#ef4444', fontSize: '14px', wordBreak: 'break-word' }}>
                                            {faCodeResult}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '4px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                            {faCodeResult}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setFaModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
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
            status: 'active',
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
            status: 'active',
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
            status: 'active',
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
            status: 'die',
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
            status: 'active',
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
            status: 'die',
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
            status: 'active',
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
            status: 'active',
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
