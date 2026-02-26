import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Phone, Mail, MapPin, CreditCard, Shield, FileText,
    Calendar, DollarSign, CheckCircle, XCircle, Clock, Pencil, ChevronDown, ChevronUp,
    Briefcase, Plus, Trash2, X
} from 'lucide-react';
import Topbar from '../components/Topbar';

const API_BASE = import.meta.env.VITE_API_URL || '';
const getHeaders = (json = false) => {
    const token = localStorage.getItem('token');
    const h = { Accept: 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (json) h['Content-Type'] = 'application/json';
    return h;
};

/* ── Toast ── */
function ToastContainer({ toasts, removeToast }) {
    return (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    padding: '12px 20px', borderRadius: 8,
                    background: t.type === 'success' ? 'linear-gradient(135deg, rgba(16,185,129,.95), rgba(5,150,105,.95))' :
                        'linear-gradient(135deg, rgba(239,68,68,.95), rgba(220,38,38,.95))',
                    color: '#fff', fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,.3)',
                    display: 'flex', alignItems: 'center', gap: 10, minWidth: 280,
                    animation: 'slideInRight .3s ease-out', cursor: 'pointer',
                }} onClick={() => removeToast(t.id)}>
                    <span>{t.type === 'success' ? '✓' : '✕'}</span>
                    <span style={{ flex: 1 }}>{t.message}</span>
                </div>
            ))}
        </div>
    );
}

/* ── Confirm Modal ── */
function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, width: 420, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,.5)', animation: 'slideInUp .25s ease-out' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
                </div>
                <div style={{ padding: '20px 24px' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{message}</p>
                </div>
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button className="btn btn-ghost" onClick={onClose} style={{ padding: '8px 16px' }}>Cancel</button>
                    <button className="btn btn-primary" onClick={onConfirm} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none' }}>Delete</button>
                </div>
            </div>
        </div>
    );
}

/* ── Contract Form Modal ── */
function ContractFormModal({ isOpen, onClose, onSubmit, formData, onChange, title, submitting }) {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12,
                width: 520, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,.5)', animation: 'slideInUp .25s ease-out',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4 }}><X size={18} /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSubmit(); }} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Contract Type *</label>
                            <select className="filter-input" name="type" value={formData.type} onChange={onChange} style={{ width: '100%' }}>
                                <option value="probation">Probation (Thử việc)</option>
                                <option value="official">Official (Chính thức)</option>
                            </select>
                        </div>
                        <div>
                            <label className="modal-label">Salary (VND) *</label>
                            <input className="filter-input" name="salary" type="number" value={formData.salary} onChange={onChange} required style={{ width: '100%' }} placeholder="e.g. 10000000" />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Standard Work Days</label>
                            <input className="filter-input" name="standard_work_days" type="number" value={formData.standard_work_days} onChange={onChange} style={{ width: '100%' }} placeholder="27" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="checkbox" name="is_current" checked={formData.is_current} onChange={e => onChange({ target: { name: 'is_current', value: e.target.checked } })} style={{ width: 16, height: 16, accentColor: '#6366f1' }} />
                                <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>Current Contract</span>
                            </label>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Start Date *</label>
                            <input className="filter-input" name="start_date" type="date" value={formData.start_date} onChange={onChange} required style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label className="modal-label">End Date</label>
                            <input className="filter-input" name="end_date" type="date" value={formData.end_date} onChange={onChange} style={{ width: '100%' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting} style={{ padding: '10px 20px' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '10px 20px' }}>{submitting ? 'Saving...' : 'Save Contract'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Info Row ── */
function InfoRow({ icon: Icon, label, value, accent }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{
                width: 32, height: 32, borderRadius: 8, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(99,102,241,.1)', flexShrink: 0,
            }}>
                <Icon size={15} style={{ color: 'var(--primary-light)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 14, color: accent ? 'var(--text-accent)' : 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-word' }}>{value || '—'}</div>
            </div>
        </div>
    );
}

/* ── CONTRACT CARD ── */
function ContractCard({ contract, isCurrent, onEdit, onDelete }) {
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
    const fmtMoney = (v) => v ? Number(v).toLocaleString('en-US') + ' ₫' : '—';

    return (
        <div style={{
            background: isCurrent ? 'rgba(99,102,241,.08)' : 'var(--bg-table-row)',
            border: isCurrent ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
            borderRadius: 12, padding: '18px 20px', position: 'relative',
            transition: 'all .2s',
        }}>
            {isCurrent && (
                <div style={{
                    position: 'absolute', top: -10, right: 16,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px',
                    borderRadius: 6, textTransform: 'uppercase', letterSpacing: '.5px',
                }}>
                    Current
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: contract.type === 'official' ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)',
                    color: contract.type === 'official' ? '#34d399' : '#fbbf24',
                }}>
                    {contract.type === 'official' ? 'Official (Chính thức)' : 'Probation (Thử việc)'}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost" style={{ padding: '4px 6px' }} onClick={() => onEdit(contract)} title="Edit"><Pencil size={13} /></button>
                    <button className="btn btn-ghost" style={{ padding: '4px 6px', color: 'var(--danger)' }} onClick={() => onDelete(contract)} title="Delete"><Trash2 size={13} /></button>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Salary</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtMoney(contract.salary)}</div>
                </div>
                <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Standard Days</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>{contract.standard_work_days || 27} days</div>
                </div>
                <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Start</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{fmtDate(contract.start_date)}</div>
                </div>
                <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>End</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{fmtDate(contract.end_date)}</div>
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════ */
const emptyContractForm = { type: 'probation', salary: '', standard_work_days: '27', start_date: '', end_date: '', is_current: true };

export default function EmployeeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAllContracts, setShowAllContracts] = useState(false);

    // Contract modal
    const [contractModalOpen, setContractModalOpen] = useState(false);
    const [contractModalMode, setContractModalMode] = useState('create'); // create | edit
    const [editingContractId, setEditingContractId] = useState(null);
    const [contractForm, setContractForm] = useState({ ...emptyContractForm });
    const [contractSubmitting, setContractSubmitting] = useState(false);

    // Delete confirm
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingContract, setDeletingContract] = useState(null);

    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((message, type = 'success') => {
        const tid = Date.now();
        setToasts(prev => [...prev, { id: tid, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== tid)), 3500);
    }, []);
    const removeToast = useCallback((tid) => setToasts(prev => prev.filter(t => t.id !== tid)), []);

    /* ── Fetch ── */
    const fetchEmployee = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/employees/${id}`, { headers: getHeaders() });
            const json = await res.json();
            if (json.success) {
                setEmployee(json.data);
            } else {
                addToast(json.message || 'Employee not found', 'error');
            }
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEmployee(); }, [id]);

    /* ── Contract CRUD ── */
    const handleContractFormChange = (e) => {
        const { name, value } = e.target;
        setContractForm(prev => ({ ...prev, [name]: value }));
    };

    const openCreateContract = () => {
        setContractModalMode('create');
        setEditingContractId(null);
        setContractForm({ ...emptyContractForm, start_date: employee?.start_date?.substring(0, 10) || new Date().toISOString().substring(0, 10) });
        setContractModalOpen(true);
    };

    const openEditContract = (contract) => {
        setContractModalMode('edit');
        setEditingContractId(contract.id);
        setContractForm({
            type: contract.type || 'probation',
            salary: contract.salary || '',
            standard_work_days: contract.standard_work_days || '27',
            start_date: contract.start_date ? contract.start_date.substring(0, 10) : '',
            end_date: contract.end_date ? contract.end_date.substring(0, 10) : '',
            is_current: !!contract.is_current,
        });
        setContractModalOpen(true);
    };

    const handleContractSubmit = async () => {
        if (!contractForm.salary || !contractForm.start_date) {
            addToast('Salary and Start Date are required!', 'error');
            return;
        }
        setContractSubmitting(true);
        try {
            const isEdit = contractModalMode === 'edit';
            const url = isEdit
                ? `${API_BASE}/api/employees/${id}/contracts/${editingContractId}`
                : `${API_BASE}/api/employees/${id}/contracts`;
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: getHeaders(true),
                body: JSON.stringify(contractForm),
            });
            const json = await res.json();
            if (json.success) {
                addToast(isEdit ? 'Contract updated!' : 'Contract created!');
                setContractModalOpen(false);
                fetchEmployee();
            } else {
                addToast(json.message || 'Error saving contract', 'error');
            }
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        } finally {
            setContractSubmitting(false);
        }
    };

    const confirmDeleteContract = (contract) => {
        setDeletingContract(contract);
        setConfirmOpen(true);
    };

    const handleDeleteContract = async () => {
        if (!deletingContract) return;
        try {
            const res = await fetch(`${API_BASE}/api/employees/${id}/contracts/${deletingContract.id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            const json = await res.json();
            if (json.success) {
                addToast('Contract deleted!');
                fetchEmployee();
            } else {
                addToast(json.message || 'Error deleting', 'error');
            }
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        } finally {
            setConfirmOpen(false);
            setDeletingContract(null);
        }
    };

    /* ── Helpers ── */
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
    const fmtMoney = (v) => v != null ? Number(v).toLocaleString('en-US') + ' ₫' : '—';
    const genderLabel = (g) => g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : 'Other';

    /* ── LOADING ── */
    if (loading) {
        return (
            <>
                <Topbar section="Human Resources" breadcrumb="Employee Detail" title="Loading..." />
                <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                    <div className="spinner" style={{ width: 32, height: 32 }} />
                </div>
            </>
        );
    }

    /* ── NOT FOUND ── */
    if (!employee) {
        return (
            <>
                <Topbar section="Human Resources" breadcrumb="Employee Detail" title="Not Found" />
                <div className="page-content" style={{ textAlign: 'center', paddingTop: 100 }}>
                    <User size={60} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <h3 style={{ color: 'var(--text-primary)' }}>Employee Not Found</h3>
                    <button className="btn btn-primary" onClick={() => navigate('/employees')} style={{ marginTop: 16 }}>
                        <ArrowLeft size={14} style={{ marginRight: 6 }} /> Back to Employees
                    </button>
                </div>
            </>
        );
    }

    /* ── Data prep ── */
    const contracts = employee.contracts || [];
    const payrolls = employee.payrolls || [];
    const currentContract = contracts.find(c => c.is_current);
    const visibleContracts = showAllContracts ? contracts : contracts.slice(0, 3);

    const payrollsByYear = {};
    payrolls.forEach(p => {
        if (!payrollsByYear[p.year]) payrollsByYear[p.year] = [];
        payrollsByYear[p.year].push(p);
    });
    const sortedYears = Object.keys(payrollsByYear).sort((a, b) => b - a);

    return (
        <>
            <Topbar
                section="Human Resources" breadcrumb="Employee Detail"
                title={employee.name}
                onRefresh={fetchEmployee} loading={loading}
            />
            <div className="page-content">
                {/* Back button */}
                <button
                    className="btn btn-ghost"
                    onClick={() => navigate('/employees')}
                    style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
                >
                    <ArrowLeft size={16} /> Back to Employees
                </button>

                {/* ── HERO SECTION ── */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,.08) 0%, rgba(6,182,212,.05) 100%)',
                    border: '1px solid var(--border-color)', borderRadius: 16,
                    padding: '28px 32px', marginBottom: 24,
                    display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
                }}>
                    {/* Avatar */}
                    <div style={{
                        width: 80, height: 80, borderRadius: 16,
                        background: employee.status === 'active'
                            ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                            : 'linear-gradient(135deg, #64748b, #475569)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, fontWeight: 800, color: '#fff', flexShrink: 0,
                        boxShadow: '0 8px 24px rgba(99,102,241,.3)',
                    }}>
                        {employee.name ? employee.name.split(' ').pop()[0]?.toUpperCase() : 'N'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{employee.name}</h2>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                background: employee.status === 'active' ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)',
                                color: employee.status === 'active' ? '#34d399' : '#f87171',
                            }}>
                                {employee.status === 'active' ? <><CheckCircle size={12} /> Active</> : <><XCircle size={12} /> Resigned</>}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                            {employee.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={13} /> {employee.phone}</span>}
                            {employee.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={13} /> {employee.email}</span>}
                            {employee.hometown && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {employee.hometown}</span>}
                        </div>
                        {currentContract && (
                            <div style={{ marginTop: 10, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                    Contract: <strong style={{ color: '#34d399' }}>{currentContract.type === 'official' ? 'Official' : 'Probation'}</strong>
                                </span>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                    Salary: <strong style={{ color: 'var(--text-accent)' }}>{fmtMoney(currentContract.salary)}</strong>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* QR Code */}
                    {employee.qr_code && (
                        <div style={{
                            width: 90, height: 90, borderRadius: 12, overflow: 'hidden',
                            border: '2px solid var(--border-color)', flexShrink: 0,
                            background: '#fff',
                        }}>
                            <img src={employee.qr_code} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    )}
                </div>

                {/* ── MAIN GRID ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
                    {/* LEFT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Personal Info Card */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '20px 24px' }}>
                            <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <User size={16} style={{ color: 'var(--primary-light)' }} /> Personal Info
                            </h4>
                            <InfoRow icon={User} label="Full Name" value={employee.name} />
                            <InfoRow icon={User} label="Gender" value={genderLabel(employee.gender)} />
                            <InfoRow icon={Calendar} label="Date of Birth" value={fmtDate(employee.date_of_birth)} />
                            <InfoRow icon={FileText} label="ID Card (CCCD)" value={employee.cccd} />
                            <InfoRow icon={MapPin} label="Hometown" value={employee.hometown} />
                            <InfoRow icon={Phone} label="Phone" value={employee.phone} />
                            <InfoRow icon={Mail} label="Email" value={employee.email} />
                            <InfoRow icon={CheckCircle} label="Status" value={employee.status === 'active' ? 'Active' : 'Resigned'} accent={employee.status === 'active'} />
                        </div>

                        {/* Banking & Insurance Card */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '20px 24px' }}>
                            <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CreditCard size={16} style={{ color: 'var(--primary-light)' }} /> Banking & Insurance
                            </h4>
                            <InfoRow icon={CreditCard} label="Bank Account" value={employee.bank_code} />
                            <InfoRow icon={CreditCard} label="Bank Name" value={employee.bank_name} />
                            {employee.qr_code && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99,102,241,.1)', flexShrink: 0 }}>
                                        <CreditCard size={15} style={{ color: 'var(--primary-light)' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 600 }}>Bank QR Code</div>
                                        <div style={{ marginTop: 6, width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                            <img src={employee.qr_code} alt="QR Component" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <InfoRow icon={Shield} label="Insurance" value={employee.has_insurance ? `Yes — ${employee.insurance_number || 'No number'}` : 'No'} accent={employee.has_insurance} />
                            <InfoRow icon={Calendar} label="Start Date" value={fmtDate(employee.start_date)} />
                            <InfoRow icon={Calendar} label="End Date" value={fmtDate(employee.end_date)} />
                            {employee.note && <InfoRow icon={FileText} label="Note" value={employee.note} />}
                        </div>

                        {/* ── Contracts Card ── */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '20px 24px' }}>
                            <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Briefcase size={16} style={{ color: 'var(--primary-light)' }} /> Contracts
                                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{contracts.length} total</span>
                                <button className="btn btn-primary" onClick={openCreateContract} style={{ padding: '5px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Plus size={13} /> New
                                </button>
                            </h4>
                            {contracts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                                    No contracts yet. Click <strong>+ New</strong> to create one.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {visibleContracts.map(c => (
                                        <ContractCard key={c.id} contract={c} isCurrent={c.is_current} onEdit={openEditContract} onDelete={confirmDeleteContract} />
                                    ))}
                                    {contracts.length > 3 && (
                                        <button
                                            className="btn btn-ghost"
                                            onClick={() => setShowAllContracts(!showAllContracts)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}
                                        >
                                            {showAllContracts ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show All ({contracts.length})</>}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN — Payrolls */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '20px 24px' }}>
                        <h4 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <DollarSign size={16} style={{ color: 'var(--primary-light)' }} /> Payroll History
                            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{payrolls.length} records</span>
                        </h4>

                        {payrolls.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                <DollarSign size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                                <h4 style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 4px' }}>No payroll records</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No payrolls have been created for this employee yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {sortedYears.map(year => (
                                    <div key={year}>
                                        {/* Year header */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                                            padding: '8px 14px', borderRadius: 10,
                                            background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.12)',
                                        }}>
                                            <Calendar size={14} style={{ color: 'var(--primary-light)' }} />
                                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Year {year}</span>
                                            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                                                {payrollsByYear[year].length} month{payrollsByYear[year].length > 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {/* Month rows */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {payrollsByYear[year]
                                                .sort((a, b) => b.month - a.month)
                                                .map(p => (
                                                    <div key={p.id} style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '80px 1fr 1fr 1fr 1fr auto',
                                                        gap: 8, alignItems: 'center',
                                                        padding: '14px 16px', borderRadius: 10,
                                                        background: 'var(--bg-table-row)',
                                                        border: '1px solid var(--border-color)',
                                                        transition: 'background .15s',
                                                    }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-table-row-hover)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-table-row)'}
                                                    >
                                                        <div style={{
                                                            background: 'rgba(99,102,241,.12)',
                                                            color: 'var(--text-accent)', fontWeight: 700, fontSize: 13,
                                                            padding: '6px 0', borderRadius: 8, textAlign: 'center',
                                                        }}>
                                                            Thg {p.month}
                                                        </div>

                                                        <div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Work Days</div>
                                                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{p.work_days}</div>
                                                        </div>

                                                        <div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Leave</div>
                                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                                {Number(p.paid_leave_days) > 0 && <span style={{ color: '#34d399' }}>+{p.paid_leave_days}p </span>}
                                                                {Number(p.unpaid_leave_days) > 0 && <span style={{ color: '#fbbf24' }}>-{p.unpaid_leave_days}u</span>}
                                                                {Number(p.paid_leave_days) === 0 && Number(p.unpaid_leave_days) === 0 && '—'}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Adj.</div>
                                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                                                {Number(p.bonus) > 0 && <span style={{ color: '#34d399' }}>+{fmtMoney(p.bonus)} </span>}
                                                                {Number(p.penalty) > 0 && <span style={{ color: '#f87171' }}>-{fmtMoney(p.penalty)} </span>}
                                                                {Number(p.insurance_deduction) > 0 && <span style={{ color: '#fbbf24' }}>-{fmtMoney(p.insurance_deduction)}</span>}
                                                                {Number(p.bonus) === 0 && Number(p.penalty) === 0 && Number(p.insurance_deduction) === 0 && '—'}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Net Salary</div>
                                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtMoney(p.net_salary)}</div>
                                                        </div>

                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                                            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                                            background: p.payment_status === 'completed' ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)',
                                                            color: p.payment_status === 'completed' ? '#34d399' : '#fbbf24',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {p.payment_status === 'completed' ? <><CheckCircle size={11} /> Paid</> : <><Clock size={11} /> Pending</>}
                                                        </span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Summary */}
                        {payrolls.length > 0 && (
                            <div style={{
                                marginTop: 20, padding: '16px 20px', borderRadius: 12,
                                background: 'linear-gradient(135deg, rgba(99,102,241,.08), rgba(6,182,212,.05))',
                                border: '1px solid rgba(99,102,241,.15)',
                                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Earned</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-accent)' }}>
                                        {fmtMoney(payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0))}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Insurance</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>
                                        {fmtMoney(payrolls.reduce((sum, p) => sum + Number(p.insurance_deduction || 0), 0))}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Paid / Total</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#34d399' }}>
                                        {payrolls.filter(p => p.payment_status === 'completed').length} / {payrolls.length}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ContractFormModal
                isOpen={contractModalOpen}
                onClose={() => setContractModalOpen(false)}
                onSubmit={handleContractSubmit}
                formData={contractForm}
                onChange={handleContractFormChange}
                title={contractModalMode === 'create' ? 'New Contract' : 'Edit Contract'}
                submitting={contractSubmitting}
            />
            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setDeletingContract(null); }}
                onConfirm={handleDeleteContract}
                title="Delete Contract"
                message={`Are you sure you want to delete this ${deletingContract?.type || ''} contract? This action cannot be undone.`}
            />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
}
