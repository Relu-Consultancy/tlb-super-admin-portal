import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Hub from './Hub';
import { Screen } from '../../types';

vi.mock('motion/react', async () => {
  const React = await import('react');
  const cache: Record<string, any> = {};
  return {
    motion: new Proxy({}, { get(_: any, tag: string) {
      if (!cache[tag]) cache[tag] = ({ children, ...p }: any) => { const { initial, animate, exit, transition, layoutId, ...rest } = p; return React.createElement(tag as any, rest, children); };
      return cache[tag];
    } }),
    AnimatePresence: ({ children }: any) => children,
  };
});

vi.mock('../../shared/auth/AuthContext', () => ({
  useAuth: () => ({ admin: { full_name: 'Vishesh S.', email: 'v@x.com', role: 'SUPER_ADMIN' } }),
}));

describe('Hub', () => {
  beforeEach(() => vi.clearAllMocks());

  it('greets the admin and renders the four workspaces', () => {
    render(<Hub onEnterSection={vi.fn()} onSelectScreen={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /Welcome back, Vishesh/ })).toBeInTheDocument();
    expect(screen.getByText('User / Customer')).toBeInTheDocument();
    expect(screen.getByText('Partner')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('Support Tickets')).toBeInTheDocument();
  });

  it('lists features inside their sections', () => {
    render(<Hub onEnterSection={vi.fn()} onSelectScreen={vi.fn()} />);
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Partner Management')).toBeInTheDocument();
    expect(screen.getByText('Finance Dashboard')).toBeInTheDocument();
  });

  it('selects a screen when a feature is clicked', async () => {
    const onSelectScreen = vi.fn();
    render(<Hub onEnterSection={vi.fn()} onSelectScreen={onSelectScreen} />);
    await userEvent.click(screen.getByText('Listings Approval'));
    expect(onSelectScreen).toHaveBeenCalledWith(Screen.EVENT_APPROVAL);
  });

  it('enters a section when the Open button is clicked', async () => {
    const onEnterSection = vi.fn();
    render(<Hub onEnterSection={onEnterSection} onSelectScreen={vi.fn()} />);
    await userEvent.click(screen.getByText('Open Partner'));
    expect(onEnterSection).toHaveBeenCalledWith('partner');
  });
});
