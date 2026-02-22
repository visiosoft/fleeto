import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import {
  DirectionsCar as VehicleIcon,
  Person as DriverIcon,
  Description as ContractIcon,
  Receipt as ExpenseIcon,
  LocalParking as FineIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  ReceiptLong as InvoiceIcon,
  Receipt as ReceiptIcon,
  LocationOn as TrackingIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      id: 'vehicles',
      label: 'Vehicles',
      icon: <VehicleIcon />,
      path: '/vehicles',
    },
    {
      id: 'drivers',
      label: 'Drivers',
      icon: <DriverIcon />,
      path: '/drivers',
    },
    {
      id: 'contracts',
      label: 'Contracts',
      icon: <ContractIcon />,
      path: '/contracts',
    },
    {
      id: 'tracking',
      label: 'Tracking',
      icon: <TrackingIcon />,
      path: '/tracking',
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: <InvoiceIcon />,
      path: '/beta-invoices',
    },
    {
      id: 'receipts',
      label: 'Receipts',
      icon: <ReceiptIcon />,
      path: '/receipts',
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: <ExpenseIcon />,
      path: '/costs',
    },
    {
      id: 'fines',
      label: 'Fines',
      icon: <FineIcon />,
      path: '/fines-search',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <ReportsIcon />,
      path: '/reports',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar items={sidebarItems} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="md:ml-64">
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
          notificationCount={0}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="min-h-screen p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};
