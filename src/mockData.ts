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
    { id: 1, user: 'Alex Thompson', lastMessage: 'How can I reset my event pas...', time: '14:22', type: 'BOT', status: 'Active', avatar: 'https://picsum.photos/seed/support1/100/100', unread: true, priority: 'High', category: 'Booking', ticketId: '#TKT-4401', email: 'alex.t@email.com', phone: '+91 98190 XXXXX', createdAt: '27-May-26, 02:10 PM' },
    { id: 2, user: 'Sarah Jenkins', lastMessage: 'Waiting for a human represe...', time: '14:15', type: 'PENDING', status: 'Pending', avatar: 'https://picsum.photos/seed/support2/100/100', unread: false, priority: 'Medium', category: 'Refund', ticketId: '#TKT-4398', email: 'sarah.j@org.com', phone: '+91 98200 XXXXX', createdAt: '27-May-26, 01:50 PM' },
    { id: 3, user: 'Michael Chen', lastMessage: 'Thank you for your help!', time: '13:50', type: 'HUMAN', status: 'Resolved', avatar: 'https://picsum.photos/seed/support3/100/100', unread: false, priority: 'Low', category: 'Payment', ticketId: '#TKT-4385', email: 'm.chen@webmail.com', phone: '+91 93220 XXXXX', createdAt: '27-May-26, 10:20 AM' },
    { id: 4, user: 'Priya Mehta', lastMessage: 'The venue details are wrong...', time: '13:30', type: 'HUMAN', status: 'Active', avatar: 'https://picsum.photos/seed/support4/100/100', unread: true, priority: 'High', category: 'Listing', ticketId: '#TKT-4382', email: 'priya.m@yahoo.com', phone: '+91 93221 XXXXX', createdAt: '27-May-26, 09:45 AM' },
    { id: 5, user: 'Rahul Sharma', lastMessage: 'Can I change my event date?', time: '12:45', type: 'BOT', status: 'Active', avatar: 'https://picsum.photos/seed/support5/100/100', unread: false, priority: 'Medium', category: 'Booking', ticketId: '#TKT-4379', email: 'rahul.s@gmail.com', phone: '+91 98201 XXXXX', createdAt: '27-May-26, 08:30 AM' },
    { id: 6, user: 'Neha Gupta', lastMessage: 'Coupon code not working', time: '12:10', type: 'PENDING', status: 'Pending', avatar: 'https://picsum.photos/seed/support6/100/100', unread: true, priority: 'Low', category: 'Coupon', ticketId: '#TKT-4370', email: 'neha.g@email.com', phone: '+91 98765 XXXXX', createdAt: '27-May-26, 07:55 AM' },
    { id: 7, user: 'Amit Patel', lastMessage: 'Thanks, issue is fixed now!', time: '11:30', type: 'HUMAN', status: 'Resolved', avatar: 'https://picsum.photos/seed/support7/100/100', unread: false, priority: 'Medium', category: 'Payment', ticketId: '#TKT-4362', email: 'amit.p@email.com', phone: '+91 99876 XXXXX', createdAt: '26-May-26, 04:20 PM' },
];

export const SUPPORT_MESSAGES: Record<number, Array<{ id: number; sender: 'user' | 'admin' | 'bot'; text: string; time: string }>> = {
    1: [
        { id: 1, sender: 'user', text: 'How can I reset my event pass? I accidentally deleted the email confirmation.', time: '02:10 PM' },
        { id: 2, sender: 'bot', text: 'Hi Alex! I can help with that. Let me pull up your recent bookings. Could you share the event name or booking ID?', time: '02:11 PM' },
        { id: 3, sender: 'user', text: "It was for the \"Summer Music Fest\" on June 15th. I think the booking ID starts with #BK-9...", time: '02:15 PM' },
        { id: 4, sender: 'admin', text: "I've found your booking #BK-98231 for Summer Music Fest. I'm re-sending the e-ticket to your registered email now.", time: '02:18 PM' },
        { id: 5, sender: 'user', text: 'How can I reset my event pass? In case this happens again?', time: '02:22 PM' },
    ],
    2: [
        { id: 1, sender: 'user', text: 'Hi, I need a refund for my booking. The event was cancelled by the organizer but I still got charged.', time: '01:50 PM' },
        { id: 2, sender: 'bot', text: 'I understand your concern, Sarah. Let me connect you with a human agent for refund processing.', time: '01:51 PM' },
        { id: 3, sender: 'user', text: "Waiting for a human representative... it's been 20 minutes already.", time: '02:15 PM' },
    ],
    3: [
        { id: 1, sender: 'user', text: "Hello, I'm having trouble with my recent booking for the \"Summer Music Fest\". The payment went through but I haven't received my ticket yet.", time: '10:24 AM' },
        { id: 2, sender: 'admin', text: 'Hi Michael, I\'m sorry to hear that. Let me check your transaction status right away. Could you please provide your booking ID?', time: '10:26 AM' },
        { id: 3, sender: 'user', text: "Sure, it's #BK-98231.", time: '10:27 AM' },
        { id: 4, sender: 'admin', text: "I've located your booking. The ticket was generated but the email delivery failed. I've re-sent it to your email. Please check your inbox.", time: '10:32 AM' },
        { id: 5, sender: 'user', text: 'Got it! Thank you for your help!', time: '10:35 AM' },
        { id: 6, sender: 'admin', text: "You're welcome, Michael! Is there anything else I can help with?", time: '10:36 AM' },
        { id: 7, sender: 'user', text: 'No, that was all. Thanks again!', time: '13:50 PM' },
    ],
    4: [
        { id: 1, sender: 'user', text: 'The venue details listed for "Pottery for Toddlers" are completely wrong. It says Andheri but the actual venue is in Bandra.', time: '09:45 AM' },
        { id: 2, sender: 'admin', text: "Thank you for flagging this, Priya. I'm escalating this to the partner team for immediate correction.", time: '09:50 AM' },
        { id: 3, sender: 'user', text: "Please fix it ASAP. The event is tomorrow and parents are confused. I've already gotten 3 calls about this.", time: '01:30 PM' },
    ],
    5: [
        { id: 1, sender: 'user', text: 'Can I change my event date from June 15 to June 22? Something came up.', time: '08:30 AM' },
        { id: 2, sender: 'bot', text: 'Hi Rahul! Date changes depend on the event organizer\'s policy. Let me check if this event allows date modifications.', time: '08:31 AM' },
        { id: 3, sender: 'bot', text: 'Good news! The "Summer Music Fest" allows date changes up to 48 hours before the event. Would you like me to process the change?', time: '08:33 AM' },
        { id: 4, sender: 'user', text: 'Yes please! Change it to June 22.', time: '12:45 PM' },
    ],
    6: [
        { id: 1, sender: 'user', text: 'I\'m trying to use coupon code SUMMER24 but it says "invalid code". The promo says it\'s valid until August.', time: '07:55 AM' },
        { id: 2, sender: 'bot', text: "I'll look into this for you. Could you tell me which event you're trying to book?", time: '07:56 AM' },
        { id: 3, sender: 'user', text: 'Coupon code not working for the Art Workshop this Saturday.', time: '12:10 PM' },
    ],
    7: [
        { id: 1, sender: 'user', text: 'My payment of ₹2,400 was deducted twice for the same booking #BK-97812. Please help!', time: '04:20 PM' },
        { id: 2, sender: 'admin', text: "I can see the duplicate charge, Amit. I've initiated a refund for ₹2,400. It should reflect in 3-5 business days.", time: '04:35 PM' },
        { id: 3, sender: 'user', text: 'Thanks, issue is fixed now! Got the refund confirmation email.', time: '11:30 AM' },
    ],
};

export const SUPPORT_QUICK_REPLIES = [
    "I'll look into this right away.",
    'Could you please share your booking ID?',
    "I'm escalating this to the relevant team.",
    'The refund has been initiated and will reflect in 3-5 business days.',
    'Is there anything else I can help with?',
    'Let me check with the partner team and get back to you.',
];

export const ACTIVITY_LOGS = [
    { id: 1, admin: 'Alex Rivera', action: 'updated system permissions for', target: '"Event Moderators"', time: '15 mins ago', dept: 'System Management', color: 'bg-yellow-400' },
    { id: 2, admin: 'Jordan Smith', action: 'approved', target: 'New User Verification queue', time: '1 hour ago', dept: 'User Operations', color: 'bg-blue-400' },
    { id: 3, admin: 'Sarah Chen', action: 'modified event settings for', target: '"Global Tech Summit 2024"', time: '2 hours ago', dept: 'Client Coordination', color: 'bg-purple-400' },
    { id: 4, admin: 'Alex Rivera', action: 'created new role', target: '"Finance Auditor"', time: '3 hours ago', dept: 'System Management', color: 'bg-yellow-400' },
    { id: 5, admin: 'Jordan Smith', action: 'rejected partner application for', target: '"Venue X Space"', time: '5 hours ago', dept: 'Partner Operations', color: 'bg-blue-400' },
    { id: 6, admin: 'Sarah Chen', action: 'published marketing coupon', target: '"SUMMER24"', time: '6 hours ago', dept: 'Marketing', color: 'bg-purple-400' },
    { id: 7, admin: 'Alex Rivera', action: 'exported analytics report', target: 'Q3 Revenue', time: '8 hours ago', dept: 'Analytics', color: 'bg-yellow-400' },
];

export const ROLES_AND_PERMISSIONS = [
    { id: 1, role: 'Super Admin', description: 'Full platform access', admins: 1, permissions: ['All permissions'] },
    { id: 2, role: 'Event Manager', description: 'Manage events and approvals', admins: 2, permissions: ['Approve events', 'Edit event details', 'View partner data'] },
    { id: 3, role: 'Marketing', description: 'Coupons and campaigns', admins: 1, permissions: ['Create coupons', 'View analytics', 'Manage campaigns'] },
    { id: 4, role: 'Finance Manager', description: 'Revenue and transactions', admins: 2, permissions: ['View revenue', 'Export reports', 'Manage payouts'] },
    { id: 5, role: 'Support Specialist', description: 'User support and tickets', admins: 2, permissions: ['Handle tickets', 'View user data', 'Escalate issues'] },
];

export const COUPONS = [
    { id: 1, code: 'SUMMER24', discount: 20, expiry: '2024-08-31', usageCount: 142, limit: 500 },
    { id: 2, code: 'WELCOME50', discount: 50, expiry: '2024-12-31', usageCount: 856, limit: 1000 },
];

export const USER_SECTION_METRICS = {
    activeTicketBuyers: { value: '1,420 Parents', growth: '+175 New Buyers', location: 'Khar & Andheri', insight: 'Direct ticket-commission pipeline is healthy and scaling.' },
    activeInquirers: { value: '3,890 Parents', growth: '+702 New Inquirers', location: 'Juhu & Vashi', insight: 'Massive discovery intent; lead-generation revenue loops are highly active.' },
    dormantAccounts: { value: '620 Parents', growth: '-25 Accounts (Dropped)', location: 'App Downloads (No Action)', insight: 'Reactivation push working; target remaining group with the Broadcast Engine below.' }
};

export const USER_SECTION_USERS = [
    {
        id: '#TLB-U-9082', joinDate: '12-Apr-26', name: 'Trushna',
        avatar: 'https://picsum.photos/seed/tlbu9082/100/100',
        email: 'trushna@tlb.com', phone: '+91 9819X XXXXX', location: 'Khar, Mumbai',
        totalRevenue: 24000, revenueBreakdown: { tickets: 75, inquiries: 25 },
        totalBookings: 12, totalInquiries: 4, lastActive: '01-May-26', accountStatus: 'Active',
    },
    {
        id: '#TLB-U-9083', joinDate: '10-May-26', name: 'Rahul Sharma',
        avatar: 'https://picsum.photos/seed/tlbu9083/100/100',
        email: 'rahul.s@gmail.com', phone: '+91 9820X XXXXX', location: 'Andheri, Mumbai',
        totalRevenue: 1500, revenueBreakdown: { tickets: 60, inquiries: 40 },
        totalBookings: 3, totalInquiries: 2, lastActive: '20-May-26', accountStatus: 'Active',
    },
    {
        id: '#TLB-U-9084', joinDate: '19-May-26', name: 'Priya Mehta',
        avatar: 'https://picsum.photos/seed/tlbu9084/100/100',
        email: 'priya.m@yahoo.com', phone: '+91 9322X XXXXX', location: 'Juhu, Mumbai',
        totalRevenue: 150, revenueBreakdown: { tickets: 0, inquiries: 100 },
        totalBookings: 0, totalInquiries: 3, lastActive: '15-Apr-26', accountStatus: 'Suspended',
    },
];

export const USER_TRANSACTIONS = [
    { refId: '#TXN-8801', category: 'Event', item: 'Lippan Art Workshop', partner: 'Ikigai Art Studio', interaction: 'Ticket Purchase', date: '12-Apr-26', status: 'Ticket Issued', originalPrice: 2400, qty: 2, discount: 'â‚¹400 Off via [TLB-MONSOON]', paidValue: 2000, tlbEarnings: 300, discountType: 'TLB Self Discount' },
    { refId: '#TXN-8944', category: 'Event', item: 'Slime Making Session', partner: 'Ikigai Art Studio', interaction: 'Ticket Purchase', date: '28-Apr-26', status: 'Ticket Issued', originalPrice: 1000, qty: 1, discount: 'â‚¹200 Off via [IKIGAI-EARLY]', paidValue: 800, tlbEarnings: 120, discountType: 'Partner Discount' },
    { refId: '#ENQ-4402', category: 'Class', item: 'Weekend Football Training', partner: 'Champions Academy', interaction: 'Lead Generated', date: '02-May-26', status: 'Sent to Partner', originalPrice: '-', qty: '-', discount: 'No Coupon', paidValue: '-', tlbEarnings: 50, discountType: '' },
    { refId: '#ENQ-5509', category: 'Venue', item: 'Birthday Party Hall Slot', partner: 'Giggles Playzone', interaction: 'Lead Generated', date: '14-May-26', status: 'Sent to Partner', originalPrice: '-', qty: '-', discount: 'No Coupon', paidValue: '-', tlbEarnings: 50, discountType: '' }
];

export const USER_REVIEWS = [
    { id: '#REV-102', category: 'Event', item: 'Lippan Art Workshop', partner: 'Ikigai Art Studio', rating: 5, preview: 'Amazing experience! My child loved playing with clay...', date: '12-Apr-26', status: 'Live on App' },
    { id: '#REV-504', category: 'Venue', item: 'Birthday Party Hall Slot', partner: 'Giggles Playzone', rating: 2, preview: 'The AC wasn\'t working properly in the afternoon slot...', date: '15-May-26', status: 'Disputed by Partner' },
    { id: '#REV-611', category: 'Class', item: 'Weekend Football Training', partner: 'Champions Academy', rating: 5, preview: 'Great coaches, highly recommend.', date: '16-May-26', status: 'Featured on Home' }
];

export const USER_LIKED_LISTINGS = [
    { id: '#EVT-7701', category: 'Event', item: 'Pottery for Toddlers', partner: 'Ikigai Art Studio', liked: true, saved: 'Saved', shared: 'Shared (2 times)', lastInteraction: '14-Apr-26' },
    { id: '#CLS-3302', category: 'Class', item: 'Under-10 Football Camp', partner: 'Champions Academy', liked: false, saved: 'Saved', shared: 'No', lastInteraction: '03-May-26' },
    { id: '#VEN-9941', category: 'Venue', item: 'Trampoline Zone Slot', partner: 'Giggles Playzone', liked: true, saved: 'Unsaved', shared: 'Shared (1 time)', lastInteraction: '20-May-26' }
];

export const USER_FOLLOWED_PARTNERS = [
    { id: '#PTR-V-201', name: 'Ikigai Art Studio', category: 'Creative Arts / Events', date: '12-Apr-26', liveListings: '3 Active Listings', notification: 'All Updates (Push + Email)' },
    { id: '#PTR-C-105', name: 'Champions Academy', category: 'Sports / Classes', date: '02-May-26', liveListings: '5 Active Listings', notification: 'Muted (In-App Feed Only)' },
    { id: '#PTR-V-883', name: 'Giggles Playzone', category: 'Play Spaces / Venues', date: '15-May-26', liveListings: '1 Active Listing', notification: 'Important Alerts Only' }
];
