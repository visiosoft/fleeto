import React, { useState } from 'react';
import { Sidebar, SidebarGroup } from './Sidebar';
import { Header } from './Header';
import {
  DirectionsCarOutlined as VehicleIcon,
  PersonOutline as DriverIcon,
  DescriptionOutlined as ContractIcon,
  PaymentsOutlined as ExpenseIcon,
  GavelOutlined as FineIcon,
  InsightsOutlined as ReportsIcon,
  SettingsOutlined as SettingsIcon,
  SpaceDashboardOutlined as DashboardIcon,
  ReceiptLongOutlined as InvoiceIcon,
  ReceiptOutlined as ReceiptIcon,
  RoomOutlined as TrackingIcon,
  DrawOutlined as LetterheadIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Grouped by what the user is doing, rather than one flat list of twelve links.
  const sidebarGroups: SidebarGroup[] = [
    {
      id: 'overview',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' }],
    },
    {
      id: 'fleet',
      label: 'Fleet',
      items: [
        { id: 'vehicles', label: 'Vehicles', icon: <VehicleIcon />, path: '/vehicles' },
        { id: 'drivers', label: 'Drivers', icon: <DriverIcon />, path: '/drivers' },
        { id: 'tracking', label: 'Tracking', icon: <TrackingIcon />, path: '/tracking' },
      ],
    },
    {
      id: 'operations',
      label: 'Operations',
      items: [
        { id: 'contracts', label: 'Contracts', icon: <ContractIcon />, path: '/contracts' },
        { id: 'fines', label: 'Fines', icon: <FineIcon />, path: '/fines-search' },
      ],
    },
    {
      id: 'finance',
      label: 'Finance',
      items: [
        { id: 'invoices', label: 'Invoices', icon: <InvoiceIcon />, path: '/beta-invoices' },
        { id: 'receipts', label: 'Receipts', icon: <ReceiptIcon />, path: '/receipts' },
        { id: 'expenses', label: 'Expenses', icon: <ExpenseIcon />, path: '/costs' },
      ],
    },
    {
      id: 'insights',
      label: 'Insights',
      items: [{ id: 'reports', label: 'Reports', icon: <ReportsIcon />, path: '/reports' }],
    },
    {
      id: 'configuration',
      label: 'Configuration',
      items: [
        { id: 'letterheads', label: 'Letterheads', icon: <LetterheadIcon />, path: '/letterheads' },
        { id: 'settings', label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
      ],
    },
  ];

  return (
    <div className="min-h-[100dvh] w-full bg-gray-50">
      <a
        href="#page-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-700 focus:shadow-md-tinted"
      >
        Skip to content
      </a>

      {/* Sidebar */}
      <Sidebar groups={sidebarGroups} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content - min-w-0 so wide tables scroll inside instead of stretching the shell */}
      <div className="md:ml-64 min-w-0">
        {/* Header */}
        <Header
          title={title}
          user={{
            name: user
              ? (user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email?.split('@')[0] || 'User')
              : 'User',
            email: user?.email || '',
          }}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* Page Content - header is 4rem, so this fills the rest without forcing an extra viewport of scroll */}
        <main id="page-content" className="min-h-[calc(100dvh-4rem)] p-4 pb-8 md:p-6 md:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
};
