import React from 'react';

export interface StatCardProps {
    label: string;
    value: React.ReactNode;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ComponentType<any>;
    color?: string;
    href?: string;
    loading?: boolean;
}

declare const StatCard: React.ComponentType<StatCardProps>;
export default StatCard;
