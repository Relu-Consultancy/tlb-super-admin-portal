import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateTlbSignature from './CreateTlbSignature';

const { authState } = vi.hoisted(() => ({ authState: { tlb: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (p: string) => (p === 'MANAGE_TLB_LISTINGS' ? authState.tlb : false) }),
}));

vi.mock('../../shared/lib/api', () => ({
  createTlbEvent: vi.fn(() => Promise.resolve({ id: 'e1', title: 'Gala Night' })),
  createTlbClass: vi.fn(() => Promise.resolve({ id: 'c1', title: 'Yoga' })),
  createTlbProgram: vi.fn(() => Promise.resolve({ id: 'p1', title: 'Bootcamp' })),
  createTlbVenue: vi.fn(() => Promise.resolve({ id: 'v1', title: 'Hall' })),
  tlbErrorMessage: (code: string | null, fallback: string) => (code ? `ERR:${code}` : fallback),
  ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { createTlbEvent, createTlbVenue } from '../../shared/lib/api';

describe('CreateTlbSignature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.tlb = true;
  });

  it('blocks access without MANAGE_TLB_LISTINGS', () => {
    authState.tlb = false;
    render(<CreateTlbSignature />);
    expect(screen.getByText('No access')).toBeInTheDocument();
  });

  it('requires a title', async () => {
    render(<CreateTlbSignature />);
    await userEvent.click(screen.getByRole('button', { name: /Venue/i }));
    await userEvent.click(screen.getByRole('button', { name: /Create Venue/i }));
    expect(await screen.findByText(/A title is required/i)).toBeInTheDocument();
    expect(createTlbVenue).not.toHaveBeenCalled();
  });

  it('requires at least one ticket for an event', async () => {
    render(<CreateTlbSignature />);
    await userEvent.click(screen.getByRole('button', { name: /^Event/i }));
    await userEvent.type(screen.getByPlaceholderText('Listing title'), 'Gala Night');
    await userEvent.click(screen.getByRole('button', { name: /Create Event/i }));
    expect(await screen.findByText(/at least one ticket/i)).toBeInTheDocument();
    expect(createTlbEvent).not.toHaveBeenCalled();
  });

  it('creates a venue with a package and shows success', async () => {
    const onCreated = vi.fn();
    render(<CreateTlbSignature onCreated={onCreated} />);
    await userEvent.click(screen.getByRole('button', { name: /Venue/i }));
    await userEvent.type(screen.getByPlaceholderText('Listing title'), 'Grand Hall');
    // The seeded package row — fill its name so it's included.
    const nameInputs = screen.getAllByText('Name');
    expect(nameInputs.length).toBeGreaterThanOrEqual(1);
    await userEvent.click(screen.getByRole('button', { name: /Create Venue/i }));
    await waitFor(() => expect(createTlbVenue).toHaveBeenCalled());
    const payload = (createTlbVenue as any).mock.calls[0][0];
    expect(payload.title).toBe('Grand Hall');
    expect(await screen.findByText(/listing created/i)).toBeInTheDocument();
  });
});
