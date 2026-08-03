import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'highlight';
    [key: string]: any;
}

const Card = ({ children, className, variant = 'default', ...props }: CardProps) => (
    <div
        className={cn(
            "rounded-xl border p-5",
            variant === 'highlight'
                ? "bg-amber-50 border-amber-200"
                : "bg-white border-gray-200 shadow-sm",
            className,
        )}
        {...props}
    >
        {children}
    </div>
);

export default Card;
