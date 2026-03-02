import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Plus, Pencil, Trash2, X, Search, CheckCircle, XCircle, FileText, Eye, Shield } from 'lucide-react';
import Topbar from '../components/Topbar';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
                    <X size={14} style={{ opacity: .7 }} />
                </div>
            ))}
        </div>
    );
}

/* ── Confirm ── */
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

/* ── Employee Form Modal ── */
function EmployeeFormModal({ isOpen, onClose, onSubmit, formData, onChange, title, submitLabel, submitting, onUploadQr, uploadingQr }) {
    if (!isOpen) return null;
    const genderOptions = [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
    ];
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12,
                width: 640, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,.5)', animation: 'slideInUp .25s ease-out',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4 }}><X size={18} /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSubmit(); }} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Row 1 - Name & Gender */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Full Name *</label>
                            <input className="filter-input" name="name" value={formData.name} onChange={onChange} required style={{ width: '100%' }} placeholder="e.g. John Doe" />
                        </div>
                        <div>
                            <label className="modal-label">Gender</label>
                            <select className="filter-input" name="gender" value={formData.gender} onChange={onChange} style={{ width: '100%' }}>
                                {genderOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                            </select>
                        </div>
                    </div>
                    {/* Row 2 - DOB & ID Card */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Date of Birth</label>
                            <input className="filter-input" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={onChange} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label className="modal-label">ID Card (Optional)</label>
                            <input className="filter-input" name="cccd" value={formData.cccd} onChange={onChange} style={{ width: '100%' }} placeholder="ID Number" />
                        </div>
                    </div>
                    {/* Row 3 - Email & Phone */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Email</label>
                            <input className="filter-input" name="email" type="email" value={formData.email} onChange={onChange} style={{ width: '100%' }} placeholder="email@example.com" />
                        </div>
                        <div>
                            <label className="modal-label">Phone</label>
                            <input className="filter-input" name="phone" value={formData.phone} onChange={onChange} style={{ width: '100%' }} placeholder="0901234567" />
                        </div>
                    </div>
                    {/* Row 4 - Hometown */}
                    <div>
                        <label className="modal-label">Hometown</label>
                        <input className="filter-input" name="hometown" value={formData.hometown} onChange={onChange} style={{ width: '100%' }} placeholder="e.g. Hanoi, Vietnam" />
                    </div>
                    {/* Row 5 - Bank */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Bank Account</label>
                            <input className="filter-input" name="bank_code" value={formData.bank_code} onChange={onChange} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label className="modal-label">Bank Name</label>
                            <input className="filter-input" name="bank_name" value={formData.bank_name} onChange={onChange} style={{ width: '100%' }} placeholder="e.g. Vietcombank" />
                        </div>
                    </div>
                    {/* Row 5.5 - QR Code */}
                    <div style={{ padding: '4px 0' }}>
                        <label className="modal-label">Bank QR Code</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            {formData.qr_code && (
                                <img src={formData.qr_code} alt="QR Code" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                            )}
                            <div>
                                <label className="btn btn-ghost" style={{ cursor: 'pointer', padding: '8px 16px', display: 'inline-flex', pointerEvents: uploadingQr ? 'none' : 'auto', opacity: uploadingQr ? 0.7 : 1 }}>
                                    {uploadingQr ? 'Uploading...' : formData.qr_code ? 'Change Image' : 'Upload Image'}
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onUploadQr} disabled={uploadingQr} />
                                </label>
                                {formData.qr_code && (
                                    <button type="button" className="btn btn-ghost" style={{ color: '#ef4444', marginLeft: 8 }} onClick={() => onChange({ target: { name: 'qr_code', value: '' } })}>
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Row 6 - Start & End date */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Start Date</label>
                            <input className="filter-input" name="start_date" type="date" value={formData.start_date} onChange={onChange} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label className="modal-label">Resigned Date</label>
                            <input className="filter-input" name="end_date" type="date" value={formData.end_date} onChange={onChange} style={{ width: '100%' }} />
                        </div>
                    </div>
                    {/* Row 7 - Status & Insurance */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Status</label>
                            <select className="filter-input" name="status" value={formData.status} onChange={onChange} style={{ width: '100%' }}>
                                <option value="active">Active</option>
                                <option value="resigned">Resigned</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="checkbox" name="has_insurance" checked={formData.has_insurance} onChange={e => onChange({ target: { name: 'has_insurance', value: e.target.checked } })} style={{ width: 16, height: 16, accentColor: '#6366f1' }} />
                                <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>Has Insurance</span>
                            </label>
                        </div>
                        {formData.has_insurance && (
                            <div>
                                <label className="modal-label">Insurance Number</label>
                                <input className="filter-input" name="insurance_number" value={formData.insurance_number} onChange={onChange} style={{ width: '100%' }} placeholder="e.g. 123456789" />
                            </div>
                        )}
                    </div>
                    {/* Contracts Array */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <label className="modal-label" style={{ margin: 0 }}>Contracts</label>
                            <button type="button" className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => {
                                const newContract = { type: 'probation', salary: '', standard_work_days: 27, start_date: formData.start_date || new Date().toISOString().substring(0, 10), end_date: '', is_current: formData.contracts?.length === 0 };
                                onChange({ target: { name: 'contracts', value: [...(formData.contracts || []), newContract] } });
                            }}><Plus size={14} /> Add Contract</button>
                        </div>
                        {formData.contracts && formData.contracts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {formData.contracts.map((c, idx) => (
                                    <div key={c.id || idx} style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 8, background: 'rgba(99,102,241,.03)', position: 'relative' }}>
                                        <button type="button" onClick={() => {
                                            const newArr = [...formData.contracts];
                                            newArr.splice(idx, 1);
                                            onChange({ target: { name: 'contracts', value: newArr } });
                                        }} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={14} /></button>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12, paddingRight: 24 }}>
                                            <div>
                                                <label className="modal-label" style={{ fontSize: 11 }}>Type</label>
                                                <select className="filter-input" value={c.type} onChange={e => {
                                                    const newArr = [...formData.contracts]; newArr[idx].type = e.target.value; onChange({ target: { name: 'contracts', value: newArr } });
                                                }} style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}>
                                                    <option value="probation">Probation</option><option value="official">Official</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="modal-label" style={{ fontSize: 11 }}>Salary (VND) *</label>
                                                <input className="filter-input" type="number" required value={c.salary} onChange={e => {
                                                    const newArr = [...formData.contracts]; newArr[idx].salary = e.target.value; onChange({ target: { name: 'contracts', value: newArr } });
                                                }} style={{ width: '100%', padding: '6px 10px', fontSize: 13 }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div>
                                                <label className="modal-label" style={{ fontSize: 11 }}>Start Date *</label>
                                                <input className="filter-input" type="date" required value={c.start_date ? c.start_date.substring(0, 10) : ''} onChange={e => {
                                                    const newArr = [...formData.contracts]; newArr[idx].start_date = e.target.value; onChange({ target: { name: 'contracts', value: newArr } });
                                                }} style={{ width: '100%', padding: '6px 10px', fontSize: 13 }} />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)' }}>
                                                    <input type="checkbox" checked={c.is_current} onChange={e => {
                                                        const newArr = [...formData.contracts];
                                                        if (e.target.checked) newArr.forEach(x => x.is_current = false);
                                                        newArr[idx].is_current = e.target.checked;
                                                        onChange({ target: { name: 'contracts', value: newArr } });
                                                    }} style={{ accentColor: '#6366f1' }} /> Current
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0', border: '1px dashed var(--border-color)', borderRadius: 8, textAlign: 'center' }}>No contracts added yet.</div>
                        )}
                    </div>
                    {/* Note */}
                    <div>
                        <label className="modal-label">Note</label>
                        <textarea className="filter-input" name="note" value={formData.note} onChange={onChange} rows={2} style={{ width: '100%', resize: 'vertical' }} />
                    </div>
                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting} style={{ padding: '10px 20px' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '10px 20px' }}>{submitting ? 'Saving...' : submitLabel}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const emptyForm = { name: '', date_of_birth: '', gender: 'male', cccd: '', hometown: '', email: '', phone: '', bank_code: '', bank_name: '', qr_code: '', has_insurance: false, insurance_number: '', start_date: '', end_date: '', status: 'active', note: '', contracts: [] };

/* ── Main Page ── */
export default function EmployeesPage() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
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

    const statusFilter = searchParams.get('status') || '';
    const setStatusFilter = (v) => updateParam('status', v);

    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [nameFilter, setNameFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState('');
    const [cccdFilter, setCccdFilter] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [submitting, setSubmitting] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [toasts, setToasts] = useState([]);
    const [uploadingQr, setUploadingQr] = useState(false);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);
    const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, per_page: 15 });
            if (nameFilter) params.append('name', nameFilter);
            if (phoneFilter) params.append('phone', phoneFilter);
            if (cccdFilter) params.append('cccd', cccdFilter);
            if (statusFilter) params.append('status', statusFilter);
            const res = await fetch(`${API_BASE}/api/employees?${params}`);
            const json = await res.json();
            if (json.success) {
                setEmployees(json.data.data || []);
                setTotalPages(json.data.last_page || 1);
                setTotal(json.data.total || 0);
            }
        } catch (err) {
            addToast('Error loading employees: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEmployees(); }, [page, statusFilter]);
    useEffect(() => { setPage(1); }, [statusFilter, nameFilter, phoneFilter, cccdFilter]);

    const handleSearch = (e) => { if (e.key === 'Enter') fetchEmployees(); };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUploadQr = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingQr(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('image', file);

            // Assume we need JWT token, if so it would have to be passed if the app uses cookies or localstorage
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE}/api/employees/upload-qr`, {
                method: 'POST',
                headers,
                body: formDataUpload
            });
            const json = await res.json();
            if (json.success) {
                setFormData(prev => ({ ...prev, qr_code: json.data.url }));
                addToast('QR Code uploaded successfully!');
            } else {
                addToast(json.message || 'Upload failed', 'error');
            }
        } catch (err) {
            addToast('Upload error: ' + err.message, 'error');
        } finally {
            setUploadingQr(false);
            e.target.value = null;
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setFormData({ ...emptyForm });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEditModal = (emp) => {
        setModalMode('edit');
        setEditingId(emp.id);
        setFormData({
            name: emp.name || '', date_of_birth: emp.date_of_birth ? emp.date_of_birth.substring(0, 10) : '',
            gender: emp.gender || 'male', cccd: emp.cccd || '', hometown: emp.hometown || '',
            email: emp.email || '', phone: emp.phone || '', bank_code: emp.bank_code || '',
            bank_name: emp.bank_name || '', qr_code: emp.qr_code || '',
            has_insurance: !!emp.has_insurance, insurance_number: emp.insurance_number || '', start_date: emp.start_date ? emp.start_date.substring(0, 10) : '',
            end_date: emp.end_date ? emp.end_date.substring(0, 10) : '', status: emp.status || 'active', note: emp.note || '',
            contracts: emp.contracts ? emp.contracts.map(c => ({
                ...c,
                start_date: c.start_date ? c.start_date.substring(0, 10) : '',
                end_date: c.end_date ? c.end_date.substring(0, 10) : '',
            })) : [],
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) { addToast('Full name is required!', 'error'); return; }
        setSubmitting(true);
        try {
            const isEdit = modalMode === 'edit';
            const url = isEdit ? `${API_BASE}/api/employees/${editingId}` : `${API_BASE}/api/employees`;
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(formData),
            });
            const json = await res.json();
            if (json.success) {
                addToast(isEdit ? 'Employee updated successfully!' : 'Employee added successfully!');
                setModalOpen(false);
                fetchEmployees();
            } else {
                addToast(json.message || 'Error!', 'error');
            }
        } catch (err) {
            addToast('Error: ' + err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = (id) => { setDeletingId(id); setConfirmOpen(true); };
    const handleDelete = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/employees/${deletingId}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) { addToast('Employee deleted!'); fetchEmployees(); }
            else addToast(json.message || 'Error deleting!', 'error');
        } catch (err) { addToast('Error: ' + err.message, 'error'); }
        finally { setConfirmOpen(false); setDeletingId(null); }
    };

    const activeCount = employees.filter(e => e.status === 'active').length;
    const insuredCount = employees.filter(e => e.has_insurance).length;

    const fmt = (d) => d ? new Date(d).toLocaleDateString() : '—';
    const fmtMoney = (v) => v ? Number(v).toLocaleString('en-US') + ' VND' : '—';

    return (
        <>
            <Topbar
                section="Human Resources" breadcrumb="Employees" title="Employee Management"
                onRefresh={fetchEmployees} loading={loading}
            />
            <div className="page-content">
                {/* Stats */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
                    <div className="stat-card">
                        <div className="stat-card-header"><div className="stat-card-icon blue"><Users size={20} /></div><span className="stat-card-label">Total Employees</span></div>
                        <div className="stat-card-value">{total}</div>
                        <div className="stat-card-sub">All registered employees</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header"><div className="stat-card-icon green"><CheckCircle size={20} /></div><span className="stat-card-label">Active</span></div>
                        <div className="stat-card-value">{activeCount}</div>
                        <div className="stat-card-sub">Currently on this page</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header"><div className="stat-card-icon purple"><Shield size={20} /></div><span className="stat-card-label">Insured</span></div>
                        <div className="stat-card-value">{insuredCount}</div>
                        <div className="stat-card-sub">Has insurance registered</div>
                    </div>
                </div>

                {/* Filter bar */}
                <div className="filters-bar">
                    <div className="filter-group">
                        <Search size={15} style={{ color: 'var(--text-muted)' }} />
                        <input
                            className="filter-input"
                            placeholder="Name..."
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>
                    <div className="filter-group">
                        <input
                            className="filter-input"
                            placeholder="Phone..."
                            value={phoneFilter}
                            onChange={(e) => setPhoneFilter(e.target.value)}
                            onKeyDown={handleSearch}
                            style={{ width: '130px', minWidth: '130px' }}
                        />
                    </div>
                    <div className="filter-group">
                        <input
                            className="filter-input"
                            placeholder="ID Card (CCCD)..."
                            value={cccdFilter}
                            onChange={(e) => setCccdFilter(e.target.value)}
                            onKeyDown={handleSearch}
                            style={{ width: '150px', minWidth: '150px' }}
                        />
                    </div>
                    <div className="filter-group">
                        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '140px', minWidth: '140px' }}>
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="resigned">Resigned</option>
                        </select>
                    </div>

                    <div style={{ marginLeft: 'auto' }}>
                        <button className="btn btn-primary" onClick={openCreateModal}>
                            <Plus size={14} /> New Employee
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="table-container">
                    {loading ? (
                        <div className="table-loading"><div className="spinner" /><span>Loading...</span></div>
                    ) : employees.length === 0 ? (
                        <div className="table-empty">
                            <Users size={60} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                            <h3>No employees found</h3>
                            <p>Click "New Employee" to get started.</p>
                        </div>
                    ) : (
                        <div className="table-scroll">
                            <table className="data-table" id="employees-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 50 }}>#</th>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Contract Salary</th>
                                        <th>Insurance</th>
                                        <th>Join Date</th>
                                        <th style={{ width: 150 }}>Note</th>
                                        <th>Status</th>
                                        <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((emp, idx) => (
                                        <tr key={emp.id}>
                                            <td><span style={{ color: 'var(--text-muted)' }}>{(page - 1) * 15 + idx + 1}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: 8,
                                                        background: emp.status === 'active'
                                                            ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                                                            : 'linear-gradient(135deg, #64748b, #475569)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                                                    }}>
                                                        {emp.name ? emp.name.split(' ').pop()[0]?.toUpperCase() : 'N'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', transition: 'color .15s' }}
                                                            onClick={() => navigate(`/employees/${emp.id}`)}
                                                            onMouseEnter={e => e.target.style.color = 'var(--text-accent)'}
                                                            onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}
                                                        >{emp.name}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.email || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{emp.phone || '—'}</span></td>
                                            <td><span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{emp.current_contract ? fmtMoney(emp.current_contract.salary) : '—'}</span></td>
                                            <td>
                                                {emp.has_insurance ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'rgba(16,185,129,.12)', color: '#34d399' }}>
                                                        <CheckCircle size={12} /> Yes
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'rgba(100,116,139,.12)', color: '#94a3b8' }}>
                                                        No
                                                    </span>
                                                )}
                                            </td>
                                            <td><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmt(emp.start_date)}</span></td>
                                            <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }} title={emp.note}>{emp.note || '—'}</span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                                    background: emp.status === 'active' ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)',
                                                    color: emp.status === 'active' ? '#34d399' : '#f87171',
                                                }}>
                                                    {emp.status === 'active' ? <><CheckCircle size={12} /> Active</> : <><XCircle size={12} /> Resigned</>}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={() => navigate(`/employees/${emp.id}`)} title="View Detail"><Eye size={14} /></button>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={() => openEditModal(emp)} title="Edit"><Pencil size={14} /></button>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px', color: 'var(--danger)' }} onClick={() => confirmDelete(emp.id)} title="Delete"><Trash2 size={14} /></button>
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                        <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '8px 16px' }}>Previous</button>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
                        <button className="btn btn-ghost" disabled={page === totalPages} onClick={() => setPage(page + 1)} style={{ padding: '8px 16px' }}>Next</button>
                    </div>
                )}
            </div>

            <EmployeeFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} formData={formData} onChange={handleFormChange} title={modalMode === 'create' ? 'New Employee' : 'Update Employee'} submitLabel={modalMode === 'create' ? 'Create' : 'Update'} submitting={submitting} onUploadQr={handleUploadQr} uploadingQr={uploadingQr} />
            <ConfirmModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Confirm Delete" message="Are you sure you want to delete this employee? This action cannot be undone." />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
}
