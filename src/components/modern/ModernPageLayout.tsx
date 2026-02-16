import React from 'react';
import { DashboardLayout } from './DashboardLayout';

interface ModernPageLayoutProps {
  children: React.ReactNode;
  title: string;
}

/**
 * Modern page layout wrapper
 * Uses the DashboardLayout with sidebar and header for consistent UI across all pages
 * Pages handle their own internal padding
 */
export const ModernPageLayout: React.FC<ModernPageLayoutProps> = ({ children, title }) => {
  return (
    <DashboardLayout title={title}>
      {children}
    </DashboardLayout>
  );
};
