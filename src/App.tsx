import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation/Navigation';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { useMediaQuery, useTheme, CircularProgress, Box, CssBaseline } from '@mui/material';
import Dashboard from './pages/Dashboard/Dashboard';
import ContractTemplate from './pages/ContractTemplate/ContractTemplate';

// Lazy load all pages
const VehicleManagement = React.lazy(() => import('./pages/VehicleManagement'));
const DriverManagement = React.lazy(() => import('./pages/DriverManagement'));
const Tracking = React.lazy(() => import('./pages/Tracking/Tracking'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));
const FuelManagement = React.lazy(() => import('./pages/FuelManagement/FuelManagement'));
const CostManagement = React.lazy(() => import('./pages/CostManagement/CostManagement'));
const ContractManagement = React.lazy(() => import('./pages/ContractManagement'));
const Reports = React.lazy(() => import('./pages/Reports/Reports'));
const Compliance = React.lazy(() => import('./pages/Compliance/Compliance'));
const Settings = React.lazy(() => import('./pages/Settings'));
const CompanySettings = React.lazy(() => import('./pages/CompanySettings/CompanySettings'));

// Loading component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
);

const App: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <CssBaseline />
          <Navigation
            isMobile={isMobile}
            isDrawerOpen={mobileOpen}
            handleDrawerToggle={handleDrawerToggle}
          >
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/vehicles" element={<VehicleManagement />} />
                <Route path="/drivers" element={<DriverManagement />} />
                <Route path="/tracking" element={<Tracking />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/fuel" element={<FuelManagement />} />
                <Route path="/costs" element={<CostManagement />} />
                <Route path="/contracts" element={<ContractManagement />} />
                <Route path="/contracts/template/:id" element={<ContractTemplate />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/company-settings" element={<CompanySettings />} />
              </Routes>
            </Suspense>
          </Navigation>
        </Box>
      </Router>
    </LocalizationProvider>
  );
};

export default App;
