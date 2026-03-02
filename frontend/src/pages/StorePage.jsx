import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Store as StoreIcon, Plus, Pencil, Trash2, X, Search, Eye, DollarSign, CreditCard, Calendar, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Filter } from 'lucide-react';
import Topbar from '../components/Topbar';

const API_BASE = import.meta.env.VITE_API_URL || '';

/* ── Toast Container ── */
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

/* ── Payment History Modal ── */
function PaymentHistoryModal({ isOpen, onClose, store }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchHistory = useCallback(async () => {
        if (!store) return;
        setLoading(true);
        try {
            let url = `${API_BASE}/api/stores/${store.id}/payment-history?page=${page}&per_page=10`;
            if (dateFrom) url += `&date_from=${dateFrom}`;
            if (dateTo) url += `&date_to=${dateTo}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const json = await res.json();
            if (json.success) {
                setHistory(json.data.history.data || []);
                setTotalPages(json.data.history.last_page || 1);
                setTotal(json.data.history.total || 0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [store, page, dateFrom, dateTo]);

    useEffect(() => {
        if (isOpen && store) {
            setPage(1);
            setDateFrom('');
            setDateTo('');
        }
    }, [isOpen, store]);

    useEffect(() => {
        if (isOpen && store) fetchHistory();
    }, [isOpen, store, page, dateFrom, dateTo, fetchHistory]);

    if (!isOpen || !store) return null;

    const clearFilters = () => {
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    };

    const formatMoney = (amount) => {
        if (!amount) return '$0.00';
        return '$' + parseFloat(amount).toFixed(2);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '12px', width: '900px', maxWidth: '95vw', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideInUp 0.25s ease-out',
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Payment History</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Store: {store.id} – {store.name} | Account: {store.account_no}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Date Filters */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Transaction Date From</label>
                        <input
                            className="filter-input"
                            type="datetime-local"
                            value={dateFrom}
                            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                            style={{ width: '200px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Transaction Date To</label>
                        <input
                            className="filter-input"
                            type="datetime-local"
                            value={dateTo}
                            onChange={e => { setDateTo(e.target.value); setPage(1); }}
                            style={{ width: '200px' }}
                        />
                    </div>
                    <button className="btn btn-ghost" onClick={clearFilters} style={{ padding: '8px 16px' }}>Clear</button>
                </div>

                {/* Table */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px' }}>
                            <div className="spinner" style={{ width: '24px', height: '24px' }} />
                            <span style={{ color: 'var(--text-secondary)' }}>Loading...</span>
                        </div>
                    ) : history.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No payment history found.</div>
                    ) : (
                        <table className="data-table" style={{ margin: 0 }}>
                            <thead>
                                <tr>
                                    <th style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Transaction Date</th>
                                    <th style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Transaction ID</th>
                                    <th style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-secondary)', textAlign: 'right' }}>Amount</th>
                                    <th style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Currency</th>
                                    <th style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{formatDate(item.transaction_date)}</td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{item.transaction_id || '—'}</td>
                                        <td style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', textAlign: 'right' }}>{formatMoney(item.amount)}</td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.currency || 'USD'}</td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description || item.from_to || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Showing {history.length > 0 ? ((page - 1) * 10 + 1) : 0} to {Math.min(page * 10, total)} of {total} results
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '6px 12px', fontSize: '13px' }}>Previous</button>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
                        <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '6px 12px', fontSize: '13px' }}>Next</button>
                    </div>
                </div>

                {/* Close button */}
                <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={onClose} style={{ padding: '8px 20px' }}>Close</button>
                </div>
            </div>
        </div>
    );
}

/* ── Store Form Modal ── */
function StoreFormModal({ isOpen, onClose, onSubmit, formData, onChange, title, submitLabel, users, teams, submitting }) {
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}><X size={18} /></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label className="modal-label">Store Name *</label>
                        <input className="filter-input" name="name" placeholder="e.g. Tonia Sales" value={formData.name} onChange={onChange} required style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label className="modal-label">Account No. *</label>
                        <input className="filter-input" name="account_no" placeholder="e.g. 30000009273568" value={formData.account_no} onChange={onChange} required style={{ width: '100%' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="modal-label">Assigned User</label>
                            <select className="filter-input" name="user_id" value={formData.user_id} onChange={onChange} style={{ width: '100%' }}>
                                <option value="">-- None --</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="modal-label">Status</label>
                            <select className="filter-input" name="status" value={formData.status} onChange={onChange} style={{ width: '100%' }}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose} style={{ padding: '10px 20px' }} disabled={submitting}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }} disabled={submitting}>
                            {submitting ? 'Saving...' : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function StorePage({ onMenuClick }) {
    const [stores, setStores] = useState([]);
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchParams, setSearchParams] = useSearchParams();
    const updateParam = useCallback((key, value) => {
        setSearchParams(prev => {
            if (value) prev.set(key, String(value));
            else prev.delete(key);
            return prev;
        }, { replace: true });
    }, [setSearchParams]);

    const page = Number(searchParams.get('page')) || 1;
    const setPage = (v) => updateParam('page', v);

    const filterTeam = searchParams.get('team_id') || '';
    const setFilterTeam = (v) => updateParam('team_id', v);

    const filterUser = searchParams.get('user_id') || '';
    const setFilterUser = (v) => updateParam('user_id', v);

    const [totalPages, setTotalPages] = useState(1);
    const [totalStores, setTotalStores] = useState(0);

    // Search
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');

    // Store Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', account_no: '', user_id: '', status: 'active' });
    const [submitting, setSubmitting] = useState(false);

    // Confirm delete
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Payment History
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState(null);

    // Import CSV
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [importFile, setImportFile] = useState(null);

    // Toasts
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);
    const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    const fetchStores = useCallback(async () => {
        setLoading(true);
        try {
            let url = `${API_BASE}/api/stores?page=${page}&search=${search}&per_page=15`;
            if (filterTeam) url += `&team_id=${filterTeam}`;
            if (filterUser) url += `&user_id=${filterUser}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const json = await res.json();
            if (json.success && json.data) {
                setStores(json.data.stores.data || []);
                setTotalPages(json.data.stores.last_page || 1);
                setTotalStores(json.data.stores.total || 0);
                setTeams(json.data.teams || []);
                setUsers(json.data.users || []);
            }
        } catch (err) {
            addToast('Failed to load stores: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [page, search, filterTeam, filterUser]);

    useEffect(() => { fetchStores(); }, [fetchStores]);

    // Reset page to 1 when filters or search change
    const prevFiltersRef = useRef({ filterTeam, filterUser, search });
    useEffect(() => {
        const prev = prevFiltersRef.current;
        if (prev.filterTeam !== filterTeam || prev.filterUser !== filterUser || prev.search !== search) {
            prevFiltersRef.current = { filterTeam, filterUser, search };
            if (page !== 1) updateParam('page', '');
        }
    }, [filterTeam, filterUser, search]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setModalMode('create');
        setFormData({ name: '', account_no: '', user_id: '', status: 'active' });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEditModal = (store) => {
        setModalMode('edit');
        setEditingId(store.id);
        setFormData({
            name: store.name || '',
            account_no: store.account_no || '',
            user_id: store.user_id || '',
            status: store.status || 'active',
        });
        setModalOpen(true);
    };

    const openHistory = (store) => {
        setSelectedStore(store);
        setHistoryOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.account_no.trim()) {
            addToast('Store name and Account No. are required!', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const isEdit = modalMode === 'edit';
            const url = isEdit ? `${API_BASE}/api/stores/${editingId}` : `${API_BASE}/api/stores`;
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData),
            });
            const json = await res.json();
            if (json.success) {
                addToast(isEdit ? 'Store updated successfully!' : 'Store created successfully!');
                setModalOpen(false);
                fetchStores();
            } else {
                addToast(json.message || 'Operation failed!', 'error');
            }
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDeleteStore = (id) => {
        setDeletingId(id);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/stores/${deletingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const json = await res.json();
            if (json.success) {
                addToast('Store deleted successfully!');
                fetchStores();
            } else {
                addToast(json.message || 'Delete failed!', 'error');
            }
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        } finally {
            setConfirmOpen(false);
            setDeletingId(null);
        }
    };

    const handleImportCsv = async () => {
        if (!importFile) {
            addToast('Please select a CSV file', 'error');
            return;
        }
        setImporting(true);
        setImportResult(null);
        try {
            const fd = new FormData();
            fd.append('file', importFile);
            const res = await fetch(`${API_BASE}/api/stores/import-csv`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: fd,
            });
            const json = await res.json();
            if (json.success) {
                setImportResult(json.data);
                addToast(`Imported ${json.data.imported} transactions to ${json.data.stores_affected} stores`);
                fetchStores();
            } else {
                addToast(json.message || 'Import failed', 'error');
            }
        } catch (err) {
            addToast('Import error: ' + err.message, 'error');
        } finally {
            setImporting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatMoney = (amount) => {
        if (!amount) return '$0.00';
        return '$' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <>
            <Topbar
                section="Finance"
                breadcrumb="Stores"
                title="Store Management"
                onRefresh={fetchStores}
                loading={loading}
                onMenuClick={onMenuClick}
            />
            <div className="page-content">

                {/* Stats */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon blue"><StoreIcon size={20} /></div>
                            <span className="stat-card-label">Total Stores</span>
                        </div>
                        <div className="stat-card-value">{totalStores}</div>
                        <div className="stat-card-sub">All registered stores</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon green"><DollarSign size={20} /></div>
                            <span className="stat-card-label">Total Amount</span>
                        </div>
                        <div className="stat-card-value">{formatMoney(stores.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0))}</div>
                        <div className="stat-card-sub">On current page</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon purple"><CreditCard size={20} /></div>
                            <span className="stat-card-label">Total Payments</span>
                        </div>
                        <div className="stat-card-value">{stores.reduce((sum, s) => sum + (s.total_payments || 0), 0)}</div>
                        <div className="stat-card-sub">On current page</div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="filters-bar">
                    <div className="filter-group">
                        <Search size={15} style={{ color: 'var(--text-muted)' }} />
                        <input
                            className="filter-input" type="text" placeholder="Search name, account..."
                            value={searchInput} onChange={e => { setSearchInput(e.target.value); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(e); }}
                        />
                    </div>

                    <div className="filter-group">
                        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                        <select className="filter-select" value={filterTeam} onChange={e => {
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
                        <select className="filter-select" value={filterUser} onChange={e => {
                            const v = e.target.value;
                            setSearchParams(prev => {
                                if (v) prev.set('user_id', v); else prev.delete('user_id');
                                prev.delete('page');
                                return prev;
                            }, { replace: true });
                        }}>
                            <option value="">All Users</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost" onClick={() => { setImportFile(null); setImportResult(null); setImportModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Upload size={14} /> Import CSV
                        </button>
                        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Plus size={14} /> New Store
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="table-container">
                    {loading ? (
                        <div className="table-loading"><div className="spinner" /><span>Loading...</span></div>
                    ) : stores.length === 0 ? (
                        <div className="table-empty">
                            <StoreIcon size={60} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                            <h3>No stores found</h3>
                            <p>Click "New Store" to create one or adjust your filters.</p>
                        </div>
                    ) : (
                        <div className="table-scroll">
                            <table className="data-table" id="stores-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px' }}>#</th>
                                        <th>Store Name</th>
                                        <th>Account No</th>
                                        <th>Team</th>
                                        <th>Assigned User</th>
                                        <th style={{ textAlign: 'right' }}>Total Payments</th>
                                        <th style={{ textAlign: 'right' }}>Total Amount</th>
                                        <th>Last Payment</th>
                                        <th>Created At</th>
                                        <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stores.map((store, idx) => (
                                        <tr key={store.id}>
                                            <td><span style={{ color: 'var(--text-muted)' }}>{(page - 1) * 15 + idx + 1}</span></td>
                                            <td>
                                                <span
                                                    style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}
                                                    onClick={() => openHistory(store)}
                                                    title="View Payment History"
                                                >
                                                    {store.name}
                                                </span>
                                            </td>
                                            <td><span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{store.account_no}</span></td>
                                            <td>
                                                {store.user?.team ? (
                                                    <span style={{
                                                        padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                                                        background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                                                    }}>{store.user.team.name}</span>
                                                ) : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>}
                                            </td>
                                            <td><span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{store.user?.name || '—'}</span></td>
                                            <td style={{ textAlign: 'right' }}><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{store.total_payments || 0}</span></td>
                                            <td style={{ textAlign: 'right' }}><span style={{ fontWeight: 600, color: '#10b981' }}>{formatMoney(store.total_amount)}</span></td>
                                            <td><span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDate(store.last_payment_date)}</span></td>
                                            <td><span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDate(store.created_at)}</span></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px', color: 'var(--primary)' }} onClick={() => openHistory(store)} title="Payment History">
                                                        <Eye size={14} />
                                                    </button>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={() => openEditModal(store)} title="Edit">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px', color: 'var(--danger)' }} onClick={() => confirmDeleteStore(store.id)} title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalStores > 0 && (
                        <div className="table-footer">
                            <div>
                                Showing {((page - 1) * 15) + 1} to {Math.min(page * 15, totalStores)} of {totalStores} stores
                            </div>

                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '4px 10px', fontSize: '13px' }}>
                                    Prev
                                </button>

                                <div style={{ display: 'flex', gap: '2px', margin: '0 8px' }}>
                                    {(() => {
                                        const pages = [];
                                        const last = Math.max(1, totalPages);

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
                                                        padding: '4px', minWidth: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
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

                                <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '4px 10px', fontSize: '13px' }}>
                                    Next
                                </button>
                            </div>

                            <div>Last updated: {new Date().toLocaleString('en-GB')}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <StoreFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                formData={formData}
                onChange={handleFormChange}
                users={users}
                teams={teams}
                submitting={submitting}
                title={modalMode === 'create' ? 'New Store' : 'Update Store'}
                submitLabel={modalMode === 'create' ? 'Create' : 'Update'}
            />

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Confirm Delete"
                message="Are you sure you want to delete this store? All payment history for this store will also be deleted. This cannot be undone."
            />

            <PaymentHistoryModal
                isOpen={historyOpen}
                onClose={() => setHistoryOpen(false)}
                store={selectedStore}
            />

            {/* Import CSV Modal */}
            {importModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => setImportModalOpen(false)}>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: '12px', width: '520px', maxWidth: '95vw',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideInUp 0.25s ease-out',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileSpreadsheet size={20} color="var(--primary)" /> Import Transactions (CSV)
                            </h3>
                            <button onClick={() => setImportModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {/* Drop zone */}
                            <label style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                border: '2px dashed var(--border-color)', borderRadius: '10px',
                                padding: '32px 20px', cursor: 'pointer', transition: 'all 0.2s',
                                background: importFile ? 'rgba(16,185,129,0.05)' : 'var(--bg-base)',
                                borderColor: importFile ? '#10b981' : undefined,
                            }}
                                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(99,102,241,0.05)'; }}
                                onDragLeave={e => { e.currentTarget.style.borderColor = importFile ? '#10b981' : 'var(--border-color)'; e.currentTarget.style.background = importFile ? 'rgba(16,185,129,0.05)' : 'var(--bg-base)'; }}
                                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setImportFile(f); setImportResult(null); e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = 'rgba(16,185,129,0.05)'; }}
                            >
                                <input type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={e => { setImportFile(e.target.files[0] || null); setImportResult(null); }} />
                                {importFile ? (
                                    <>
                                        <CheckCircle size={32} color="#10b981" />
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '8px' }}>{importFile.name}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{(importFile.size / 1024).toFixed(1)} KB — Click to change</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={32} color="var(--text-muted)" />
                                        <span style={{ color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>Click to select or drag & drop CSV file</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>PingPong transaction export format</span>
                                    </>
                                )}
                            </label>


                            {/* Import Result */}
                            {importResult && (
                                <div style={{ marginTop: '16px' }}>
                                    {/* Success / Stats banner */}
                                    <div style={{
                                        padding: '14px 16px', borderRadius: '10px', marginBottom: '12px',
                                        background: importResult.imported > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                        border: `1px solid ${importResult.imported > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            {importResult.imported > 0 ? <CheckCircle size={20} color="#10b981" /> : <AlertTriangle size={20} color="#ef4444" />}
                                            <span style={{ fontSize: '15px', fontWeight: 700, color: importResult.imported > 0 ? '#10b981' : '#ef4444' }}>
                                                {importResult.imported > 0 ? `Successfully imported ${importResult.imported} transactions` : 'No transactions imported'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '30px' }}>
                                            {importResult.duplicated > 0 && <span>⚠️ {importResult.duplicated} duplicated (skipped)</span>}
                                            {importResult.not_matched > 0 && <span>❌ {importResult.not_matched} rows unmatched</span>}
                                        </div>
                                    </div>

                                    {/* Affected Stores Table */}
                                    {importResult.affected_stores?.length > 0 && (
                                        <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                                            <div style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', background: 'var(--bg-base)', borderBottom: '1px solid var(--border-color)' }}>
                                                Stores Updated ({importResult.affected_stores.length})
                                            </div>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--bg-base)' }}>
                                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Store</th>
                                                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>New</th>
                                                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Total</th>
                                                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {importResult.affected_stores.map(s => (
                                                        <tr key={s.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                                                            <td style={{ padding: '10px 12px' }}>
                                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.account_no}</div>
                                                            </td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                                                <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontSize: '12px' }}>+{s.new_transactions}</span>
                                                            </td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{s.total_payments}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>${parseFloat(s.total_amount || 0).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                <button className="btn btn-ghost" onClick={() => setImportModalOpen(false)}>Close</button>
                                <button className="btn btn-primary" onClick={handleImportCsv} disabled={importing || !importFile} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {importing ? 'Importing...' : <><Upload size={14} /> Import</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
}
