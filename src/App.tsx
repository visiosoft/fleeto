import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation/Navigation';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { useMediaQuery, useTheme, CircularProgress, Box } from '@mui/material';

// Lazy load all pages
const VehicleManagement = React.lazy(() => import('./pages/VehicleManagement'));
const DriverManagement = React.lazy(() => import('./pages/DriverManagement'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));
const FuelManagement = React.lazy(() => import('./pages/FuelManagement/FuelManagement'));
const ContractManagement = React.lazy(() => import('./pages/ContractManagement'));
const Settings = React.lazy(() => import('./pages/Settings'));
const CompanySettings = React.lazy(() => import('./pages/CompanySettings/CompanySettings'));

// Loading component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
);

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isDrawerOpen, setIsDrawerOpen] = useState(!isMobile);

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Router>
        <Navigation
          isMobile={isMobile}
          isDrawerOpen={isDrawerOpen}
          handleDrawerToggle={handleDrawerToggle}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<VehicleManagement />} />
              <Route path="/drivers" element={<DriverManagement />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/fuel" element={<FuelManagement />} />
              <Route path="/contracts" element={<ContractManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/company-settings" element={<CompanySettings />} />
            </Routes>
          </Suspense>
        </Navigation>
      </Router>
    </LocalizationProvider>
  );
}

export default App;
