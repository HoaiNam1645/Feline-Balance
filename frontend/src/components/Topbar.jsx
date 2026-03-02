import { Bell, RefreshCw, Menu } from 'lucide-react';

export default function Topbar({ section = 'Finance', title = 'Payment Profiles', breadcrumb = 'Payment Profiles', onRefresh, loading, actions, onMenuClick }) {
    return (
        <div className="topbar">
            <div className="topbar-left">
                {/* Hamburger — hidden on desktop via CSS */}
                <button
                    className="topbar-btn hamburger-btn"
                    style={{ display: 'none' }}
                    onClick={onMenuClick}
                    title="Menu"
                    aria-label="Open sidebar"
                >
                    <Menu size={18} />
                </button>
                <div>
                    <div className="topbar-breadcrumb">
                        <span>{section}</span> / <span style={{ color: 'var(--text-accent)' }}>{breadcrumb}</span>
                    </div>
                    <h2>{title}</h2>
                </div>
            </div>
            <div className="topbar-right">
                {actions && (
                    <div style={{ display: 'flex', gap: '8px', marginRight: '16px', alignItems: 'center' }}>
                        {actions}
                    </div>
                )}
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
