import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    ArrowRightLeft,
    Users,
    FileText,
    Settings,
    HelpCircle,
    Bell,
    CreditCard,
    TrendingUp,
    Shield,
    BarChart3,
    Palette,
    Image as ImageIcon,
    LogOut,
    UserCheck,
    DollarSign,
    Building2,
} from 'lucide-react';

const menuSections = [
    {
        title: 'Overview',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        ],
    },
    {
        title: 'Finance',
        items: [
            { icon: Wallet, label: 'Payment Profiles', path: '/profiles' },
            { icon: ArrowRightLeft, label: 'Topup', path: '/topup' },
            { icon: CreditCard, label: 'Stores', path: '/stores' },
            { icon: ImageIcon, label: 'Cost', path: '/media' },
        ],
    },
    {
        title: 'Human Resources',
        items: [
            { icon: UserCheck, label: 'Employees', path: '/employees', roles: ['super_admin', 'admin'] },
            { icon: DollarSign, label: 'Payroll', path: '/payrolls', roles: ['super_admin', 'admin'] },
        ],
    },
    {
        title: 'Management',
        items: [
            { icon: Shield, label: 'Roles', path: '/roles', roles: ['super_admin'] },
            { icon: Users, label: 'Users', path: '/users', roles: ['super_admin'] },
            { icon: Users, label: 'Payouts', path: '/team-finances', roles: ['super_admin', 'admin'] },
            { icon: Users, label: 'Teams Felineez', path: '/teams', roles: ['super_admin'] },
            { icon: LayoutDashboard, label: 'Vendors', path: '/vendors', roles: ['super_admin'] },
            { icon: Building2, label: 'Companies', path: '/companies', roles: ['super_admin'] },
        ],
    },
    {
        title: 'Analytics',
        items: [
            { icon: Palette, label: 'Design Statistics', path: '/design-statistics' },
            { icon: BarChart3, label: 'Fulfillment Statistics', path: '/fulfillment-statistics' },
        ],
    },
];

export default function Sidebar({ user, onLogout, isOpen }) {
    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : 'AD';

    return (
        <aside className={`sidebar${isOpen ? ' open' : ''}`}>
            <div className="sidebar-logo">
                <img src="/logo.png" alt="FA Logo" className="sidebar-logo-icon" style={{ padding: 0, objectFit: 'cover' }} />
                <div className="sidebar-logo-text">
                    <h1>Feline</h1>
                    <span>Accountant</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuSections.map((section) => {
                    const filteredItems = section.items.filter(
                        (item) => !item.roles || (user?.role && item.roles.includes(user.role))
                    );

                    if (filteredItems.length === 0) return null;

                    return (
                        <div className="sidebar-section" key={section.title}>
                            <div className="sidebar-section-title">{section.title}</div>
                            {filteredItems.map((item) => (
                                <NavLink
                                    key={item.label}
                                    to={item.path}
                                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                                >
                                    <item.icon className="sidebar-item-icon" size={18} />
                                    <span>{item.label}</span>
                                    {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                                </NavLink>
                            ))}
                        </div>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
                        <div className="sidebar-user-role">{user?.role_display || user?.role || 'User'}</div>
                    </div>
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            title="Logout"
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', padding: '6px', borderRadius: '6px',
                                transition: 'all 0.2s', marginLeft: 'auto',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </aside >
    );
}
