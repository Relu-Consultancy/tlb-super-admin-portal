import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReportsTab from './ReportsTab';

describe('ReportsTab', () => {
    it('shows a coming-soon state naming the vertical, not fabricated charts', () => {
        render(<ReportsTab vertical="class" />);
        expect(screen.getByText('Reports coming soon')).toBeInTheDocument();
        expect(screen.getByText(/classes need backend analytics support/)).toBeInTheDocument();
    });
});
