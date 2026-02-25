import { Users, DollarSign, Clock, Banknote } from 'lucide-react';

function formatMoney(value) {
    if (value == null) return '$0.00';
    return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function StatsCards({ summary }) {
    const cards = [
        {
            label: 'Total Profiles',
            value: summary?.total_profiles ?? 0,
            icon: Users,
            color: 'purple',
            sub: 'All active payment profiles',
            isMoney: false,
        },
        {
            label: 'Net Earning',
            value: summary?.total_net_earning ?? 0,
            icon: DollarSign,
            color: 'green',
            sub: 'Total across all profiles',
            isMoney: true,
        },
        {
            label: 'On Hold',
            value: summary?.total_on_hold ?? 0,
            icon: Clock,
            color: 'amber',
            sub: 'Pending release',
            isMoney: true,
        },
        {
            label: 'Total Paid',
            value: summary?.total_paid ?? 0,
            icon: Banknote,
            color: 'cyan',
            sub: 'Successfully paid out',
            isMoney: true,
        },
    ];

    return (
        <div className="stats-grid">
            {cards.map((card) => (
                <div className="stat-card" key={card.label}>
                    <div className="stat-card-header">
                        <div className={`stat-card-icon ${card.color}`}>
                            <card.icon size={20} />
                        </div>
                        <span className="stat-card-label">{card.label}</span>
                    </div>
                    <div className="stat-card-value">
                        {card.isMoney ? formatMoney(card.value) : card.value}
                    </div>
                    <div className="stat-card-sub">{card.sub}</div>
                </div>
            ))}
        </div>
    );
}
