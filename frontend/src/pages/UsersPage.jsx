import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, X, CheckCircle, XCircle, Search, Shield, ShieldCheck } from 'lucide-react';
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

/* ── User Form Modal ── */
function UserFormModal({ isOpen, onClose, onSubmit, formData, onChange, title, submitLabel, roles, isEdit, submitting }) {
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
                        <label className="modal-label">Full Name *</label>
                        <input
                            className="filter-input"
                            name="name"
                            placeholder="e.g. John Doe"
                            value={formData.name}
                            onChange={onChange}
                            required
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="modal-label">Username *</label>
                            <input
                                className="filter-input"
                                name="username"
                                placeholder="e.g. johndoe"
                                value={formData.username}
                                onChange={onChange}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label className="modal-label">Email *</label>
                            <input
                                className="filter-input"
                                name="email"
                                type="email"
                                placeholder="e.g. john@feline.com"
                                value={formData.email}
                                onChange={onChange}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="modal-label">{isEdit ? 'Password (leave blank to keep)' : 'Password *'}</label>
                            <input
                                className="filter-input"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={onChange}
                                required={!isEdit}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label className="modal-label">Role *</label>
                            <select
                                className="filter-input"
                                name="role_id"
                                value={formData.role_id}
                                onChange={onChange}
                                required
                                style={{ width: '100%' }}
                            >
                                <option value="" disabled>Select Role</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.name === 'super_admin' ? 'Super Admin' : r.name === 'admin' ? 'Admin' : r.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
                        <label style={{
                            position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={(e) => onChange({ target: { name: 'is_active', value: e.target.checked } })}
                                style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
                            />
                            <span style={{ marginLeft: '8px', fontSize: '14px', color: 'var(--text-primary)' }}>Active Account</span>
                        </label>
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
export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '', role_id: '', is_active: true });
    const [submitting, setSubmitting] = useState(false);

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

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/users?page=${page}&search=${search}&per_page=15`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success && json.data) {
                setUsers(json.data.users.data || []);
                setTotalPages(json.data.users.last_page || 1);
                setTotalUsers(json.data.users.total || 0);
                setRoles(json.data.roles || []);
            }
        } catch (err) {
            addToast('Failed to load users: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [page, search]);

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
        setFormData({ name: '', username: '', email: '', password: '', role_id: roles.length > 0 ? roles[0].id : '', is_active: true });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEditModal = (user) => {
        setModalMode('edit');
        setEditingId(user.id);
        setFormData({ name: user.name || '', username: user.username || '', email: user.email || '', password: '', role_id: user.role_id, is_active: user.is_active });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            addToast('Name and email are required!', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const isEdit = modalMode === 'edit';
            const url = isEdit ? `${API_BASE}/api/users/${editingId}` : `${API_BASE}/api/users`;
            const method = isEdit ? 'PUT' : 'POST';

            const submitData = { ...formData };
            if (isEdit && !submitData.password) {
                delete submitData.password;
            }

            const token = localStorage.getItem('token');
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData),
            });
            const json = await res.json();

            if (json.success) {
                addToast(isEdit ? 'User updated successfully!' : 'User created successfully!');
                setModalOpen(false);
                fetchUsers();
            } else {
                addToast(json.message || 'Operation failed!', 'error');
            }
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = (id) => {
        setDeletingId(id);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/users/${deletingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                addToast('User deleted successfully!');
                fetchUsers();
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

    const activeCount = users.filter(u => u.is_active).length;
    const superAdminCount = users.filter(u => u.role_id === 2).length;

    return (
        <>
            <Topbar
                section="Management"
                breadcrumb="Users"
                title="User Management"
                onRefresh={fetchUsers}
                loading={loading}
            />
            <div className="page-content">

                {/* Stats */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon blue"><Users size={20} /></div>
                            <span className="stat-card-label">Total Users</span>
                        </div>
                        <div className="stat-card-value">{totalUsers}</div>
                        <div className="stat-card-sub">All registered users</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon green"><CheckCircle size={20} /></div>
                            <span className="stat-card-label">Active</span>
                        </div>
                        <div className="stat-card-value">{activeCount}</div>
                        <div className="stat-card-sub">Currently active on this page</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon purple"><ShieldCheck size={20} /></div>
                            <span className="stat-card-label">Super Admins</span>
                        </div>
                        <div className="stat-card-value">{superAdminCount}</div>
                        <div className="stat-card-sub">With full access</div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="filters-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '360px', width: '100%' }}>
                            <div className="filter-group" style={{ position: 'relative', flex: 1 }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    className="filter-input"
                                    type="text"
                                    placeholder="Search by name, email, username..."
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    style={{ width: '100%', paddingLeft: '36px' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-ghost" style={{ padding: '8px 14px' }}>Search</button>
                        </form>
                    </div>
                    <div>
                        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '100%' }}>
                            <Plus size={16} /> New User
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="table-container">
                    {loading ? (
                        <div className="table-loading"><div className="spinner" /><span>Loading...</span></div>
                    ) : users.length === 0 ? (
                        <div className="table-empty">
                            <Users size={60} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                            <h3>No users found</h3>
                            <p>Click "New User" to create a user or adjust your search.</p>
                        </div>
                    ) : (
                        <div className="table-scroll">
                            <table className="data-table" id="users-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px' }}>#</th>
                                        <th>Name</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, idx) => (
                                        <tr key={user.id}>
                                            <td>
                                                <span style={{ color: 'var(--text-muted)' }}>{(page - 1) * 15 + idx + 1}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{user.username || '—'}</span>
                                            </td>
                                            <td>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{user.email}</span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                                    background: user.role_id === 2 ? 'rgba(168,85,247,0.12)' : 'rgba(99,102,241,0.12)',
                                                    color: user.role_id === 2 ? '#c084fc' : '#818cf8',
                                                }}>
                                                    {user.role_id === 2 ? <ShieldCheck size={12} /> : <Shield size={12} />}
                                                    {user.role?.name === 'super_admin' ? 'Super Admin' : user.role?.name === 'admin' ? 'Admin' : (user.role?.name || 'Unknown')}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                                    background: user.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                                    color: user.is_active ? '#34d399' : '#f87171',
                                                }}>
                                                    {user.is_active ? <><CheckCircle size={12} /> Active</> : <><XCircle size={12} /> Inactive</>}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={() => openEditModal(user)} title="Edit">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px', color: 'var(--danger)' }} onClick={() => confirmDelete(user.id)} title="Delete">
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                        <button
                            className="btn btn-ghost"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            style={{ padding: '8px 16px' }}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            className="btn btn-ghost"
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            style={{ padding: '8px 16px' }}
                        >
                            Next
                        </button>
                    </div>
                )}

            </div>

            {/* Modals */}
            <UserFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                formData={formData}
                onChange={handleFormChange}
                roles={roles}
                isEdit={modalMode === 'edit'}
                submitting={submitting}
                title={modalMode === 'create' ? 'New User' : 'Update User'}
                submitLabel={modalMode === 'create' ? 'Create' : 'Update'}
            />

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Confirm Delete"
                message="Are you sure you want to delete this user? This action cannot be undone."
            />

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
}
