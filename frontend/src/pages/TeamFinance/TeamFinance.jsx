import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, X, CheckCircle, Search, Shield, ShieldCheck, UserPlus } from 'lucide-react';
import Topbar from '../../components/Topbar';

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
                    <button className="btn btn-primary" onClick={onConfirm} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none' }}>Confirm</button>
                </div>
            </div>
        </div>
    );
}

export default function TeamFinancePage() {
    const [teams, setTeams] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Team Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', team_leader: '' });
    const [submitting, setSubmitting] = useState(false);

    // Member Modal
    const [memberModalOpen, setMemberModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Confirm delete team
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Confirm remove member
    const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
    const [removeInfo, setRemoveInfo] = useState({teamId: null, userId: null, teamName: '', userName: ''});

    // Toasts
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);
    const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/team-finances`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const json = await res.json();
            setTeams(json);
            
            // Also fetch users for selection
            const userRes = await fetch(`${API_BASE}/api/users?per_page=100`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const userJson = await userRes.json();
            if (userJson.success && userJson.data) {
                setAllUsers(userJson.data.users.data || []);
            }
        } catch (err) {
            addToast('Failed to load teams', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTeams(); }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setModalMode('create');
        setFormData({ name: '', description: '', team_leader: '' });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEditModal = (team) => {
        setModalMode('edit');
        setEditingId(team.id);
        setFormData({ name: team.name || '', description: team.description || '', team_leader: team.team_leader || '' });
        setModalOpen(true);
    };

    const openMemberModal = (team) => {
        setSelectedTeam(team);
        setSelectedUsers(team.members.map(m => m.id.toString()));
        setMemberModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            addToast('Team name is required', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const isEdit = modalMode === 'edit';
            const url = isEdit ? `${API_BASE}/api/team-finances/${editingId}` : `${API_BASE}/api/team-finances`;
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
            if (res.ok) {
                addToast(isEdit ? 'Team updated successfully' : 'Team created successfully');
                setModalOpen(false);
                fetchTeams();
            } else {
                addToast('Operation failed', 'error');
            }
        } catch (err) {
            addToast('An error occurred', 'error');
            console.error(err);
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
            const res = await fetch(`${API_BASE}/api/team-finances/${deletingId}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                addToast('Team deleted successfully');
                fetchTeams();
            } else {
                addToast('Failed to delete team', 'error');
            }
        } catch (err) {
            addToast('An error occurred', 'error');
            console.error(err);
        } finally {
            setConfirmOpen(false);
            setDeletingId(null);
        }
    };

    const handleAssignMembers = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/team-finances/${selectedTeam.id}/members`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ user_ids: selectedUsers }),
            });
            if (res.ok) {
                addToast('Members updated successfully');
                setMemberModalOpen(false);
                fetchTeams();
            } else {
                addToast('Failed to update members', 'error');
            }
        } catch (err) {
            addToast('An error occurred', 'error');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const confirmRemoveMember = (teamId, teamName, userId, userName) => {
        setRemoveInfo({teamId, teamName, userId, userName});
        setConfirmRemoveOpen(true);
    };

    const handleRemoveMember = async () => {
        try {
            const {teamId, userId} = removeInfo;
            const res = await fetch(`${API_BASE}/api/team-finances/${teamId}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                addToast('Member removed successfully');
                fetchTeams();
            } else {
                addToast('Failed to remove member', 'error');
            }
        } catch (err) {
            addToast('An error occurred', 'error');
            console.error(err);
        } finally {
            setConfirmRemoveOpen(false);
        }
    };

    return (
        <>
            <Topbar
                section="Management"
                breadcrumb="Team Finances"
                title="Team Finance Management"
                onRefresh={fetchTeams}
                loading={loading}
                actions={
                    <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
                        <Plus size={16} /> New Team
                    </button>
                }
            />
            <div className="page-content">
                <div className="table-container">
                    {loading ? (
                        <div className="table-loading"><div className="spinner" /><span>Loading...</span></div>
                    ) : teams.length === 0 ? (
                        <div className="table-empty">
                            <Users size={60} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                            <h3>No teams found</h3>
                            <p>Click "New Team" to create a new finance team.</p>
                        </div>
                    ) : (
                        <div className="table-scroll">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Team Name</th>
                                        <th>Leader</th>
                                        <th style={{ minWidth: '300px' }}>Members</th>
                                        <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map(team => (
                                        <tr key={team.id}>
                                            <td><span style={{ color: 'var(--text-muted)' }}>{team.id}</span></td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{team.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{team.description}</div>
                                            </td>
                                            <td>
                                                {team.leader ? (
                                                    <span style={{ 
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                                        background: 'rgba(52, 211, 153, 0.1)', color: '#10b981'
                                                    }}>
                                                        <ShieldCheck size={14} /> {team.leader.name}
                                                    </span>
                                                ) : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Not Assigned</span>}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                                                        {team.members.map(m => (
                                                            <span key={m.id} style={{
                                                                background: 'var(--bg-hover)', color: 'var(--text-primary)',
                                                                padding: '4px 10px', borderRadius: '16px', fontSize: '12px',
                                                                display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-color)'
                                                            }}>
                                                                {m.name}
                                                                <button 
                                                                    title="Remove member"
                                                                    style={{ 
                                                                        background: 'none', border: 'none', padding: 0, margin: 0, 
                                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', 
                                                                        color: 'var(--text-muted)', transition: 'color 0.2s' 
                                                                    }}
                                                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                                                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                                                    onClick={() => confirmRemoveMember(team.id, team.name, m.id, m.name)}
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </span>
                                                        ))}
                                                        {team.members.length === 0 && (
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No members in this team</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px', color: 'var(--primary)' }} onClick={() => openMemberModal(team)} title="Assign Members">
                                                        <UserPlus size={14} />
                                                    </button>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={() => openEditModal(team)} title="Edit">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px', color: 'var(--danger)' }} onClick={() => confirmDelete(team.id)} title="Delete">
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

            {/* Team Modal */}
            {modalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => setModalOpen(false)}>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: '12px', width: '450px', maxWidth: '95vw',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideInUp 0.25s ease-out',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {modalMode === 'create' ? 'New Finance Team' : 'Update Finance Team'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label className="modal-label">Team Name *</label>
                                <input className="filter-input" style={{ width: '100%' }} name="name" placeholder="E.g. Accounting Squad" value={formData.name} onChange={handleFormChange} />
                            </div>
                            <div>
                                <label className="modal-label">Description</label>
                                <input className="filter-input" style={{ width: '100%' }} name="description" placeholder="Brief info about this team" value={formData.description} onChange={handleFormChange} />
                            </div>
                            <div>
                                <label className="modal-label">Team Leader</label>
                                <select className="filter-input" style={{ width: '100%' }} name="team_leader" value={formData.team_leader} onChange={handleFormChange}>
                                    <option value="">-- No Leader Assigned --</option>
                                    {allUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? 'Saving...' : (modalMode === 'create' ? 'Create Team' : 'Save Changes')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Member Modal */}
            {memberModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => setMemberModalOpen(false)}>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: '12px', width: '500px', maxWidth: '95vw',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideInUp 0.25s ease-out',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Manage Members: <span style={{ color: 'var(--primary)' }}>{selectedTeam?.name}</span>
                            </h3>
                            <button onClick={() => setMemberModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <input 
                                    className="filter-input" type="text" placeholder="Search members..." 
                                    style={{ width: '100%' }}
                                    onChange={(e) => {
                                        const searchTerm = e.target.value.toLowerCase();
                                        const labels = document.querySelectorAll('.member-list-label');
                                        labels.forEach(label => {
                                            const text = label.textContent.toLowerCase();
                                            label.style.display = text.includes(searchTerm) ? 'flex' : 'none';
                                        });
                                    }}
                                />
                            </div>
                            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-base)' }}>
                                {allUsers.map(user => (
                                    <label key={user.id} className="member-list-label" style={{ 
                                        display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                                        padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
                                        background: selectedUsers.includes(user.id.toString()) ? 'rgba(99,102,241,0.05)' : 'var(--bg-card)',
                                        transition: 'background 0.2s', margin: 0,
                                        borderLeft: selectedUsers.includes(user.id.toString()) ? '3px solid var(--primary)' : '3px solid transparent'
                                    }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedUsers.includes(user.id.toString())}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedUsers([...selectedUsers, user.id.toString()]);
                                                else setSelectedUsers(selectedUsers.filter(id => id !== user.id.toString()));
                                            }}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{user.name}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user.email}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                                <button className="btn btn-ghost" onClick={() => setMemberModalOpen(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleAssignMembers} disabled={submitting}>Save Members ({selectedUsers.length})</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Delete Finance Team"
                message="Are you sure you want to delete this team? Members will be unassigned but NOT deleted. This action cannot be undone."
            />

            <ConfirmModal
                isOpen={confirmRemoveOpen}
                onClose={() => setConfirmRemoveOpen(false)}
                onConfirm={handleRemoveMember}
                title="Remove Member"
                message={`Are you sure you want to remove ${removeInfo.userName} from the team ${removeInfo.teamName}?`}
            />

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
}
