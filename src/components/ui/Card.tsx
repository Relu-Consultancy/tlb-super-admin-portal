import React from 'react';
import { cn } from '../../lib/utils';

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string;[key: string]: any }) => (
    <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-sm p-6", className)} {...props}>
        {children}
    </div>
);

export default Card;
