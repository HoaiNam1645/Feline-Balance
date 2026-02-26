import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Trash2, Pencil, X, Filter, Image as ImageIcon, ArrowDownCircle, ArrowUpCircle, DollarSign, Hash, Upload } from 'lucide-react';
import Topbar from '../components/Topbar';
import DataTable from '../components/DataTable';

const API_BASE = import.meta.env.VITE_API_URL || '';

const PAYMENT_METHODS = [
    { value: 'pingpong', label: 'Pingpong' },
    { value: 'paypal', label: 'Paypal' },
    { value: 'lianlian', label: 'Lianlian' },
    { value: 'vietcombank', label: 'Vietcombank' },
    { value: 'techcombank', label: 'Techcombank' },
    { value: 'sacombank', label: 'Sacombank' },
];

const CURRENCIES = [
    { value: 'USD', symbol: '$' },
    { value: 'VND', symbol: '₫' },
    { value: 'EUR', symbol: '€' },
    { value: 'CNY', symbol: '¥' },
];

const TYPES = [
    { value: 'thu', label: 'Thu' },
    { value: 'chi', label: 'Chi' },
];



const STATUSES = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
];

function formatMoney(value, currency = 'USD') {
    if (value == null || Number(value) === 0) return '—';
    const cur = CURRENCIES.find(c => c.value === currency) || CURRENCIES[0];
    return `${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${cur.symbol}`;
}

function StatusBadge({ status }) {
    if (!status) return <span className="status-badge pending">Unknown</span>;
    const s = status.toLowerCase();
    let cls = 'pending';
    if (s === 'completed') cls = 'active';
    else if (s === 'rejected') cls = 'inactive';
    return <span className={`status-badge ${cls}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function TypeBadge({ type }) {
    if (!type) return null;
    const isThu = type.toLowerCase() === 'thu';
    return (
        <span style={{
            padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
            background: isThu ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: isThu ? '#10b981' : '#ef4444',
            display: 'inline-flex', alignItems: 'center', gap: '4px',
        }}>
            {isThu ? '↓ Thu' : '↑ Chi'}
        </span>
    );
}

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

/* ── Modal Form ── */
function TransactionModal({ isOpen, onClose, onSubmit, formData, onChange, title, submitLabel, teams = [] }) {
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('image', file);

        try {
            const res = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: data,
                headers: { 'Accept': 'application/json' }
            });
            const json = await res.json();
            if (json.success && json.data?.url) {
                // mock event to update formData.image in parent
                onChange({ target: { name: 'image', value: json.data.url } });
            } else {
                alert(json.message || 'Upload failed!');
            }
        } catch (err) {
            alert('Upload error: ' + err.message);
        } finally {
            setUploading(false);
            e.target.value = null; // reset input
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '12px', width: '520px', maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideInUp 0.25s ease-out',
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}><X size={18} /></button>
                </div>
                {/* Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label className="modal-label">Transaction Type</label>
                            <select className="filter-select" name="type" value={formData.type} onChange={onChange} style={{ width: '100%' }}>
                                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="modal-label">Payment Method</label>
                            <select className="filter-select" name="payment_method" value={formData.payment_method} onChange={onChange} style={{ width: '100%' }}>
                                {PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label className="modal-label">Team</label>
                            <select className="filter-select" name="team_id" value={formData.team_id} onChange={onChange} style={{ width: '100%' }}>
                                <option value="">Select Team...</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="modal-label">Transaction ID</label>
                            <input className="filter-input" name="transaction_id" placeholder="VD: tr042026..." value={formData.transaction_id} onChange={onChange} style={{ width: '100%' }} />
                        </div>
                    </div>
                    <div>
                        <label className="modal-label">Amount</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input className="filter-input" type="number" step="0.01" name="amount" placeholder="2,000.00" value={formData.amount} onChange={onChange} style={{ flex: 1, textAlign: 'right', minWidth: '100px' }} />
                            <select className="filter-select" name="currency" value={formData.currency} onChange={onChange} style={{ width: '100px', minWidth: '100px', fontWeight: 600 }}>
                                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.symbol} {c.value}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="modal-label">Status</label>
                        <select className="filter-select" name="status" value={formData.status} onChange={onChange} style={{ width: '100%' }}>
                            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="modal-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Image (URL)</span>
                            <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                                <Upload size={14} />
                                {uploading ? 'Uploading...' : 'Upload Image'}
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
                            </label>
                        </label>
                        <input className="filter-input" name="image" placeholder="https://..." value={formData.image} onChange={onChange} style={{ width: '100%' }} />
                        {formData.image && (
                            <div style={{ marginTop: '8px', width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                <img src={formData.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                            </div>
                        )}
                    </div>
                </div>
                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '16px 24px', borderTop: '1px solid var(--border-color)' }}>
                    <button className="btn btn-ghost" onClick={onClose} disabled={uploading}>Cancel</button>
                    <button className="btn btn-primary" onClick={onSubmit} disabled={uploading}>{submitLabel}</button>
                </div>
            </div>
        </div>
    );
}

/* ── Image Preview ── */
function ImagePreview({ src, onClose }) {
    if (!src) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99998,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }} onClick={onClose}>
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
                <img src={src} alt="Transaction" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
                <button onClick={onClose} style={{ position: 'absolute', top: '-14px', right: '-14px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
        </div>
    );
}

/* ── Stats Cards for Topup ── */
function TopupStatsCards({ summary }) {
    const cards = [
        { label: 'Total Transactions', value: summary?.total_transactions ?? 0, icon: Hash, color: 'purple', sub: 'All filtered transactions', isMoney: false },
        { label: 'Total Income', value: summary?.total_thu ?? 0, icon: ArrowDownCircle, color: 'green', sub: 'Total income', isMoney: true },
        { label: 'Total Expense', value: summary?.total_chi ?? 0, icon: ArrowUpCircle, color: 'amber', sub: 'Total expense', isMoney: true },
        { label: 'Net', value: (summary?.total_thu ?? 0) - (summary?.total_chi ?? 0), icon: DollarSign, color: 'cyan', sub: 'Thu - Chi', isMoney: true },
    ];

    const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '$';

    return (
        <div className="stats-grid">
            {cards.map((card) => (
                <div className="stat-card" key={card.label}>
                    <div className="stat-card-header">
                        <div className={`stat-card-icon ${card.color}`}><card.icon size={20} /></div>
                        <span className="stat-card-label">{card.label}</span>
                    </div>
                    <div className="stat-card-value">{card.isMoney ? fmt(card.value) : card.value}</div>
                    <div className="stat-card-sub">{card.sub}</div>
                </div>
            ))}
        </div>
    );
}

/* ── Main Page ── */
export default function TopupPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState({});
    const [teams, setTeams] = useState([]);

    // Fetch teams from DB
    useEffect(() => {
        fetch(`${API_BASE}/api/teams`)
            .then(res => res.json())
            .then(json => { if (json.success) setTeams(json.data); })
            .catch(() => { });
    }, []);

    const [typeFilter, setTypeFilter] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        transaction_id: '', type: 'thu', team_id: '', payment_method: 'pingpong',
        amount: '', currency: 'USD', status: 'pending', image: '',
    });

    const [previewImage, setPreviewImage] = useState(null);

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
            const params = new URLSearchParams({ page, per_page: 15 });
            if (typeFilter) params.append('type', typeFilter);
            if (teamFilter) params.append('team_id', teamFilter);
            if (yearFilter) params.append('year', yearFilter);
            if (paymentMethodFilter) params.append('payment_method', paymentMethodFilter);
            if (statusFilter) params.append('status', statusFilter);
            if (search) params.append('search', search);

            const res = await fetch(`${API_BASE}/api/transactions?${params}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data);
                if (json.pagination) setPagination(json.pagination);
                if (json.summary) setSummary(json.summary);
            } else {
                setError('Failed to load data');
            }
        } catch (err) {
            setError(err.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [typeFilter, teamFilter, yearFilter, paymentMethodFilter, statusFilter, page]);
    useEffect(() => { setPage(1); }, [typeFilter, teamFilter, yearFilter, paymentMethodFilter, statusFilter, search]);

    const resetForm = () => setFormData({ transaction_id: '', type: 'thu', team_id: '', payment_method: 'pingpong', amount: '', currency: 'USD', status: 'pending', image: '' });

    const openCreateModal = () => { setModalMode('create'); resetForm(); setModalOpen(true); };
    const openEditModal = (row) => {
        setModalMode('edit');
        setEditingId(row.id);
        setFormData({
            transaction_id: row.transaction_id || '', type: row.type || 'thu', team_id: row.team_id || '',
            payment_method: row.payment_method || 'pingpong', amount: row.amount || '',
            currency: row.currency || 'USD', status: row.status || 'pending', image: row.image || '',
        });
        setModalOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            const isEdit = modalMode === 'edit';
            const url = isEdit ? `${API_BASE}/api/transactions/${editingId}` : `${API_BASE}/api/transactions`;
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(formData),
            });
            const json = await res.json();
            if (json.success) {
                setModalOpen(false);
                addToast(isEdit ? 'Transaction updated successfully!' : 'Transaction created successfully!');
                fetchData();
            } else {
                addToast(json.message || 'Operation failed!', 'error');
            }
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bạn chắc chắn muốn xóa giao dịch này?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/transactions/${id}`, { method: 'DELETE', headers: { 'Accept': 'application/json' } });
            const json = await res.json();
            if (json.success) { addToast('Transaction deleted!'); fetchData(); }
            else addToast(json.message || 'Delete failed!', 'error');
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        }
    };

    const columns = useMemo(() => [
        {
            key: 'index', label: '#', width: '4%',
            render: (_, idx) => <span style={{ color: 'var(--text-muted)' }}>{(pagination.current_page - 1) * pagination.per_page + idx + 1}</span>,
        },
        {
            key: 'team_name', label: 'Team', width: '9%',
            render: (row) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.team_name || '—'}</span>,
        },
        {
            key: 'payment_method', label: 'Bank', width: '9%',
            render: (row) => <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{(PAYMENT_METHODS.find(p => p.value === row.payment_method) || {}).label || row.payment_method}</span>,
        },
        {
            key: 'type', label: 'Type', width: '7%',
            render: (row) => <TypeBadge type={row.type} />,
        },
        {
            key: 'transaction_id', label: 'Transaction ID', width: '10%',
            render: (row) => <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>{row.transaction_id || '—'}</span>,
        },
        {
            key: 'amount', label: 'Amount', className: 'text-right', width: '8%',
            render: (row) => (
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: row.type === 'thu' ? 'var(--success)' : 'var(--danger)' }}>
                    {formatMoney(row.amount, row.currency)}
                </span>
            ),
        },
        {
            key: 'status', label: 'Status', width: '4%',
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'image', label: 'Img', width: '9%', style: { textAlign: 'center' }, tdStyle: { textAlign: 'center' },
            render: (row) => row.image
                ? <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setPreviewImage(row.image)}><ImageIcon size={16} /></button>
                : <span style={{ color: 'var(--text-muted)' }}>—</span>,
        },
        {
            key: 'created_at', label: 'Time', width: '14%',
            render: (row) => <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(row.created_at).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>,
        },
        {
            key: 'action', label: 'Action', width: '5%', style: { textAlign: 'right' }, tdStyle: { textAlign: 'right' },
            render: (row) => (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={() => openEditModal(row)} title="Edit"><Pencil size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: '6px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
            ),
        },
    ], [pagination, data]);

    // Footer totals row
    const footerRow = useMemo(() => {
        if (!summary || !data.length) return null;
        return (
            <tr>
                <td style={{ fontWeight: 700, whiteSpace: 'nowrap', padding: '14px 16px' }} colSpan={5}>
                    TOTAL: {summary.total_transactions ?? 0} transactions
                </td>
                <td className="text-right" style={{ fontWeight: 700, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                        <span style={{ color: 'var(--success)', fontSize: '13px' }}>Thu: {Number(summary.page_thu ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}$</span>
                        <span style={{ color: 'var(--danger)', fontSize: '13px' }}>Chi: {Number(summary.page_chi ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}$</span>
                    </div>
                </td>
                <td colSpan={4}></td>
            </tr>
        );
    }, [summary, data]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') fetchData();
    };

    return (
        <>
            <Topbar title="Topup History" breadcrumb="Topup" onRefresh={fetchData} loading={loading} />

            <div className="page-content">
                {/* Stats Cards */}
                <TopupStatsCards summary={summary} />

                {/* Filters — same structure as ProfilesPage */}
                <div className="filters-bar">
                    <div className="filter-group">
                        <Search size={15} style={{ color: 'var(--text-muted)' }} />
                        <input
                            className="filter-input"
                            placeholder="Search transaction ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>

                    <div className="filter-group">
                        <select className="filter-select year-select" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={{ width: '80px', minWidth: '80px' }}>
                            <option value="">Year</option>
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select className="filter-select" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} style={{ width: '120px', minWidth: '120px' }}>
                            <option value="">All Teams</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: '100px', minWidth: '100px' }}>
                            <option value="">All Types</option>
                            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select className="filter-select" value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} style={{ width: '110px', minWidth: '110px' }}>
                            <option value="">All Banks</option>
                            {PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '110px', minWidth: '110px' }}>
                            <option value="">All Status</option>
                            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>

                    <div style={{ marginLeft: 'auto' }}>
                        <button className="btn btn-primary" onClick={openCreateModal}>
                            <Plus size={14} /> New Transaction
                        </button>
                    </div>
                </div>

                {/* Table */}
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    error={error}
                    emptyMessage="No transactions found"
                    emptyDescription="Try adjusting your filters or create a new transaction."
                    pagination={pagination}
                    page={page}
                    onPageChange={setPage}
                    footerRow={footerRow}
                    tableId="topup-table"
                />
            </div>

            {/* Modals */}
            <TransactionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                formData={formData}
                onChange={handleFormChange}
                title={modalMode === 'create' ? 'New Transaction' : 'Update Transaction'}
                submitLabel={modalMode === 'create' ? 'Create' : 'Update'}
                teams={teams}
            />

            <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
}
