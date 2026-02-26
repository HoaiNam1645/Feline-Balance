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
        ],
    },
    {
        title: 'Management',
        items: [
            { icon: Users, label: 'Teams', path: '/teams' },
            { icon: LayoutDashboard, label: 'Vendors', path: '/vendors' },
            // { icon: Shield, label: 'Permissions', path: '/permissions' },
            // { icon: Settings, label: 'Settings', path: '/settings' },
            // { icon: HelpCircle, label: 'Help & Support', path: '/support' },
        ],
    },
];

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">FA</div>
                <div className="sidebar-logo-text">
                    <h1>Feline</h1>
                    <span>Accountant</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuSections.map((section) => (
                    <div className="sidebar-section" key={section.title}>
                        <div className="sidebar-section-title">{section.title}</div>
                        {section.items.map((item) => (
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
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">AD</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">Admin</div>
                        <div className="sidebar-user-role">Super Admin</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
