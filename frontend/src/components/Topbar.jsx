import { Bell, RefreshCw } from 'lucide-react';

export default function Topbar({ title = 'Payment Profiles', breadcrumb = 'Payment Profiles', onRefresh, loading }) {
    return (
        <div className="topbar">
            <div className="topbar-left">
                <div>
                    <div className="topbar-breadcrumb">
                        <span>Finance</span> / <span style={{ color: 'var(--text-accent)' }}>{breadcrumb}</span>
                    </div>
                    <h2>{title}</h2>
                </div>
            </div>
            <div className="topbar-right">
                <button className="topbar-btn" title="Refresh" onClick={onRefresh} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                </button>
                <button className="topbar-btn" title="Notifications">
                    <Bell size={16} />
                </button>
            </div>
        </div>
    );
}
