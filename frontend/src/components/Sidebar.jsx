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
            { icon: LayoutDashboard, label: 'Dashboard', active: false },
            { icon: Wallet, label: 'Payment Profiles', active: true, badge: null },
            { icon: TrendingUp, label: 'Analytics', active: false },
        ],
    },
    {
        title: 'Finance',
        items: [
            { icon: ArrowRightLeft, label: 'Transactions', active: false },
            { icon: CreditCard, label: 'Settlements', active: false },
            { icon: FileText, label: 'Reports', active: false },
        ],
    },
    {
        title: 'Management',
        items: [
            { icon: Users, label: 'Teams', active: false },
            { icon: Shield, label: 'Permissions', active: false },
            { icon: Settings, label: 'Settings', active: false },
            { icon: HelpCircle, label: 'Help & Support', active: false },
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
                            <div
                                key={item.label}
                                className={`sidebar-item ${item.active ? 'active' : ''}`}
                            >
                                <item.icon className="sidebar-item-icon" size={18} />
                                <span>{item.label}</span>
                                {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                            </div>
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
