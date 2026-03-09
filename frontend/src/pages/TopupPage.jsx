import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Trash2, Pencil, X, Filter, Image as ImageIcon, ArrowDownCircle, ArrowUpCircle, DollarSign, Hash, Upload, Building2, ShoppingBag } from 'lucide-react';
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
    { value: 'other', label: 'Other' },
];

const CURRENCIES = [
    { value: 'USD', symbol: '$' },
    { value: 'VND', symbol: '₫' },
    { value: 'EUR', symbol: '€' },
    { value: 'CNY', symbol: '¥' },
];

const TYPES = [
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'topup_factory', label: 'Factory Top up' },
    { value: 'company_expense', label: 'Company Expense' },
];



const STATUSES = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
];

function formatMoney(value) {
    if (value == null || Number(value) === 0) return '—';
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatusBadge({ status }) {
    if (!status) return <span className="status-badge pending">Unknown</span>;
    const s = status.toLowerCase();
    let cls = 'pending';
    if (s === 'completed') cls = 'active';
    else if (s === 'rejected') cls = 'inactive';
    return <span className={`status-badge ${cls}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

const TYPE_STYLES = {
    income: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', icon: '↓', label: 'Income' },
    expense: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', icon: '↑', label: 'Expense' },
    topup_factory: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', icon: '', label: 'Factory Top up' },
    company_expense: { bg: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', icon: '', label: 'Company Expense' },
};

function TypeBadge({ type }) {
    if (!type) return null;
    const style = TYPE_STYLES[type.toLowerCase()] || TYPE_STYLES.expense;
    return (
        <span style={{
            padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
            background: style.bg,
            color: style.color,
            display: 'inline-flex', alignItems: 'center', gap: '4px',
        }}>
            {style.icon} {style.label}
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

/* ── Confirm Modal ── */
function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '12px', width: '420px', maxWidth: '95vw',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideInUp 0.25s ease-out',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
                </div>
                <div style={{ padding: '20px 24px' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>{message}</p>
                </div>
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button className="btn btn-ghost" onClick={onClose} style={{ padding: '8px 16px' }}>Cancel</button>
                    <button className="btn btn-primary" onClick={onConfirm} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none' }}>Delete</button>
                </div>
            </div>
        </div>
    );
}

/* ── Modal Form ── */
function TransactionModal({ isOpen, onClose, onSubmit, formData, onChange, title, submitLabel, teams = [], vendors = [], companies = [] }) {
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
                            <select className="filter-select" name="payment_method" value={formData.payment_method === 'other' || !PAYMENT_METHODS.find(p => p.value === formData.payment_method) ? 'other' : formData.payment_method} onChange={(e) => {
                                if (e.target.value !== 'other') {
                                    onChange(e);
                                } else {
                                    onChange({ target: { name: 'payment_method', value: '' } });
                                }
                            }} style={{ width: '100%' }}>
                                {PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                            {(!PAYMENT_METHODS.find(p => p.value === formData.payment_method) || formData.payment_method === 'other') && (
                                <input
                                    className="filter-input"
                                    name="payment_method"
                                    placeholder="Enter bank name..."
                                    value={formData.payment_method === 'other' ? '' : formData.payment_method}
                                    onChange={onChange}
                                    style={{ width: '100%', marginTop: '8px' }}
                                    autoFocus
                                />
                            )}
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
                            <label className="modal-label">Vendor</label>
                            <select className="filter-select" name="vendor_id" value={formData.vendor_id || ''} onChange={onChange} style={{ width: '100%' }}>
                                <option value="">Select Vendor...</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="modal-label">Transaction ID</label>
                        <input className="filter-input" name="transaction_id" placeholder="VD: tr042026..." value={formData.transaction_id} onChange={onChange} style={{ width: '100%' }} />
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
                        <label className="modal-label">Note</label>
                        <input className="filter-input" name="note" placeholder="Note..." value={formData.note} onChange={onChange} style={{ width: '100%' }} />
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
    const totalIncome = summary?.total_income ?? 0;
    const totalExpense = summary?.total_expense ?? 0;
    const totalVendor = summary?.total_vendor ?? 0;
    const totalCompany = summary?.total_company ?? 0;
    const net = totalIncome - totalExpense;

    const netVendorCompany = totalVendor - totalCompany;

    const cards = [
        { label: 'Total Income', value: totalIncome, icon: ArrowDownCircle, color: 'green', sub: 'All filtered income' },
        { label: 'Total Expense', value: totalExpense, icon: ArrowUpCircle, color: 'amber', sub: 'All filtered expense' },
        { label: 'Net (Income - Expense)', value: net, icon: DollarSign, color: 'cyan', sub: 'Income - Expense' },
        { label: 'Total Vendor', value: totalVendor, icon: ShoppingBag, color: 'purple', sub: 'Vendor transactions' },
        { label: 'Total Company', value: totalCompany, icon: Building2, color: 'blue', sub: 'Company transactions' },
        { label: 'Net (Vendor - Company)', value: netVendorCompany, icon: DollarSign, color: 'indigo', sub: 'Vendor - Company' },
    ];

    const fmt = (v) => Number(v * 25000).toLocaleString('vi-VN') + 'đ';

    return (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {cards.map((card) => (
                <div className="stat-card" key={card.label}>
                    <div className="stat-card-header">
                        <div className={`stat-card-icon ${card.color}`}><card.icon size={20} /></div>
                        <span className="stat-card-label">{card.label}</span>
                    </div>
                    <div className="stat-card-value">{card.isMoney === false ? card.value : fmt(card.value)}</div>
                    <div className="stat-card-sub">{card.sub}</div>
                </div>
            ))}
        </div>
    );
}

/* ── Main Page ── */
export default function TopupPage({ onMenuClick }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState({});
    const [teams, setTeams] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [companies, setCompanies] = useState([]);

    // Fetch teams from DB
    useEffect(() => {
        fetch(`${API_BASE}/api/teams`)
            .then(res => res.json())
            .then(json => { if (json.success) setTeams(json.data); })
            .catch(() => { });

        fetch(`${API_BASE}/api/vendors`)
            .then(res => res.json())
            .then(json => { if (json.success) setVendors(json.data); })
            .catch(() => { });

        fetch(`${API_BASE}/api/companies`)
            .then(res => res.json())
            .then(json => { if (json.success) setCompanies(json.data); })
            .catch(() => { });
    }, []);

    const [searchParams, setSearchParams] = useSearchParams();
    const updateParam = useCallback((key, value) => {
        setSearchParams(prev => {
            if (value) prev.set(key, String(value));
            else prev.delete(key);
            return prev;
        }, { replace: true });
    }, [setSearchParams]);

    const typeFilter = searchParams.get('type') || '';
    const setTypeFilter = (v) => updateParam('type', v);

    const teamFilter = searchParams.get('team_id') || '';
    const setTeamFilter = (v) => updateParam('team_id', v);

    const yearFilter = searchParams.has('year') ? Number(searchParams.get('year')) : new Date().getFullYear();
    const setYearFilter = (v) => updateParam('year', v);

    const paymentMethodFilter = searchParams.get('payment_method') || '';
    const setPaymentMethodFilter = (v) => updateParam('payment_method', v);

    const statusFilter = searchParams.get('status') || '';
    const setStatusFilter = (v) => updateParam('status', v);

    const page = Number(searchParams.get('page')) || 1;
    const setPage = (v) => updateParam('page', v);

    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        transaction_id: '', type: 'income', team_id: '', payment_method: 'pingpong',
        amount: '', currency: 'USD', status: 'pending', image: '', vendor_id: '', note: ''
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [notePreview, setNotePreview] = useState(null);

    // Confirm Modal state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

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

    const resetForm = () => setFormData({ transaction_id: '', type: 'income', team_id: '', payment_method: 'pingpong', vendor_id: '', amount: '', currency: 'USD', status: 'pending', image: '', note: '' });

    const openCreateModal = () => { setModalMode('create'); resetForm(); setModalOpen(true); };
    const openEditModal = (row) => {
        setModalMode('edit');
        setEditingId(row.id);
        setFormData({
            transaction_id: row.transaction_id || '', type: row.type || 'income', team_id: row.team_id || '',
            payment_method: row.payment_method || 'pingpong', vendor_id: row.vendor_id || '',
            amount: row.amount || '', currency: row.currency || 'USD', status: row.status || 'pending', image: row.image || '',
            note: row.note || '',
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

    const confirmDelete = (id) => {
        setDeletingId(id);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/transactions/${deletingId}`, { method: 'DELETE', headers: { 'Accept': 'application/json' } });
            const json = await res.json();
            if (json.success) { addToast('Transaction deleted!'); fetchData(); }
            else addToast(json.message || 'Delete failed!', 'error');
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        } finally {
            setConfirmOpen(false);
            setDeletingId(null);
        }
    };

    const columns = useMemo(() => [
        {
            key: 'index', label: '#', width: '3%',
            render: (_, idx) => <span style={{ color: 'var(--text-muted)' }}>{(pagination.current_page - 1) * pagination.per_page + idx + 1}</span>,
        },
        {
            key: 'team_name', label: 'Team', width: '7%',
            render: (row) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.team_name || '—'}</span>,
        },
        {
            key: 'payment_method', label: 'Bank', width: '8%',
            render: (row) => <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{(PAYMENT_METHODS.find(p => p.value === row.payment_method) || {}).label || row.payment_method}</span>,
        },
        {
            key: 'vendor_name', label: 'Vendor', width: '7%',
            render: (row) => <span style={{ fontWeight: 600 }}>{row.vendor_name || '—'}</span>,
        },
        {
            key: 'type', label: 'Type', width: '8%',
            render: (row) => <TypeBadge type={row.type} />,
        },
        {
            key: 'transaction_id', label: 'Transaction ID', width: '11%',
            render: (row) => <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{row.transaction_id || '—'}</span>,
        },
        {
            key: 'amount', label: 'Amount', className: 'text-right', width: '11%',
            render: (row) => (
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: row.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                    {formatMoney(row.amount)}
                </span>
            ),
        },
        {
            key: 'currency', label: 'Currency', width: '5%', style: { textAlign: 'center' }, tdStyle: { textAlign: 'center' },
            render: (row) => <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{row.currency || 'USD'}</span>,
        },
        {
            key: 'status', label: 'Status', width: '9%',
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'note', label: 'Note', width: '10%',
            render: (row) => row.note
                ? <span onClick={() => setNotePreview(row.note)} style={{ fontSize: '12px', color: 'var(--primary-light)', display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>{row.note}</span>
                : <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>,
        },
        {
            key: 'image', label: 'Image', width: '5%', style: { textAlign: 'center' }, tdStyle: { textAlign: 'center' },
            render: (row) => row.image
                ? <img src={row.image} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--border-color)' }} onClick={() => setPreviewImage(row.image)} />
                : <span style={{ color: 'var(--text-muted)' }}>—</span>,
        },
        {
            key: 'created_at', label: 'Time', width: '10%',
            render: (row) => <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(row.created_at).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>,
        },
        {
            key: 'action', label: 'Action', width: '6%', style: { textAlign: 'center' }, tdStyle: { textAlign: 'center' },
            render: (row) => (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={() => openEditModal(row)} title="Edit"><Pencil size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: '6px 8px', color: 'var(--danger)' }} onClick={() => confirmDelete(row.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
            ),
        },
    ], [pagination, data]);

    // Footer totals row
    const footerRow = useMemo(() => {
        if (!summary || !data.length) return null;
        const pageIncome = Number(summary.page_income ?? 0);
        const pageExpense = Number(summary.page_expense ?? 0);
        const pageVendor = Number(summary.page_vendor ?? 0);
        const pageCompany = Number(summary.page_company ?? 0);
        const pageNet = pageIncome - pageExpense;
        const fmtVND = (v) => Number(v * 25000).toLocaleString('vi-VN') + 'đ';
        return (
            <tr>
                <td colSpan={13}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '2px 0' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
                            TOTAL: {summary.total_transactions ?? 0} transactions
                        </span>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Income: </span>
                                <span style={{ color: 'var(--success)' }}>{fmtVND(pageIncome)}</span>
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Expense: </span>
                                <span style={{ color: 'var(--danger)' }}>{fmtVND(pageExpense)}</span>
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Vendor: </span>
                                <span style={{ color: '#a855f7' }}>{fmtVND(pageVendor)}</span>
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Company: </span>
                                <span style={{ color: '#6366f1' }}>{fmtVND(pageCompany)}</span>
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 800, borderLeft: '2px solid var(--border-color)', paddingLeft: '16px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Net: </span>
                                <span style={{ color: pageNet >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmtVND(pageNet)}</span>
                            </span>
                        </div>
                    </div>
                </td>
            </tr>
        );
    }, [summary, data]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') fetchData();
    };

    return (
        <>
            <Topbar title="Topup History" breadcrumb="Topup" onRefresh={fetchData} loading={loading} onMenuClick={onMenuClick} />

            <div className="page-content">
                {/* Stats Cards */}
                <TopupStatsCards summary={summary} />

                {/* Filters — same structure as ProfilesPage */}
                <div className="filters-bar">
                    <div className="filter-group">
                        <Search size={15} style={{ color: 'var(--text-muted)' }} />
                        <input
                            id="search-input"
                            className="filter-input"
                            placeholder="Search transaction ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>

                    <div className="filter-group">
                        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                        <select className="filter-select year-select" value={yearFilter} onChange={(e) => {
                            const v = e.target.value;
                            setSearchParams(prev => {
                                if (v) prev.set('year', String(v)); else prev.delete('year');
                                prev.delete('page');
                                return prev;
                            }, { replace: true });
                        }}>
                            <option value="">Year</option>
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select className="filter-select" value={teamFilter} onChange={(e) => {
                            const v = e.target.value;
                            setSearchParams(prev => {
                                if (v) prev.set('team_id', v); else prev.delete('team_id');
                                prev.delete('page');
                                return prev;
                            }, { replace: true });
                        }}>
                            <option value="">All Teams</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select className="filter-select" value={typeFilter} onChange={(e) => {
                            const v = e.target.value;
                            setSearchParams(prev => {
                                if (v) prev.set('type', v); else prev.delete('type');
                                prev.delete('page');
                                return prev;
                            }, { replace: true });
                        }}>
                            <option value="">All Types</option>
                            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select className="filter-select" value={paymentMethodFilter} onChange={(e) => {
                            const v = e.target.value;
                            setSearchParams(prev => {
                                if (v) prev.set('payment_method', v); else prev.delete('payment_method');
                                prev.delete('page');
                                return prev;
                            }, { replace: true });
                        }}>
                            <option value="">All Banks</option>
                            {PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select className="filter-select" value={statusFilter} onChange={(e) => {
                            const v = e.target.value;
                            setSearchParams(prev => {
                                if (v) prev.set('status', v); else prev.delete('status');
                                prev.delete('page');
                                return prev;
                            }, { replace: true });
                        }}>
                            <option value="">All Status</option>
                            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                teams={teams}
                vendors={vendors}
                companies={companies}
                title={modalMode === 'create' ? 'New Transaction' : 'Update Transaction'}
                submitLabel={modalMode === 'create' ? 'Create' : 'Update'}
            />

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Confirm Delete"
                message="Are you sure you want to delete this transaction? This action cannot be undone."
            />

            <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} />
            {notePreview && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setNotePreview(null)}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', width: '480px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideInUp 0.25s ease-out' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Note</h3>
                            <button onClick={() => setNotePreview(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '20px 24px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '60vh', overflowY: 'auto' }}>
                            {notePreview}
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
}

