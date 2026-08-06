import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    /** 'filter' = compact toolbar style (default), 'form' = taller form-field style */
    variant?: 'filter' | 'form';
    /** Which side the dropdown opens on. Use 'top' for controls pinned near the bottom of the page. */
    placement?: 'bottom' | 'top';
}

export default function Select({
    value,
    onChange,
    options,
    placeholder = 'Select…',
    disabled = false,
    className,
    variant = 'filter',
    placement = 'bottom',
}: SelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;
    const isPlaceholder = !options.some((o) => o.value === value);

    const handleSelect = useCallback(
        (v: string) => {
            onChange(v);
            setOpen(false);
        },
        [onChange],
    );

    const isFilter = variant === 'filter';

    return (
        <div ref={ref} className={cn('relative', className)}>
            {/* Trigger */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'flex items-center justify-between gap-2 border rounded-xl text-sm cursor-pointer transition-all text-left',
                    'focus:outline-none focus:ring-2 focus:ring-yellow-400',
                    isFilter
                        ? 'bg-white border-gray-200 px-4 py-2.5 text-gray-700 hover:border-gray-300'
                        : 'w-full bg-gray-50 border-gray-200 px-4 py-3 text-gray-700 hover:border-gray-300',
                    open && 'ring-2 ring-yellow-400 border-yellow-400',
                    disabled && 'opacity-60 cursor-not-allowed',
                    isPlaceholder && 'text-gray-400',
                )}
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown
                    size={14}
                    className={cn(
                        'shrink-0 text-gray-400 transition-transform duration-200',
                        open && 'rotate-180',
                    )}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className={cn(
                        'absolute z-50 w-full min-w-[160px] bg-white border border-gray-200 rounded-xl shadow-lg',
                        'py-1 max-h-[240px] overflow-y-auto',
                        'animate-in fade-in-0 zoom-in-95 duration-150',
                        placement === 'top' ? 'bottom-full mb-1.5' : 'mt-1.5',
                    )}
                    style={{ animationFillMode: 'forwards' }}
                >
                    {options.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelect(opt.value)}
                                className={cn(
                                    'w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left transition-colors',
                                    isSelected
                                        ? 'bg-yellow-50 text-gray-900 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50',
                                )}
                            >
                                <span className="flex-1 truncate">{opt.label}</span>
                                {isSelected && (
                                    <Check size={14} className="shrink-0 text-yellow-600" />
                                )}
                            </button>
                        );
                    })}
                    {options.length === 0 && (
                        <p className="px-3.5 py-2 text-sm text-gray-400">No options</p>
                    )}
                </div>
            )}
        </div>
    );
}
