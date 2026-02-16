import React from 'react';
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
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const { user } = useAuth();

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
      id: 'expenses',
      label: 'Expenses',
      icon: <ExpenseIcon />,
      path: '/cost-management',
    },
    {
      id: 'fines',
      label: 'Fines',
      icon: <FineIcon />,
      path: '/fines',
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
      <Sidebar items={sidebarItems} />

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <Header
          title={title}
          user={{
            name: user ? `${user.firstName} ${user.lastName}` : 'User',
            email: user?.email || '',
          }}
          notificationCount={0}
        />

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};
