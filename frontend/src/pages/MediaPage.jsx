import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Trash2, Pencil, X, Image as ImageIcon, DollarSign, Hash, Upload, Clock, CheckCircle2, Filter, Send, XCircle } from 'lucide-react';
import Topbar from '../components/Topbar';
import DataTable from '../components/DataTable';

const API_BASE = import.meta.env.VITE_API_URL || '';

const BANKS = [
    { value: 'Vietcombank', label: 'Vietcombank' },
    { value: 'Techcombank', label: 'Techcombank' },
    { value: 'Sacombank', label: 'Sacombank' },
    { value: 'Vietinbank', label: 'Vietinbank' },
    { value: 'MB Bank', label: 'MB Bank' },
];

const STATUSES = [
    { value: 'pending', label: 'Pending' },
    { value: 'complete', label: 'Complete' },
    { value: 'rejected', label: 'Rejected' },
];

const EXPENSE_TYPES = [
    { value: 'account', label: 'Accounts' },
    { value: 'blanks', label: 'Blanks' },
    { value: 'pet', label: 'PET' },
    { value: 'proxies', label: 'Proxies' },
    { value: 'funds', label: 'Funds' },
    { value: 'rent', label: 'Rent' },
    { value: 'facilities', label: 'Facilities' },
    { value: 'happy', label: 'Happy' },
    { value: 'others', label: 'Others' }
];

function formatMoney(value) {
    if (value == null || Number(value) === 0) return '—';
    return Number(value).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '₫';
}

function StatusBadge({ status }) {
    if (!status) return <span className="status-badge pending">Unknown</span>;
    const s = status.toLowerCase();
    let cls = 'pending';
    if (s === 'complete') cls = 'active';
    if (s === 'rejected') cls = 'resigned';
    return <span className={`status-badge ${cls}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
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
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', isDanger = true }) {
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
                    <button className="btn btn-primary" onClick={onConfirm} style={{ padding: '8px 16px', background: isDanger ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none' }}>{confirmText}</button>
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
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
        }} onClick={onClose}>
            <img src={src} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px' }} alt="Preview" />
        </div>
    );
}

/* ── Media Form Modal ── */
function MediaFormModal({ isOpen, onClose, onSubmit, formData, onChange, title, submitLabel, teams, uploading, onUpload }) {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '12px', width: '520px', maxWidth: '95vw',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideInUp 0.25s ease-out',
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}><X size={18} /></button>
                </div>
                {/* Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
                    <div>
                        <label className="modal-label">Team / Company *</label>
                        <select className="filter-select" name="team_id" value={formData.team_id} onChange={onChange} style={{ width: '100%' }}>
                            <option value="">— Select Team —</option>
                            <option value="company" style={{ fontWeight: 600 }}>Company (Công ty)</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="modal-label">Expense Type *</label>
                        <select className="filter-select" name="expense_type" value={formData.expense_type} onChange={onChange} style={{ width: '100%' }}>
                            <option value="">— Select Type —</option>
                            {EXPENSE_TYPES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="modal-label">Bank *</label>
                            <select className="filter-select" name="bank" value={formData.bank} onChange={onChange} style={{ width: '100%' }}>
                                <option value="">— Select —</option>
                                {BANKS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="modal-label">Status</label>
                            <select className="filter-select" name="status" value={formData.status} onChange={onChange} style={{ width: '100%' }}>
                                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="modal-label">Transaction Code</label>
                            <input className="filter-input" name="transaction_code" placeholder="VD: TXN-20260226-001" value={formData.transaction_code} onChange={onChange} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label className="modal-label">Note</label>
                            <input className="filter-input" name="note" placeholder="Note..." value={formData.note} onChange={onChange} style={{ width: '100%' }} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="modal-label">Amount (VNĐ)</label>
                            <input className="filter-input" type="number" step="1000" name="amount" placeholder="1,000,000" value={formData.amount} onChange={onChange} style={{ width: '100%', textAlign: 'right' }} />
                        </div>
                        <div>
                            <label className="modal-label">Date / Time</label>
                            <input className="filter-input" type="datetime-local" name="transaction_date" value={formData.transaction_date} onChange={onChange} style={{ width: '100%' }} />
                        </div>
                    </div>
                    <div>
                        <label className="modal-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Transaction Image</span>
                            <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                                <Upload size={14} />
                                {uploading ? 'Uploading...' : 'Upload to B2'}
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onUpload} disabled={uploading} />
                            </label>
                        </label>
                        <input className="filter-input" name="image" placeholder="https://..." value={formData.image} onChange={onChange} style={{ width: '100%' }} />
                        {formData.image && (
                            <div style={{ marginTop: '8px', width: '80px', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
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

/* ── Stats Card ── */
function StatsCards({ summary }) {
    if (!summary) return null;
    return (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '24px' }}>
            <div className="stat-card">
                <div className="stat-card-header">
                    <div className="stat-card-icon blue"><Hash size={20} /></div>
                    <span className="stat-card-label">Total Records</span>
                </div>
                <div className="stat-card-value">{summary.total_count ?? 0}</div>
                <div className="stat-card-sub">Cost Management transactions</div>
            </div>
            <div className="stat-card">
                <div className="stat-card-header">
                    <div className="stat-card-icon green"><DollarSign size={20} /></div>
                    <span className="stat-card-label">Total Amount</span>
                </div>
                <div className="stat-card-value">{formatMoney(summary.total_amount)}</div>
                <div className="stat-card-sub">All filtered</div>
            </div>
            <div className="stat-card">
                <div className="stat-card-header">
                    <div className="stat-card-icon orange"><Clock size={20} /></div>
                    <span className="stat-card-label">Pending</span>
                </div>
                <div className="stat-card-value">{summary.total_pending ?? 0}</div>
                <div className="stat-card-sub">Awaiting completion</div>
            </div>
            <div className="stat-card">
                <div className="stat-card-header">
                    <div className="stat-card-icon purple"><CheckCircle2 size={20} /></div>
                    <span className="stat-card-label">Complete</span>
                </div>
                <div className="stat-card-value">{summary.total_complete ?? 0}</div>
                <div className="stat-card-sub">Completed</div>
            </div>
            <div className="stat-card">
                <div className="stat-card-header">
                    <div className="stat-card-icon red" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}><XCircle size={20} /></div>
                    <span className="stat-card-label">Rejected</span>
                </div>
                <div className="stat-card-value">{summary.total_rejected ?? 0}</div>
                <div className="stat-card-sub">Declined</div>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function MediaPage({ onMenuClick }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [summary, setSummary] = useState(null);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
    const [searchParams, setSearchParams] = useSearchParams();

    const updateParam = useCallback((key, value) => {
        setSearchParams(prev => {
            if (value) prev.set(key, String(value));
            else prev.delete(key);
            return prev;
        }, { replace: true });
    }, [setSearchParams]);

    // Filters
    const page = Number(searchParams.get('page')) || 1;
    const setPage = (v) => updateParam('page', v);

    const [search, setSearch] = useState('');

    const teamFilter = searchParams.get('team_id') || '';
    const setTeamFilter = (v) => updateParam('team_id', v);

    const bankFilter = searchParams.get('bank') || '';
    const setBankFilter = (v) => updateParam('bank', v);

    const statusFilter = searchParams.get('status') || '';
    const setStatusFilter = (v) => updateParam('status', v);

    const expenseTypeFilter = searchParams.get('expense_type') || '';
    const setExpenseTypeFilter = (v) => updateParam('expense_type', v);

    const yearFilter = searchParams.has('year') ? Number(searchParams.get('year')) : ''; // Changed default to '' to match previous useState behavior
    const setYearFilter = (v) => updateParam('year', v);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const now = new Date();
    const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const [formData, setFormData] = useState({
        team_id: '', expense_type: '', image: '', transaction_code: '', bank: 'Vietcombank',
        transaction_date: defaultDate, amount: '', status: 'pending', note: ''
    });

    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || {};
        } catch (e) {
            return {};
        }
    }, []);
    const isSuperAdmin = user?.role === 'super_admin';

    // Confirm modals
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [resendConfirmOpen, setResendConfirmOpen] = useState(false);
    const [resending, setResending] = useState(false);

    // Image preview
    const [previewImg, setPreviewImg] = useState(null);

    // Note preview
    const [notePreview, setNotePreview] = useState(null);

    // Upload
    const [uploading, setUploading] = useState(false);

    // Toasts
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);
    const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    // Fetch teams
    useEffect(() => {
        fetch(`${API_BASE}/api/teams`).then(r => r.json()).then(j => {
            if (j.success) setTeams(j.data);
        }).catch(() => { });
    }, []);

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, per_page: 15 });
            if (search.trim()) params.append('search', search.trim());
            if (teamFilter) params.append('team_id', teamFilter);
            if (expenseTypeFilter) params.append('expense_type', expenseTypeFilter);
            if (bankFilter) params.append('bank', bankFilter);
            if (statusFilter) params.append('status', statusFilter);
            if (yearFilter) params.append('year', yearFilter);

            const res = await fetch(`${API_BASE}/api/media-transactions?${params}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data || []);
                setPagination(json.pagination || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
                setSummary(json.summary || null);
            }
        } catch (err) {
            addToast('Error loading: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [page, search, teamFilter, expenseTypeFilter, bankFilter, statusFilter, yearFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Form
    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const openCreateModal = () => {
        setModalMode('create');
        setEditingId(null);
        const n = new Date();
        setFormData({
            team_id: '', expense_type: '', image: '', transaction_code: '', bank: 'Vietcombank',
            transaction_date: `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}T${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`,
            amount: '', status: 'pending', note: ''
        });
        setModalOpen(true);
    };

    const openEditModal = (row) => {
        setModalMode('edit');
        setEditingId(row.id);
        setFormData({
            team_id: row.team_id === null ? 'company' : (row.team_id || ''),
            expense_type: row.expense_type || '',
            image: row.image || '',
            transaction_code: row.transaction_code || '',
            bank: row.bank || 'Vietcombank',
            transaction_date: row.transaction_date ? row.transaction_date.slice(0, 16) : '',
            amount: row.amount || '',
            status: row.status || 'pending',
            note: row.note || '',
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.team_id) { addToast('Please select a team or company', 'error'); return; }
        if (!formData.expense_type) { addToast('Please select an expense type', 'error'); return; }
        if (!formData.bank) { addToast('Please select a bank', 'error'); return; }

        try {
            const isEdit = modalMode === 'edit';
            const url = isEdit ? `${API_BASE}/api/media-transactions/${editingId}` : `${API_BASE}/api/media-transactions`;

            const fd = new FormData();
            Object.keys(formData).forEach(k => { if (formData[k] !== '') fd.append(k, formData[k]); });

            const res = await fetch(url, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd });
            const json = await res.json();
            if (json.success) {
                addToast(isEdit ? 'Updated successfully!' : 'Created successfully!');
                setModalOpen(false);
                fetchData();
            } else {
                addToast(json.message || 'Operation failed', 'error');
            }
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        }
    };

    // Upload image
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch(`${API_BASE}/api/media-transactions/upload`, { method: 'POST', body: fd });
            const json = await res.json();
            if (json.success) {
                setFormData(prev => ({ ...prev, image: json.data.url }));
                addToast('Image uploaded!');
            } else {
                addToast(json.message || 'Upload failed', 'error');
            }
        } catch (err) {
            addToast('Upload error: ' + err.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    // Delete
    const confirmDelete = (id) => { setDeletingId(id); setConfirmOpen(true); };
    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/media-transactions/${deletingId}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) { addToast('Deleted!'); fetchData(); }
            else addToast(json.message || 'Delete failed', 'error');
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        } finally {
            setConfirmOpen(false);
            setDeletingId(null);
        }
    };

    // Resend Telegram
    const handleResendTelegram = async (type = 'detail') => {
        setResending(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/telegram/resend-pending`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ type })
            });
            const json = await res.json();
            if (json.success) {
                addToast(json.message);
            } else {
                addToast(json.message || 'Resend failed', 'error');
            }
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        } finally {
            setResending(false);
            setResendConfirmOpen(false);
        }
    };

    const handleSearch = (e) => { if (e.key === 'Enter') { fetchData(); } };

    // Columns
    const columns = useMemo(() => [
        {
            key: 'index', label: '#', width: '4%',
            render: (_, idx) => <span style={{ color: 'var(--text-muted)' }}>{(pagination.current_page - 1) * pagination.per_page + idx + 1}</span>,
        },
        {
            key: 'team_name', label: 'Company / Team', width: '12%',
            render: (row) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.team_name || '—'}</span>,
        },
        {
            key: 'expense_type', label: 'Type', width: '10%',
            render: (row) => {
                const opt = EXPENSE_TYPES.find(e => e.value === row.expense_type);
                return <span style={{ color: 'var(--text-secondary)' }}>{opt ? opt.label : (row.expense_type || '—')}</span>;
            },
        },
        {
            key: 'image', label: 'Image', width: '7%', style: { textAlign: 'center' }, tdStyle: { textAlign: 'center' },
            render: (row) => row.image
                ? <img src={row.image} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--border-color)' }} onClick={() => setPreviewImg(row.image)} />
                : <span style={{ color: 'var(--text-muted)' }}>—</span>,
        },
        {
            key: 'transaction_code', label: 'Transaction Code', width: '12%',
            render: (row) => <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{row.transaction_code || '—'}</span>,
        },
        {
            key: 'bank', label: 'Bank', width: '12%',
            render: (row) => {
                const colors = { Vietcombank: '#00843d', Techcombank: '#e4002b', Sacombank: '#0033a0' };
                return (
                    <span style={{
                        padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                        background: `${colors[row.bank] || '#6366f1'} 18`,
                        color: colors[row.bank] || '#6366f1',
                    }}>
                        {row.bank || '—'}
                    </span>
                );
            },
        },
        {
            key: 'transaction_date', label: 'Date/Time', width: '14%',
            render: (row) => (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {row.transaction_date ? new Date(row.transaction_date).toLocaleString('vi-VN', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                    }) : '—'}
                </span>
            ),
        },
        {
            key: 'amount', label: 'Amount', width: '12%', className: 'text-right',
            render: (row) => (
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                    {formatMoney(row.amount)}
                </span>
            ),
        },
        {
            key: 'status', label: 'Status', width: '8%',
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'note', label: 'Note', width: '10%',
            render: (row) => row.note
                ? <span onClick={() => setNotePreview(row.note)} style={{ fontSize: '12px', color: 'var(--primary-light)', display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>{row.note}</span>
                : <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>,
        },
        {
            key: 'actions', label: 'Actions', width: '8%', style: { textAlign: 'right' }, tdStyle: { textAlign: 'right' },
            render: (row) => (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={() => openEditModal(row)} title="Edit"><Pencil size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: '6px 8px', color: 'var(--danger)' }} onClick={() => confirmDelete(row.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
            ),
        },
    ], [pagination]);

    // Footer totals
    const footerRow = useMemo(() => {
        if (!summary || !data.length) return null;
        return (
            <tr>
                <td style={{ fontWeight: 700, whiteSpace: 'nowrap', padding: '14px 16px' }} colSpan={7}>
                    TOTAL: {summary.total_count ?? 0} records
                </td>
                <td className="text-right" style={{ fontWeight: 700, padding: '14px 16px', color: 'var(--text-primary)' }}>
                    {formatMoney(summary.page_amount)}
                </td>
                <td colSpan={3}></td>
            </tr>
        );
    }, [summary, data]);

    return (
        <>
            <Topbar
                section="Finance"
                breadcrumb="Cost Management"
                title="Cost Management"
                onRefresh={fetchData}
                loading={loading}
                onMenuClick={onMenuClick}
            />

            <div className="page-content">
                <StatsCards summary={summary} />

                {/* Filters */}
                <div className="filters-bar">
                    <div className="filter-group">
                        <Search size={15} style={{ color: 'var(--text-muted)' }} />
                        <input
                            className="filter-input"
                            placeholder="Search transaction code..."
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
                                if (v) prev.set('year', v); else prev.delete('year');
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
                            <option value="">All Teams (inc. Company)</option>
                            <option value="company" style={{ fontWeight: 600 }}>Company (Công ty)</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select className="filter-select" value={bankFilter} onChange={(e) => {
                            const v = e.target.value;
                            setSearchParams(prev => {
                                if (v) prev.set('bank', v); else prev.delete('bank');
                                prev.delete('page');
                                return prev;
                            }, { replace: true });
                        }}>
                            <option value="">All Banks</option>
                            {BANKS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
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
                        {isSuperAdmin && (
                            <button
                                className="btn btn-ghost"
                                onClick={() => setResendConfirmOpen(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-light)' }}
                                title="Resend Pending to Telegram"
                            >
                                <Send size={14} /> Resend Pending
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Plus size={14} /> New Record
                        </button>
                    </div>
                </div>

                {/* Table */}
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    emptyMessage="No Cost Management transactions"
                    emptyDescription="Click 'New Record' to add one."
                    pagination={pagination}
                    page={page}
                    onPageChange={setPage}
                    footerRow={footerRow}
                    tableId="media-transactions-table"
                />
            </div>

            {/* Modals */}
            <MediaFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                formData={formData}
                onChange={onChange}
                title={modalMode === 'create' ? 'New Cost Record' : 'Edit Cost Record'}
                submitLabel={modalMode === 'create' ? 'Create' : 'Update'}
                teams={teams}
                uploading={uploading}
                onUpload={handleUpload}
            />

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Confirm Delete"
                message="Are you sure you want to delete this record? This action cannot be undone."
            />

            {/* Resend Telegram Modal */}
            {resendConfirmOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => !resending && setResendConfirmOpen(false)}>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: '12px', width: '440px', maxWidth: '95vw',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideInUp 0.25s ease-out',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>📤 Send to Telegram</h3>
                        </div>
                        <div style={{ padding: '20px 24px' }}>
                            {resending ? (
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>⏳ Sending... Please wait.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleResendTelegram('detail')}
                                        style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: '8px' }}
                                    >
                                        <Send size={14} /> Resend each Pending transaction
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleResendTelegram('summary')}
                                        style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', borderRadius: '8px' }}
                                    >
                                        <DollarSign size={14} /> Send Summary Report (Pending + Complete + Total)
                                    </button>
                                </div>
                            )}
                        </div>
                        {!resending && (
                            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-ghost" onClick={() => setResendConfirmOpen(false)} style={{ padding: '8px 16px' }}>Cancel</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ImagePreview src={previewImg} onClose={() => setPreviewImg(null)} />
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
