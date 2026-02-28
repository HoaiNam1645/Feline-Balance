import { useState, useEffect, useCallback, useMemo } from 'react';
import { ShieldCheck, Plus, Pencil, Trash2, X, CheckCircle, XCircle, Search, Shield } from 'lucide-react';
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

/* ── Role Form Modal ── */
function RoleFormModal({ isOpen, onClose, onSubmit, formData, onChange, title, submitLabel, submitting }) {
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
                        <label className="modal-label">Role Code Name (slug) *</label>
                        <input
                            className="filter-input"
                            name="name"
                            placeholder="e.g. manager"
                            value={formData.name}
                            onChange={onChange}
                            required
                            style={{ width: '100%', fontFamily: 'monospace' }}
                        />
                        <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            Must be unique, lowercase, without spaces. Cannot be modified for system core roles.
                        </small>
                    </div>
                    <div>
                        <label className="modal-label">Display Name *</label>
                        <input
                            className="filter-input"
                            name="display_name"
                            placeholder="e.g. Manager"
                            value={formData.display_name}
                            onChange={onChange}
                            required
                            style={{ width: '100%' }}
                        />
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
export default function RolesPage() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', display_name: '' });
    const [submitting, setSubmitting] = useState(false);

    // Confirm delete
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Toasts
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/roles`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setRoles(json.data);
            } else {
                addToast(json.message || 'Failed to fetch roles', 'error');
            }
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // Form handlers
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setModalMode('create');
        setFormData({ name: '', display_name: '' });
        setModalOpen(true);
    };

    const openEditModal = (role) => {
        setModalMode('edit');
        setEditingId(role.id);
        setFormData({ name: role.name || '', display_name: role.display_name || '' });
        setModalOpen(true);
    };

    const submitForm = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const url = modalMode === 'create'
                ? `${API_BASE}/api/roles`
                : `${API_BASE}/api/roles/${editingId}`;
            const method = modalMode === 'create' ? 'POST' : 'PUT';

            const payload = { ...formData };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const json = await res.json();

            if (json.success) {
                addToast(json.message, 'success');
                setModalOpen(false);
                fetchRoles();
            } else {
                addToast(json.message || 'Validation failed. Check inputs.', 'error');
            }
        } catch (err) {
            addToast('Error saving: ' + err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete handlers
    const openDeleteConfirm = (id) => {
        setDeletingId(id);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/roles/${deletingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                addToast(json.message, 'success');
                fetchRoles();
            } else {
                addToast(json.message || 'Delete failed', 'error');
            }
        } catch (err) {
            addToast('Error deleting: ' + err.message, 'error');
        } finally {
            setConfirmOpen(false);
            setDeletingId(null);
        }
    };

    const isSystemRole = (roleName) => ['super_admin', 'admin'].includes(roleName?.toLowerCase());

    const filteredRoles = useMemo(() => {
        return roles.filter(role => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                String(role.name || '').toLowerCase().includes(q) ||
                String(role.display_name || '').toLowerCase().includes(q)
            );
        });
    }, [roles, search]);

    return (
        <>
            <Topbar section="Management" title="Role Management" onRefresh={fetchRoles} loading={loading} />
            <div className="page-content">
                <div className="filters-bar" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                        <div className="filter-group">
                            <Search size={15} style={{ color: 'var(--text-muted)' }} />
                            <input
                                className="filter-input"
                                placeholder="Search by name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '100%' }}>
                            <Plus size={16} /> Add New Role
                        </button>
                    </div>
                </div>

                <div className="table-container">
                    {loading ? (
                        <div className="table-loading">
                            <div className="spinner" />
                            <span>Loading...</span>
                        </div>
                    ) : filteredRoles.length === 0 ? (
                        <div className="table-empty">
                            <Database className="table-empty-icon" size={60} />
                            <h3>No roles found</h3>
                            <p>There are no roles matching your search criteria.</p>
                        </div>
                    ) : (
                        <div className="table-scroll">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px' }}>ID</th>
                                        <th>Role Code</th>
                                        <th>Display Name</th>
                                        <th style={{ width: '150px' }}>Created At</th>
                                        <th style={{ width: '100px', textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRoles.map(role => (
                                        <tr key={role.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{role.id}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{
                                                        width: '24px', height: '24px', borderRadius: '4px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: role.name === 'super_admin' ? 'rgba(168,85,247,0.12)' : 'rgba(99,102,241,0.12)',
                                                        color: role.name === 'super_admin' ? '#c084fc' : '#818cf8',
                                                    }}>
                                                        {role.name === 'super_admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                                                    </div>
                                                    <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{role.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {role.display_name || role.name}
                                                </span>
                                            </td>
                                            <td>{new Date(role.created_at).toLocaleDateString()}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn btn-ghost"
                                                        onClick={() => openEditModal(role)}
                                                        title="Edit"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost"
                                                        onClick={() => openDeleteConfirm(role.id)}
                                                        title={isSystemRole(role.name) ? "Cannot delete system protected role" : "Delete"}
                                                        style={{ color: isSystemRole(role.name) ? 'var(--text-muted)' : '#ef4444', pointerEvents: isSystemRole(role.name) ? 'none' : 'auto' }}
                                                        disabled={isSystemRole(role.name)}
                                                    >
                                                        <Trash2 size={15} />
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

            <RoleFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={submitForm}
                formData={formData}
                onChange={handleFormChange}
                title={modalMode === 'create' ? 'Create New Role' : 'Edit Role'}
                submitLabel={modalMode === 'create' ? 'Create Role' : 'Save Changes'}
                submitting={submitting}
            />

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Role"
                message="Are you sure you want to delete this role? This action cannot be undone and will fail if users are assigned to it."
            />

            <ToastContainer toasts={toasts} removeToast={(id) => setToasts(t => t.filter(x => x.id !== id))} />
        </>
    );
}
