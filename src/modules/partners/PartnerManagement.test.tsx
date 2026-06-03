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

const { authState } = vi.hoisted(() => ({ authState: { manage: true, approve: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
    useAuth: () => ({
        hasPermission: (p: string) =>
            p === 'MANAGE_PARTNERS' ? authState.manage : p === 'APPROVE_PARTNERS' ? authState.approve : false,
    }),
}));

vi.mock('../../shared/lib/api', () => ({
    listPartners: vi.fn(),
    getPartnerMetrics: vi.fn(),
    getPartner: vi.fn(),
    getPartnerReviewLogs: vi.fn(() => Promise.resolve([])),
    verifyPartner: vi.fn(() => Promise.resolve({})),
    unverifyPartner: vi.fn(() => Promise.resolve({})),
    verifyPartnerBank: vi.fn(() => Promise.resolve({})),
    approvePartner: vi.fn(() => Promise.resolve({})),
    rejectPartner: vi.fn(() => Promise.resolve({})),
    requestPartnerChanges: vi.fn(() => Promise.resolve({})),
    activatePartner: vi.fn(() => Promise.resolve({})),
    deactivatePartner: vi.fn(() => Promise.resolve({})),
    queuePartnerExport: vi.fn(() => Promise.resolve({ job_id: 'j1', status: 'queued' })),
    getPartnerExportJob: vi.fn(() => Promise.resolve({ job_id: 'j1', status: 'done' })),
    downloadPartnerExport: vi.fn(() => Promise.resolve(new Blob(['csv']))),
    partnerStatusLabel: (s: string) => s,
    partnerStatusTone: () => 'bg-gray-100 text-gray-600',
    isPartnerOnboarding: (s: string) => !['under_review', 'activated_limited', 'approved', 'rejected'].includes(s),
    mediaUrl: (p: string) => p,
    PARTNER_STATUSES: ['under_review', 'approved', 'rejected'],
    PARTNER_CATEGORIES: ['Events', 'Classes'],
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listPartners, getPartner, getPartnerMetrics, verifyPartner, approvePartner } from '../../shared/lib/api';

const METRICS = {
    total_partners: 12, approved: 5, under_review: 3, rejected: 2,
    activated_limited: 1, profile_created: 1, is_active_count: 8, is_verified_count: 6, new_this_month: 4,
};

const PARTNERS = [
    { id: 'p-1', email: 'alpha@tlb.dev', business_name: 'Alpha Events', business_type: 'Individual', contact_person_name: 'Al', base_city: 'Mumbai', categories: ['Events'], status: 'under_review', is_active: false, is_verified: false, created_at: '2026-06-01T00:00:00Z' },
    { id: 'p-2', email: 'beta@tlb.dev', business_name: 'Beta Studios', business_type: 'Company', contact_person_name: 'Be', base_city: 'Delhi', categories: ['Classes'], status: 'approved', is_active: true, is_verified: true, created_at: '2026-05-01T00:00:00Z' },
];

const DETAIL = {
    id: 'p-1', email: 'alpha@tlb.dev', status: 'under_review', is_active: false, is_verified: false,
    created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-02T00:00:00Z',
    profile: { business_name: 'Alpha Events', business_type: 'Individual', contact_person_name: 'Al', email: 'alpha@tlb.dev', base_city: 'Mumbai', instagram_url: '', facebook_url: '', website_url: '', is_safety_confirmed: true, is_info_correct: true },
    extended_profile: { bio: 'We host events', logo: '', cover_image: '', contact_number: '999' },
    verification: { pan_number: 'ABCDE1234F', gst_number: '22ABC', is_pan_verified: false },
    bank_detail: { account_holder_name: 'Alpha', account_number: '12345', ifsc_code: 'HDFC0001', is_verified: false },
    categories: ['Events'], operating_cities: ['Mumbai'], media: [], follower_count: 10, agreement_accepted_at: '2026-06-01T00:00:00Z', review_logs: [],
};

describe('PartnerManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.manage = true;
        authState.approve = true;
        (listPartners as any).mockResolvedValue(PARTNERS);
        (getPartnerMetrics as any).mockResolvedValue(METRICS);
        (getPartner as any).mockResolvedValue(DETAIL);
    });

    it('renders heading and metrics', async () => {
        render(<PartnerManagement />);
        expect(screen.getByText('Partner Management')).toBeInTheDocument();
        expect(await screen.findByText('Total Partners')).toBeInTheDocument();
        expect(await screen.findByText('12')).toBeInTheDocument();
    });

    it('lists partners from the API', async () => {
        render(<PartnerManagement />);
        expect(await screen.findByText('Alpha Events')).toBeInTheDocument();
        expect(screen.getByText('Beta Studios')).toBeInTheDocument();
    });

    it('tags onboarding partners with incomplete profiles as New', async () => {
        (listPartners as any).mockResolvedValue([
            { id: 'p-3', email: 'new@mailinator.com', business_name: '', business_type: '', contact_person_name: '', base_city: '', categories: ['Events'], status: 'category_selected', is_active: true, is_verified: false, created_at: '2026-05-29T00:00:00Z' },
        ]);
        render(<PartnerManagement />);
        expect(await screen.findByText('new@mailinator.com')).toBeInTheDocument();
        expect(screen.getByText('New')).toBeInTheDocument();
        expect(screen.getByText('Incomplete profile')).toBeInTheDocument();
        expect(screen.getByText('Unnamed partner')).toBeInTheDocument();
    });

    it('shows an empty state when no partners match', async () => {
        (listPartners as any).mockResolvedValue([]);
        render(<PartnerManagement />);
        expect(await screen.findByText('No partners found')).toBeInTheDocument();
    });

    it('opens the review page and shows the workflow', async () => {
        render(<PartnerManagement />);
        await userEvent.click(await screen.findByText('Alpha Events'));
        await waitFor(() => expect(getPartner).toHaveBeenCalledWith('p-1'));
        expect(await screen.findByText('Review Workflow')).toBeInTheDocument();
        expect(screen.getByText('Identity & Documents')).toBeInTheDocument();
        expect(screen.getByText('Bank Details')).toBeInTheDocument();
    });

    it('verifies identity from the review page', async () => {
        render(<PartnerManagement />);
        await userEvent.click(await screen.findByText('Alpha Events'));
        await userEvent.click(await screen.findByRole('button', { name: /Verify Identity/i }));
        await waitFor(() => expect(verifyPartner).toHaveBeenCalledWith('p-1'));
    });

    it('disables Approve until identity and bank are verified', async () => {
        render(<PartnerManagement />);
        await userEvent.click(await screen.findByText('Alpha Events'));
        const approveBtn = await screen.findByRole('button', { name: /Approve Partner/i });
        expect(approveBtn).toBeDisabled();
        expect(approvePartner).not.toHaveBeenCalled();
    });

    it('allows approval once verified', async () => {
        (getPartner as any).mockResolvedValue({
            ...DETAIL, is_verified: true,
            verification: { ...DETAIL.verification, is_pan_verified: true },
            bank_detail: { ...DETAIL.bank_detail, is_verified: true },
        });
        render(<PartnerManagement />);
        await userEvent.click(await screen.findByText('Alpha Events'));
        const approveBtn = await screen.findByRole('button', { name: /Approve Partner/i });
        expect(approveBtn).not.toBeDisabled();
        await userEvent.click(approveBtn);
        // The modal confirm button shares the label — it's the last one rendered.
        const all = await screen.findAllByRole('button', { name: 'Approve Partner' });
        await userEvent.click(all[all.length - 1]);
        await waitFor(() => expect(approvePartner).toHaveBeenCalledWith('p-1', ''));
    });
});
