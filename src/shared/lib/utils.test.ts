import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn()', () => {
    it('returns a single class unchanged', () => {
        expect(cn('text-red-500')).toBe('text-red-500');
    });

    it('merges multiple classes', () => {
        expect(cn('px-4', 'py-2', 'rounded')).toBe('px-4 py-2 rounded');
    });

    it('resolves conflicting Tailwind classes (last wins)', () => {
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
        expect(cn('p-4', 'p-6')).toBe('p-6');
    });

    it('handles conditional classes (falsy values ignored)', () => {
        expect(cn('base', false && 'ignored', null, undefined, 'active')).toBe('base active');
    });

    it('handles object syntax', () => {
        expect(cn({ 'text-green-500': true, 'text-red-500': false })).toBe('text-green-500');
    });

    it('handles array syntax', () => {
        expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1');
    });

    it('returns empty string for no arguments', () => {
        expect(cn()).toBe('');
    });
});
