import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PartnerManagement from './PartnerManagement';

vi.mock('motion/react', async () => {
    const React = await import('react');
    const cache: Record<string, any> = {};
    return {
        motion: new Proxy({}, {
            get(_: any, tag: string) {
                if (!cache[tag]) {
                    cache[tag] = ({ children, ...props }: any) => {
                        const { initial, animate, exit, transition, layoutId, ...rest } = props;
                        return React.createElement(tag as any, rest, children);
                    };
                }
                return cache[tag];
            },
        }),
        AnimatePresence: ({ children }: any) => children,
    };
});

const { authState } = vi.hoisted(() => ({ authState: { canManage: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
    useAuth: () => ({ hasPermission: () => authState.canManage }),
}));

vi.mock('../../shared/lib/api', () => ({
    listPartners: vi.fn(),
    getPartner: vi.fn((id: string) => Promise.resolve({ id })),
    disablePartner: vi.fn(() => Promise.resolve({ detail: 'disabled' })),
    enablePartner: vi.fn(() => Promise.resolve({ detail: 'enabled' })),
    partnerStatusLabel: (s: string) => s,
    partnerStatusTone: () => 'bg-gray-100 text-gray-600',
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listPartners, disablePartner } from '../../shared/lib/api';

const PARTNERS = [
    { id: 'p-1', email: 'active@partner.com', auth_provider: 'otp', is_active: true, disabled_reason: '', disabled_at: null, last_login: '2026-06-01T10:00:00Z', created_at: '2026-01-01T00:00:00Z', partner_status: 'approved', partner_is_active: true },
    { id: 'p-2', email: 'pending@partner.com', auth_provider: 'otp', is_active: false, disabled_reason: 'Fraud', disabled_at: '2026-05-01T00:00:00Z', last_login: null, created_at: '2026-01-01T00:00:00Z', partner_status: 'category_selected', partner_is_active: false },
];

describe('PartnerManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.canManage = true;
        (listPartners as any).mockResolvedValue({ count: 2, next: null, previous: null, results: PARTNERS });
    });

    it('renders the heading and search', () => {
        render(<PartnerManagement />);
        expect(screen.getByText('Partners')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search by email...')).toBeInTheDocument();
    });

    it('renders partner rows fetched from the API', async () => {
        render(<PartnerManagement />);
        expect(await screen.findByText('active@partner.com')).toBeInTheDocument();
        expect(screen.getByText('pending@partner.com')).toBeInTheDocument();
    });

    it('shows partner status badges', async () => {
        render(<PartnerManagement />);
        await screen.findByText('active@partner.com');
        expect(screen.getByText('approved')).toBeInTheDocument();
        expect(screen.getByText('category_selected')).toBeInTheDocument();
    });

    it('shows an empty state when no partners match', async () => {
        (listPartners as any).mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
        render(<PartnerManagement />);
        expect(await screen.findByText('No partners found')).toBeInTheDocument();
    });

    it('opens the disable modal and submits a reason', async () => {
        render(<PartnerManagement />);
        await screen.findByText('active@partner.com');
        await userEvent.click(screen.getByTitle('Disable account'));
        expect(await screen.findByRole('heading', { name: 'Disable Partner' })).toBeInTheDocument();
        await userEvent.type(screen.getByPlaceholderText(/Fraudulent listings/i), 'Fraud reports');
        await userEvent.click(screen.getByRole('button', { name: 'Disable Partner' }));
        await waitFor(() => expect(disablePartner).toHaveBeenCalledWith('p-1', 'Fraud reports'));
    });

    it('hides disable/enable actions without MANAGE_PARTNERS', async () => {
        authState.canManage = false;
        render(<PartnerManagement />);
        await screen.findByText('active@partner.com');
        expect(screen.queryByTitle('Disable account')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Enable account')).not.toBeInTheDocument();
    });
});
