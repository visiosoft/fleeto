import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation/Navigation';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { useMediaQuery, useTheme, CircularProgress, Box, CssBaseline } from '@mui/material';
import Dashboard from './pages/Dashboard/Dashboard';
import ContractTemplate from './pages/ContractTemplate/ContractTemplate';
import Login from './pages/Login/Login';
import Profile from './pages/Profile/Profile';
import Register from './pages/Register/Register';
import CostManagement from './pages/CostManagement/CostManagement';
import GeneralNotes from './pages/GeneralNotes/GeneralNotes';
import DriverPayroll from './pages/DriverPayroll/DriverPayroll';
import InvoiceManagement from './pages/InvoiceManagement/InvoiceManagement';
import InvoiceForm from './pages/InvoiceManagement/InvoiceForm';
import InvoicePayment from './pages/InvoiceManagement/InvoicePayment';

// Lazy load all pages
const VehicleManagement = React.lazy(() => import('./pages/VehicleManagement'));
const DriverManagement = React.lazy(() => import('./pages/DriverManagement'));
const Tracking = React.lazy(() => import('./pages/Tracking/Tracking'));
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

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

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
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <Dashboard />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/vehicles" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <VehicleManagement />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/drivers" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <DriverManagement />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/tracking" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <Tracking />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/costs" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <CostManagement />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/contracts" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <ContractManagement />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/contracts/template/:id" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <ContractTemplate />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <Reports />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/compliance" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <Compliance />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <Settings />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/company-settings" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <CompanySettings />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <Profile />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/cost-management" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <CostManagement />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/driver-payroll" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <DriverPayroll />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              <Route path="/general-notes" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <GeneralNotes />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              {/* Invoice Management Routes */}
              <Route path="/invoices" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <InvoiceManagement />
                  </Navigation>
                </ProtectedRoute>
              } />
              <Route path="/invoices/new" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <InvoiceForm />
                  </Navigation>
                </ProtectedRoute>
              } />
              <Route path="/invoices/:id/edit" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <InvoiceForm />
                  </Navigation>
                </ProtectedRoute>
              } />
              <Route path="/invoices/:id/payment" element={
                <ProtectedRoute>
                  <Navigation
                    isMobile={isMobile}
                    isDrawerOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                  >
                    <InvoicePayment />
                  </Navigation>
                </ProtectedRoute>
              } />
              
              {/* Redirect to login if no route matches */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </Box>
      </Router>
    </LocalizationProvider>
  );
};

export default App;
