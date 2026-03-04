import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
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

/* ── Company Form Modal ── */
function CompanyFormModal({ isOpen, onClose, onSubmit, formData, onChange, title, submitLabel }) {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '12px', width: '480px', maxWidth: '95vw',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideInUp 0.25s ease-out',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}><X size={18} /></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label className="modal-label">Company Name *</label>
                        <input
                            className="filter-input"
                            name="name"
                            placeholder="VD: Company Alpha"
                            value={formData.name}
                            onChange={onChange}
                            required
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div>
                        <label className="modal-label">Description</label>
                        <input
                            className="filter-input"
                            name="description"
                            placeholder="Short description..."
                            value={formData.description}
                            onChange={onChange}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose} style={{ padding: '10px 20px' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>{submitLabel}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function CompaniesPage({ onMenuClick }) {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    // Confirm delete
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

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/companies`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const json = await res.json();
            if (json.success) setCompanies(json.data);
        } catch (err) {
            addToast('Lỗi tải danh sách: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCompanies(); }, []);

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openCreateModal = () => {
        setModalMode('create');
        setFormData({ name: '', description: '' });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEditModal = (company) => {
        setModalMode('edit');
        setEditingId(company.id);
        setFormData({ name: company.name || '', description: company.description || '' });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            addToast('Company name is required!', 'error');
            return;
        }

        try {
            const isEdit = modalMode === 'edit';
            const url = isEdit ? `${API_BASE}/api/companies/${editingId}` : `${API_BASE}/api/companies`;
            const method = isEdit ? 'PUT' : 'POST';
            const token = localStorage.getItem('token');

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(formData),
            });
            const json = await res.json();

            if (json.success) {
                addToast(isEdit ? 'Company updated successfully!' : 'Company created successfully!');
                setModalOpen(false);
                fetchCompanies();
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
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/companies/${deletingId}`, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            const json = await res.json();
            if (json.success) {
                addToast('Company deleted successfully!');
                fetchCompanies();
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

    return (
        <>
            <Topbar
                section="Management"
                breadcrumb="Companies"
                title="Company Management"
                onRefresh={fetchCompanies}
                loading={loading}
                onMenuClick={onMenuClick}
            />
            <div className="page-content">

                {/* Stats */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '24px' }}>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon blue"><Building2 size={20} /></div>
                            <span className="stat-card-label">Total Companies</span>
                        </div>
                        <div className="stat-card-value">{companies.length}</div>
                        <div className="stat-card-sub">Active companies in system</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon green"><Check size={20} /></div>
                            <span className="stat-card-label">Active</span>
                        </div>
                        <div className="stat-card-value">{companies.length}</div>
                        <div className="stat-card-sub">Currently active</div>
                    </div>
                </div>

                <div className="filters-bar" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                    <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '100%' }}>
                        <Plus size={16} /> New Company
                    </button>
                </div>

                {/* Table */}
                <div className="table-container">
                    {loading ? (
                        <div className="table-loading"><div className="spinner" /><span>Loading...</span></div>
                    ) : companies.length === 0 ? (
                        <div className="table-empty">
                            <Building2 size={60} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                            <h3>No companies yet</h3>
                            <p>Click "New Company" to create your first company.</p>
                        </div>
                    ) : (
                        <div className="table-scroll">
                            <table className="data-table" id="companies-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px' }}>#</th>
                                        <th>Company Name</th>
                                        <th>Description</th>
                                        <th style={{ width: '160px' }}>Created</th>
                                        <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.map((company, idx) => (
                                        <tr key={company.id}>
                                            <td>
                                                <span style={{ color: 'var(--text-muted)' }}>{idx + 1}</span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{company.name}</span>
                                            </td>
                                            <td>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{company.description || '—'}</span>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                                    {company.created_at ? new Date(company.created_at).toLocaleString('vi-VN', {
                                                        year: 'numeric', month: '2-digit', day: '2-digit',
                                                        hour: '2-digit', minute: '2-digit'
                                                    }) : '—'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={() => openEditModal(company)} title="Edit">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px', color: 'var(--danger)' }} onClick={() => confirmDelete(company.id)} title="Delete">
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
                </div>

            </div>

            {/* Modals */}
            <CompanyFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                formData={formData}
                onChange={handleFormChange}
                title={modalMode === 'create' ? 'New Company' : 'Update Company'}
                submitLabel={modalMode === 'create' ? 'Create' : 'Update'}
            />

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Confirm Delete"
                message="Are you sure you want to delete this company? This action cannot be undone."
            />

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
}
