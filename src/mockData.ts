export const DASHBOARD_STATS = {
    today: {
        bookings: 124,
        revenue: 3200,
        newUsers: 45,
        activeEvents: 12,
    },
    allTime: {
        totalUsers: 24512,
        totalPartners: 856,
        totalEvents: 3240,
        totalRevenue: 1820000,
        platformCommission: 145200,
    }
};

export const BOOKINGS_TREND = [
    { name: 'Mon', value: 120 },
    { name: 'Tue', value: 240 },
    { name: 'Wed', value: 180 },
    { name: 'Thu', value: 450 },
    { name: 'Fri', value: 320 },
    { name: 'Sat', value: 280 },
    { name: 'Sun', value: 410 },
];

export const REVENUE_BY_CATEGORY = [
    { name: 'Music', value: 72, color: '#FACC15' },
    { name: 'Tech', value: 18, color: '#FEF08A' },
    { name: 'Other', value: 10, color: '#E5E7EB' },
];

export const TOP_EVENTS = [
    { name: 'Summer Music Fest', value: 98 },
    { name: 'Tech Summit 2023', value: 84 },
    { name: 'Global Art Expo', value: 76 },
    { name: 'Gourmet Food Fair', value: 62 },
];

export const PARTNERS = [
    { id: 1, name: 'Elevate Events Co.', type: 'Event Planner', location: 'New York, NY', status: 'Pending', date: 'Oct 24, 2023' },
    { id: 2, name: 'Gourmet Catering', type: 'Catering', location: 'Chicago, IL', status: 'Pending', date: 'Oct 22, 2023' },
    { id: 3, name: 'Venue X Space', type: 'Venue', location: 'Los Angeles, CA', status: 'Rejected', date: 'Oct 20, 2023' },
];

export const EVENTS = [
    { id: 1, title: 'Summer Music Festival 2024', partner: 'Global Events Corp', date: 'Aug 15-18', ages: '18-35', location: 'London, UK', status: 'Draft', qualityScore: 92 },
    { id: 2, title: 'Neon Night Music Festival', partner: 'SoundWave Events', date: 'Oct 24, 2023', status: 'Pending', price: 1250 },
    { id: 3, title: 'Global Tech Summit 2024', partner: 'FutureCon Media', date: 'Oct 23, 2023', status: 'Pending', price: 4800 },
];

export const ADMINS = [
    { id: 1, name: 'Alex Rivera', role: 'SUPER ADMIN', status: 'Active', lastSeen: '2h ago', avatar: 'https://picsum.photos/seed/alex/100/100' },
    { id: 2, name: 'Jordan Smith', role: 'EVENT MANAGER', status: 'Active', lastSeen: '5h ago', avatar: 'https://picsum.photos/seed/jordan/100/100' },
    { id: 3, name: 'Sarah Chen', role: 'MARKETING', status: 'Active', lastSeen: '1h ago', avatar: 'https://picsum.photos/seed/sarah/100/100' },
];

export const TRANSACTIONS = [
    { id: 'BK-92041', user: 'Alex Johnson', event: 'Neon Night Music Festival', partner: 'SoundWave Events', amount: 1250, commission: 125, status: 'Completed', date: 'Oct 24, 2023', method: 'UPI' },
    { id: 'BK-92038', user: 'Michael Brown', event: 'Global Tech Summit 2024', partner: 'FutureCon Media', amount: 4800, commission: 480, status: 'Pending', date: 'Oct 23, 2023', method: 'CARD' },
    { id: 'BK-92035', user: 'Sarah Jenkins', event: 'Organic Wine Tasting', partner: 'Valley Vineyards', amount: 320, commission: 32, status: 'Failed', date: 'Oct 23, 2023', method: 'CARD' },
];

export const USERS = [
    { id: 1, name: 'Alex Johnson', email: 'alex.j@example.com', phone: '+1 (555) 012-3456', status: 'Active', role: 'Parent', bookings: 12, totalSpent: 2450, memberSince: 'Oct 12, 2023', avatar: 'https://picsum.photos/seed/user1/100/100' },
    { id: 2, name: 'Sarah Jenkins', email: 'sarah.s@org.com', phone: '+1 (555) 987-6543', status: 'Pending', role: 'Partner', bookings: 0, totalSpent: 0, memberSince: 'Nov 05, 2023', avatar: 'https://picsum.photos/seed/user2/100/100' },
    { id: 3, name: 'Michael Brown', email: 'm.brown@webmail.com', phone: '+1 (555) 456-7890', status: 'Active', role: 'Parent', bookings: 5, totalSpent: 850, memberSince: 'Sep 20, 2023', avatar: 'https://picsum.photos/seed/user3/100/100' },
];

export const SUPPORT_CHATS = [
    { id: 1, user: 'Alex Thompson', lastMessage: 'How can I reset my event pas...', time: '14:22', type: 'BOT', status: 'Active', avatar: 'https://picsum.photos/seed/support1/100/100', unread: true },
    { id: 2, user: 'Sarah Jenkins', lastMessage: 'Waiting for a human represe...', time: '14:15', type: 'PENDING', status: 'Pending', avatar: 'https://picsum.photos/seed/support2/100/100', unread: false },
    { id: 3, user: 'Michael Chen', lastMessage: 'Thank you for your help!', time: '13:50', type: 'HUMAN', status: 'Completed', avatar: 'https://picsum.photos/seed/support3/100/100', unread: false },
];

export const COUPONS = [
    { id: 1, code: 'SUMMER24', discount: 20, expiry: '2024-08-31', usageCount: 142, limit: 500 },
    { id: 2, code: 'WELCOME50', discount: 50, expiry: '2024-12-31', usageCount: 856, limit: 1000 },
    { id: 3, code: 'EARLYBIRD', discount: 15, expiry: '2024-06-15', usageCount: 42, limit: 100 },
];
