import React from 'react';

export interface DashboardSectionHeaderProps {
    title: string;
    subtitle?: string;
    className?: string;
}

declare const DashboardSectionHeader: React.ComponentType<DashboardSectionHeaderProps>;
export default DashboardSectionHeader;
