import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DollarSign, Plus, Pencil, Trash2, X, Search, CheckCircle, Clock, Zap, Calculator } from 'lucide-react';
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

/* ── Payroll Form Modal ── */
function PayrollFormModal({ isOpen, onClose, onSubmit, formData, onChange, title, submitLabel, submitting, employees }) {
    if (!isOpen) return null;

    // Find selected employee and their contracts
    const selectedEmp = employees.find(e => e.id == formData.employee_id);
    const contracts = selectedEmp?.contracts || [];

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12,
                width: 600, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,.5)', animation: 'slideInUp .25s ease-out',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSubmit(); }} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Employee & Contract */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Employee *</label>
                            <select className="filter-input" name="employee_id" value={formData.employee_id} onChange={onChange} required style={{ width: '100%' }}>
                                <option value="" disabled>Select employee</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="modal-label">Contract *</label>
                            <select className="filter-input" name="contract_id" value={formData.contract_id} onChange={onChange} required style={{ width: '100%' }}>
                                <option value="" disabled>Select contract</option>
                                {contracts.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.type === 'official' ? 'Official' : 'Probation'} — {Number(c.salary).toLocaleString('en-US')} VND
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Month & Year */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Month *</label>
                            <select className="filter-input" name="month" value={formData.month} onChange={onChange} required style={{ width: '100%' }}>
                                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Month {i + 1}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="modal-label">Year *</label>
                            <input className="filter-input" name="year" type="number" min="2020" max="2099" value={formData.year} onChange={onChange} required style={{ width: '100%' }} />
                        </div>
                    </div>
                    {/* Work days & Leave */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Work Days *</label>
                            <input className="filter-input" name="work_days" type="number" step="0.5" min="0" max="31" value={formData.work_days} onChange={onChange} required style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label className="modal-label">Paid Leave</label>
                            <input className="filter-input" name="paid_leave_days" type="number" step="0.5" min="0" max="31" value={formData.paid_leave_days} onChange={onChange} style={{ width: '100%' }} />
                        </div>
                    </div>
                    {/* Unpaid Leave & Bonus */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Unpaid Leave</label>
                            <input className="filter-input" name="unpaid_leave_days" type="number" step="0.5" min="0" max="31" value={formData.unpaid_leave_days} onChange={onChange} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label className="modal-label">Bonus (Optional)</label>
                            <input className="filter-input" name="bonus" type="number" min="0" value={formData.bonus} onChange={onChange} style={{ width: '100%' }} />
                        </div>
                    </div>
                    {/* Penalty & Status */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="modal-label">Penalty (Optional)</label>
                            <input className="filter-input" name="penalty" type="number" min="0" value={formData.penalty} onChange={onChange} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label className="modal-label">Payment Status</label>
                            <select className="filter-input" name="payment_status" value={formData.payment_status} onChange={onChange} style={{ width: '100%' }}>
                                <option value="pending">Pending</option>
                                <option value="completed">Paid</option>
                            </select>
                        </div>
                    </div>
                    {/* Note */}
                    <div>
                        <label className="modal-label">Note</label>
                        <input className="filter-input" name="note" value={formData.note} onChange={onChange} style={{ width: '100%' }} />
                    </div>
                    {/* Info */}
                    <div style={{ background: 'rgba(99,102,241,.08)', padding: '12px 16px', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <Calculator size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                        Insurance and Net Salary will be <strong>automatically calculated</strong> when saved.
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

const emptyPayrollForm = { employee_id: '', contract_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), work_days: 27, paid_leave_days: 0, unpaid_leave_days: 0, bonus: 0, penalty: 0, payment_status: 'pending', note: '' };

/* ── Main Page ── */
export default function PayrollsPage() {
    const [payrolls, setPayrolls] = useState([]);
    const [summary, setSummary] = useState({});
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

    const filterMonth = searchParams.has('month') ? Number(searchParams.get('month')) : new Date().getMonth() + 1;
    const setFilterMonth = (v) => updateParam('month', v);

    const filterYear = searchParams.has('year') ? Number(searchParams.get('year')) : new Date().getFullYear();
    const setFilterYear = (v) => updateParam('year', v);

    const filterStatus = searchParams.get('status') || '';
    const setFilterStatus = (v) => updateParam('status', v);

    const filterEmployeeId = searchParams.get('employee_id') || '';
    const setFilterEmployeeId = (v) => updateParam('employee_id', v);

    const [totalPages, setTotalPages] = useState(1);
    const [filterMinSalary, setFilterMinSalary] = useState('');
    const [filterMaxSalary, setFilterMaxSalary] = useState('');
    const [filterWorkDays, setFilterWorkDays] = useState('');
    const [filterPaidLeaveDays, setFilterPaidLeaveDays] = useState('');
    const [filterUnpaidLeaveDays, setFilterUnpaidLeaveDays] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ ...emptyPayrollForm });
    const [submitting, setSubmitting] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [showFormula, setShowFormula] = useState(false);

    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((msg, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message: msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);
    const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, per_page: 20, month: filterMonth, year: filterYear });
            if (filterStatus) params.append('payment_status', filterStatus);
            if (filterEmployeeId) params.append('employee_id', filterEmployeeId);
            if (filterMinSalary) params.append('min_salary', filterMinSalary);
            if (filterMaxSalary) params.append('max_salary', filterMaxSalary);
            if (filterWorkDays) params.append('work_days', filterWorkDays);
            if (filterPaidLeaveDays) params.append('paid_leave_days', filterPaidLeaveDays);
            if (filterUnpaidLeaveDays) params.append('unpaid_leave_days', filterUnpaidLeaveDays);
            const res = await fetch(`${API_BASE}/api/payrolls?${params}`);
            const json = await res.json();
            if (json.success && json.data) {
                setPayrolls(json.data.payrolls.data || []);
                setTotalPages(json.data.payrolls.last_page || 1);
                setSummary(json.data.summary || {});
            }
        } catch (err) { addToast('Error loading payrolls: ' + err.message, 'error'); }
        finally { setLoading(false); }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/employees?per_page=200&status=active`);
            const json = await res.json();
            if (json.success) {
                // For each employee, fetch contracts
                const emps = json.data.data || [];
                const withContracts = await Promise.all(emps.map(async (emp) => {
                    try {
                        const cRes = await fetch(`${API_BASE}/api/employees/${emp.id}/contracts`);
                        const cJson = await cRes.json();
                        return { ...emp, contracts: cJson.success ? cJson.data : [] };
                    } catch { return { ...emp, contracts: [] }; }
                }));
                setEmployees(withContracts);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchPayrolls(); }, [page, filterMonth, filterYear, filterStatus, filterEmployeeId]);
    useEffect(() => { fetchEmployees(); }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setModalMode('create');
        setFormData({ ...emptyPayrollForm });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEditModal = (p) => {
        setModalMode('edit');
        setEditingId(p.id);
        setFormData({
            employee_id: p.employee_id, contract_id: p.contract_id,
            month: p.month, year: p.year, work_days: p.work_days,
            paid_leave_days: p.paid_leave_days, unpaid_leave_days: p.unpaid_leave_days,
            bonus: p.bonus, penalty: p.penalty, payment_status: p.payment_status, note: p.note || '',
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const isEdit = modalMode === 'edit';
            const url = isEdit ? `${API_BASE}/api/payrolls/${editingId}` : `${API_BASE}/api/payrolls`;
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(formData),
            });
            const json = await res.json();
            if (json.success) {
                addToast(isEdit ? 'Payroll updated successfully!' : 'Payroll created successfully!');
                setModalOpen(false);
                fetchPayrolls();
            } else addToast(json.message || 'Error!', 'error');
        } catch (err) { addToast('Error: ' + err.message, 'error'); }
        finally { setSubmitting(false); }
    };

    const confirmDelete = (id) => { setDeletingId(id); setConfirmOpen(true); };
    const handleDelete = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/payrolls/${deletingId}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) { addToast('Payroll deleted!'); fetchPayrolls(); }
            else addToast(json.message || 'Error!', 'error');
        } catch (err) { addToast('Error: ' + err.message, 'error'); }
        finally { setConfirmOpen(false); setDeletingId(null); }
    };

    const fmtMoney = (v) => v != null ? Number(v).toLocaleString('en-US') + ' VND' : '—';

    return (
        <>
            <Topbar
                section="Human Resources" breadcrumb="Payroll" title="Payroll"
                onRefresh={fetchPayrolls} loading={loading}
            />
            <div className="page-content">
                {/* Stats */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
                    <div className="stat-card">
                        <div className="stat-card-header"><div className="stat-card-icon blue"><DollarSign size={20} /></div><span className="stat-card-label">Total Salary</span></div>
                        <div className="stat-card-value" style={{ fontSize: 20 }}>{fmtMoney(summary.total_net_salary)}</div>
                        <div className="stat-card-sub">Month {filterMonth}/{filterYear}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header"><div className="stat-card-icon green"><CheckCircle size={20} /></div><span className="stat-card-label">Paid</span></div>
                        <div className="stat-card-value">{summary.completed_count || 0}</div>
                        <div className="stat-card-sub">Employees</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header"><div className="stat-card-icon yellow"><Clock size={20} /></div><span className="stat-card-label">Pending</span></div>
                        <div className="stat-card-value">{summary.pending_count || 0}</div>
                        <div className="stat-card-sub">Employees</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header"><div className="stat-card-icon purple"><DollarSign size={20} /></div><span className="stat-card-label">Insurance</span></div>
                        <div className="stat-card-value" style={{ fontSize: 20 }}>{fmtMoney(summary.total_insurance)}</div>
                        <div className="stat-card-sub">Total deductions</div>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    <div className="filters-bar" style={{ marginBottom: 0 }}>
                        <div className="filter-group">
                            <select className="filter-select" value={filterEmployeeId} onChange={e => { setFilterEmployeeId(e.target.value); setPage(1); }} style={{ width: 170 }}>
                                <option value="">All employees</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <select className="filter-select year-select" value={filterMonth} onChange={e => {
                                const v = Number(e.target.value);
                                setSearchParams(prev => {
                                    prev.set('month', String(v));
                                    prev.delete('page');
                                    return prev;
                                }, { replace: true });
                            }} style={{ width: 130 }}>
                                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Month {i + 1}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <input className="filter-input" type="number" min="2020" max="2099" value={filterYear} onChange={e => {
                                const v = Number(e.target.value);
                                setSearchParams(prev => {
                                    prev.set('year', String(v));
                                    prev.delete('page');
                                    return prev;
                                }, { replace: true });
                            }} style={{ width: 100 }} />
                        </div>
                        <div className="filter-group">
                            <select className="filter-select" value={filterStatus} onChange={e => {
                                const v = e.target.value;
                                setSearchParams(prev => {
                                    if (v) prev.set('status', v); else prev.delete('status');
                                    prev.delete('page');
                                    return prev;
                                }, { replace: true });
                            }} style={{ width: 150 }}>
                                <option value="">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Paid</option>
                            </select>
                        </div>

                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                            <button className="btn btn-primary" onClick={openCreateModal}>
                                <Plus size={14} style={{ marginRight: 6 }} /> New Payroll
                            </button>
                        </div>
                    </div>

                    <div className="filters-bar" style={{ marginBottom: 0 }}>
                        <div className="filter-group">
                            <input className="filter-input" type="number" placeholder="Min Salary..." value={filterMinSalary} onChange={e => setFilterMinSalary(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPayrolls()} style={{ width: 130 }} />
                        </div>
                        <div className="filter-group">
                            <input className="filter-input" type="number" placeholder="Max Salary..." value={filterMaxSalary} onChange={e => setFilterMaxSalary(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPayrolls()} style={{ width: 130 }} />
                        </div>
                        <div className="filter-group">
                            <input className="filter-input" type="number" step="0.5" placeholder="Work Days..." value={filterWorkDays} onChange={e => setFilterWorkDays(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPayrolls()} style={{ width: 120 }} />
                        </div>
                        <div className="filter-group">
                            <input className="filter-input" type="number" step="0.5" placeholder="Paid Leave..." value={filterPaidLeaveDays} onChange={e => setFilterPaidLeaveDays(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPayrolls()} style={{ width: 120 }} />
                        </div>
                        <div className="filter-group">
                            <input className="filter-input" type="number" step="0.5" placeholder="Unpaid Leave..." value={filterUnpaidLeaveDays} onChange={e => setFilterUnpaidLeaveDays(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPayrolls()} style={{ width: 130 }} />
                        </div>
                        <div style={{ marginLeft: 'auto' }}>
                            <button className="btn btn-ghost" onClick={() => fetchPayrolls()} style={{ height: '36px', padding: '0 16px' }}>Filter</button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="table-container">
                    {loading ? (
                        <div className="table-loading"><div className="spinner" /><span>Loading...</span></div>
                    ) : payrolls.length === 0 ? (
                        <div className="table-empty">
                            <DollarSign size={60} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                            <h3>No payrolls found</h3>
                            <p>Click "New Payroll" to get started.</p>
                        </div>
                    ) : (
                        <div className="table-scroll">
                            <table className="data-table" id="payrolls-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 50 }}>#</th>
                                        <th>Employee</th>
                                        <th>Contract Type</th>
                                        <th>Work Days</th>
                                        <th>Leave</th>
                                        <th>Ins. Deduction</th>
                                        <th>Bonus/Penalty</th>
                                        <th>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                Net Salary
                                                <button
                                                    onClick={() => setShowFormula(true)}
                                                    style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4 }}
                                                    title="View Calculation Formula"
                                                >
                                                    <Calculator size={16} />
                                                </button>
                                            </div>
                                        </th>
                                        <th>Status</th>
                                        <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payrolls.map((p, idx) => (
                                        <tr key={p.id}>
                                            <td><span style={{ color: 'var(--text-muted)' }}>{(page - 1) * 20 + idx + 1}</span></td>
                                            <td><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.employee?.name || '—'}</span></td>
                                            <td>
                                                <span style={{
                                                    padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                                    background: p.contract?.type === 'official' ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)',
                                                    color: p.contract?.type === 'official' ? '#34d399' : '#fbbf24',
                                                }}>
                                                    {p.contract?.type === 'official' ? 'Official' : 'Probation'}
                                                </span>
                                            </td>
                                            <td><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.work_days}</span></td>
                                            <td><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{Number(p.paid_leave_days) > 0 ? p.paid_leave_days : '—'}</span></td>
                                            <td><span style={{ color: '#f87171', fontSize: 13 }}>{Number(p.insurance_deduction) > 0 ? '-' + fmtMoney(p.insurance_deduction) : '—'}</span></td>
                                            <td>
                                                <div style={{ fontSize: 13 }}>
                                                    {Number(p.bonus) > 0 && <span style={{ color: '#34d399' }}>+{fmtMoney(p.bonus)}</span>}
                                                    {Number(p.bonus) > 0 && Number(p.penalty) > 0 && ' / '}
                                                    {Number(p.penalty) > 0 && <span style={{ color: '#f87171' }}>-{fmtMoney(p.penalty)}</span>}
                                                    {Number(p.bonus) === 0 && Number(p.penalty) === 0 && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                                </div>
                                            </td>
                                            <td><span style={{ fontWeight: 700, color: '#6366f1', fontSize: 14 }}>{fmtMoney(p.net_salary)}</span></td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                                    background: p.payment_status === 'completed' ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)',
                                                    color: p.payment_status === 'completed' ? '#34d399' : '#fbbf24',
                                                }}>
                                                    {p.payment_status === 'completed' ? <><CheckCircle size={12} /> Paid</> : <><Clock size={12} /> Pending</>}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={() => openEditModal(p)} title="Edit"><Pencil size={14} /></button>
                                                    <button className="btn btn-ghost" style={{ padding: '6px 8px', color: 'var(--danger)' }} onClick={() => confirmDelete(p.id)} title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                        <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '8px 16px' }}>Previous</button>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
                        <button className="btn btn-ghost" disabled={page === totalPages} onClick={() => setPage(page + 1)} style={{ padding: '8px 16px' }}>Next</button>
                    </div>
                )}
            </div >

            <PayrollFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} formData={formData} onChange={handleFormChange} title={modalMode === 'create' ? 'New Payroll' : 'Update Payroll'} submitLabel={modalMode === 'create' ? 'Create' : 'Update'} submitting={submitting} employees={employees} />

            {/* Formula Modal */}
            {showFormula && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowFormula(false)}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, width: 500, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,.5)', animation: 'slideInUp .25s ease-out' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Calculator size={18} /> Cách tính lương
                            </h3>
                            <button onClick={() => setShowFormula(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
                                <strong style={{ display: 'block', marginBottom: 6, color: 'var(--primary)', fontSize: 13 }}>1. Khấu trừ Bảo hiểm (BHXH):</strong>
                                <code style={{ fontSize: 14, color: 'var(--text-primary)' }}>Lương hợp đồng × 10.5%</code>
                                <small style={{ display: 'block', marginTop: 4, color: 'var(--text-muted)' }}>(Chỉ áp dụng nếu nhân viên có đóng bảo hiểm)</small>
                            </div>

                            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                                <strong style={{ display: 'block', marginBottom: 6, color: '#10b981', fontSize: 13 }}>2. Lương theo ngày công:</strong>
                                <code style={{ fontSize: 14, color: 'var(--text-primary)' }}>(Lương HĐ ÷ Ngày công chuẩn) × (Ngày đi làm + Phép có lương)</code>
                                <small style={{ display: 'block', marginTop: 4, color: 'var(--text-muted)' }}>(Ngày công chuẩn mặc định là 27 nếu không thiết lập khác)</small>
                            </div>

                            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}>
                                <strong style={{ display: 'block', marginBottom: 6, color: '#f59e0b', fontSize: 13 }}>3. Lương thực nhận (Net):</strong>
                                <code style={{ fontSize: 14, color: 'var(--text-primary)' }}>Lương theo ngày công − BHXH + Thưởng − Phạt</code>
                            </div>
                        </div>
                        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={() => setShowFormula(false)} style={{ padding: '8px 24px' }}>Đã hiểu</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Confirm Delete" message="Are you sure you want to delete this payroll?" />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
}
