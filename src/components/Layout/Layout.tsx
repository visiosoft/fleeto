import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTheme, useMediaQuery } from '@mui/material';
import Navigation from '../Navigation/Navigation';
import VehicleManagement from '../../pages/VehicleManagement';
import DriverManagement from '../../pages/DriverManagement';
import Reports from '../../pages/Reports';
import Settings from '../../pages/Settings';
import Tracking from '../../pages/Tracking/Tracking';
import CostManagement from '../../pages/CostManagement/CostManagement';
import Compliance from '../../pages/Compliance/Compliance';
import ContractManagement from '../../pages/ContractManagement/ContractManagement';
import DatabaseTest from '../../pages/DatabaseTest';

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <Navigation
      isMobile={isMobile}
      isDrawerOpen={isDrawerOpen}
      handleDrawerToggle={handleDrawerToggle}
    >
      <Routes>
        <Route path="/" element={<VehicleManagement />} />
        <Route path="/drivers" element={<DriverManagement />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/costs" element={<CostManagement />} />
        <Route path="/contracts" element={<ContractManagement />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/database-test" element={<DatabaseTest />} />
      </Routes>
    </Navigation>
  );
};

export default Layout; 