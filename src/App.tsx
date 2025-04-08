import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navigation from './components/Navigation/Navigation';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { useMediaQuery, useTheme, CircularProgress, Box, CssBaseline, ThemeProvider } from '@mui/material';
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
import CompanyManagement from './pages/CompanyManagement/CompanyManagement';
import CompanyUsers from './pages/CompanyUsers/CompanyUsers';
import UserManagement from './pages/UserManagement/UserManagement';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CompanySelection from './pages/CompanySelection/CompanySelection';
import { theme } from './theme';
import Sitemap from './components/Sitemap/Sitemap';

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

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, selectedCompany } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!selectedCompany) {
    return <Navigate to="/select-company" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// App content component
const AppContent: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Company selection route */}
          <Route path="/select-company" element={<CompanySelection />} />
          
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
          
          <Route path="/users" element={
            <ProtectedRoute>
              <Navigation
                isMobile={isMobile}
                isDrawerOpen={mobileOpen}
                handleDrawerToggle={handleDrawerToggle}
              >
                <UserManagement />
              </Navigation>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
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
          <Route path="/companies" element={
            <ProtectedRoute>
              <Navigation
                isMobile={isMobile}
                isDrawerOpen={mobileOpen}
                handleDrawerToggle={handleDrawerToggle}
              >
                <CompanyManagement />
              </Navigation>
            </ProtectedRoute>
          } />
          
          <Route path="/companies/:companyId/users" element={
            <ProtectedRoute>
              <Navigation
                isMobile={isMobile}
                isDrawerOpen={mobileOpen}
                handleDrawerToggle={handleDrawerToggle}
              >
                <CompanyUsers />
              </Navigation>
            </ProtectedRoute>
          } />
          
          <Route path="/sitemap" element={<Sitemap />} />
          
          {/* Redirect to login if no route matches */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Box>
  );
};

// Wrapper component to handle navigation context
const AppWrapper: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <AuthProvider navigate={navigate}>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <AppContent />
      </LocalizationProvider>
    </AuthProvider>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppWrapper />
      </Router>
    </ThemeProvider>
  );
};

export default App;
