import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navigation from './components/Navigation/Navigation';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { useMediaQuery, useTheme, CircularProgress, Box, CssBaseline } from '@mui/material';
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
import UserManagement from './pages/UserManagement/UserManagement';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CompanySelection from './pages/CompanySelection/CompanySelection';
import { ThemeProvider } from './contexts/ThemeContext';
import LoadingDemo from './pages/LoadingDemo/LoadingDemo';
import LandingPage from './pages/LandingPage/LandingPage';
import ReceiptManagement from './pages/ReceiptManagement/ReceiptManagement';
import ReceiptForm from './pages/ReceiptManagement/ReceiptForm';
import LetterheadManagement from './pages/LetterheadManagement/LetterheadManagement';
import LetterheadPDF from './pages/LetterheadManagement/LetterheadPDF';
import WhatsAppExpenses from './pages/WhatsAppExpenses/WhatsAppExpenses';
import { ModernDashboard } from './pages/ModernDashboard/ModernDashboard';
import { ModernPageLayout } from './components/modern/ModernPageLayout';

// Lazy load all pages
const VehicleManagement = React.lazy(() => import('./pages/VehicleManagement'));
const DriverManagement = React.lazy(() => import('./pages/DriverManagement'));
const Tracking = React.lazy(() => import('./pages/Tracking/Tracking'));
const ContractManagement = React.lazy(() => import('./pages/ContractManagement'));
const Reports = React.lazy(() => import('./pages/Reports/Reports'));
const Compliance = React.lazy(() => import('./pages/Compliance/Compliance'));
const Settings = React.lazy(() => import('./pages/Settings'));
const CompanySettings = React.lazy(() => import('./pages/CompanySettings/CompanySettings'));
const FinesSearch = React.lazy(() => import('./pages/FinesSearch/FinesSearch'));
const RtaFines = React.lazy(() => import('./pages/RtaFines/RtaFines'));
const MonthlyReport = React.lazy(() => import('./pages/MonthlyReport/MonthlyReport'));

// Beta Invoice Management
const BetaInvoiceManagement = React.lazy(() => import('./pages/BetaInvoiceManagement/BetaInvoiceManagement'));
const BetaInvoiceForm = React.lazy(() => import('./pages/BetaInvoiceManagement/BetaInvoiceForm'));
const BetaInvoicePayment = React.lazy(() => import('./pages/BetaInvoiceManagement/BetaInvoicePayment'));
const BetaInvoiceView = React.lazy(() => import('./pages/BetaInvoiceManagement/BetaInvoiceView'));

// Loading component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
);

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, selectedCompany, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while auth state is being restored
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!token) {
    // Store the attempted URL to redirect back after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!selectedCompany) {
    return <Navigate to="/select-company" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

// Public Route component - Redirects to dashboard if already logged in
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, selectedCompany, isLoading } = useAuth();

  // Show loading while auth state is being restored
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Check both state and localStorage to handle logout timing
  const hasToken = token || localStorage.getItem('token');
  const hasCompany = selectedCompany || localStorage.getItem('selectedCompanyId');

  // If user is logged in and has selected a company, redirect to dashboard
  if (hasToken && hasCompany) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// App content component
const AppContent: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />

          {/* Company selection route */}
          <Route path="/select-company" element={<CompanySelection />} />

          {/* Main Dashboard - Modern Design */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ModernDashboard />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute>
              <ModernPageLayout title="User Management">
                <UserManagement />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/vehicles" element={
            <ProtectedRoute>
              <ModernPageLayout title="Vehicles">
                <VehicleManagement />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/drivers" element={
            <ProtectedRoute>
              <ModernPageLayout title="Drivers">
                <DriverManagement />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/tracking" element={
            <ProtectedRoute>
              <ModernPageLayout title="Tracking">
                <Tracking />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/costs" element={
            <ProtectedRoute>
              <ModernPageLayout title="Cost Management">
                <CostManagement />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/contracts" element={
            <ProtectedRoute>
              <ModernPageLayout title="Contracts">
                <ContractManagement />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/contracts/template/:id" element={
            <ProtectedRoute>
              <ModernPageLayout title="Contract Template">
                <ContractTemplate />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <ModernPageLayout title="Reports">
                <Reports />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/monthly-report" element={
            <ProtectedRoute>
              <ModernPageLayout title="Monthly Report">
                <MonthlyReport />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/compliance" element={
            <ProtectedRoute>
              <ModernPageLayout title="Compliance">
                <Compliance />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <ModernPageLayout title="Settings">
                <Settings />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/fines-search" element={
            <ProtectedRoute>
              <ModernPageLayout title="Fines Search">
                <FinesSearch />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/rta-fines" element={
            <ProtectedRoute>
              <ModernPageLayout title="RTA Fines">
                <RtaFines />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/company-settings" element={
            <ProtectedRoute>
              <ModernPageLayout title="Company Settings">
                <CompanySettings />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <ModernPageLayout title="Profile">
                <Profile />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/cost-management" element={
            <ProtectedRoute>
              <ModernPageLayout title="Expense Management">
                <CostManagement />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/driver-payroll" element={
            <ProtectedRoute>
              <ModernPageLayout title="Driver Payroll">
                <DriverPayroll />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/general-notes" element={
            <ProtectedRoute>
              <ModernPageLayout title="General Notes">
                <GeneralNotes />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          {/* Invoice Management Routes */}
          <Route path="/invoices" element={
            <ProtectedRoute>
              <ModernPageLayout title="Invoices">
                <InvoiceManagement />
              </ModernPageLayout>
            </ProtectedRoute>
          } />
          <Route path="/invoices/new" element={
            <ProtectedRoute>
              <ModernPageLayout title="New Invoice">
                <InvoiceForm />
              </ModernPageLayout>
            </ProtectedRoute>
          } />
          <Route path="/invoices/:id/edit" element={
            <ProtectedRoute>
              <ModernPageLayout title="Edit Invoice">
                <InvoiceForm />
              </ModernPageLayout>
            </ProtectedRoute>
          } />
          <Route path="/invoices/:id/payment" element={
            <ProtectedRoute>
              <ModernPageLayout title="Invoice Payment">
                <InvoicePayment />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/loading-demo" element={
            <ProtectedRoute>
              <ModernPageLayout title="Loading Demo">
                <LoadingDemo />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          <Route path="/receipts" element={
            <ProtectedRoute>
              <ModernPageLayout title="Receipts">
                <ReceiptManagement />
              </ModernPageLayout>
            </ProtectedRoute>
          } />
          <Route path="/receipts/new" element={
            <ProtectedRoute>
              <ModernPageLayout title="New Receipt">
                <ReceiptForm />
              </ModernPageLayout>
            </ProtectedRoute>
          } />
          <Route path="/receipts/:id/edit" element={
            <ProtectedRoute>
              <ModernPageLayout title="Edit Receipt">
                <ReceiptForm />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          {/* Letterhead Management Routes */}
          <Route path="/letterheads" element={
            <ProtectedRoute>
              <ModernPageLayout title="Letterheads">
                <LetterheadManagement />
              </ModernPageLayout>
            </ProtectedRoute>
          } />
          <Route path="/letterheads/:id/pdf" element={
            <ProtectedRoute>
              <ModernPageLayout title="Letterhead PDF">
                <LetterheadPDF />
              </ModernPageLayout>
            </ProtectedRoute>
          } />
          <Route path="/whatsapp-expenses" element={
            <ProtectedRoute>
              <ModernPageLayout title="WhatsApp Expenses">
                <WhatsAppExpenses />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

          {/* Beta Invoice Management Routes */}
          <Route path="/beta-invoices" element={
            <ProtectedRoute>
              <ModernPageLayout title="Invoices">
                <BetaInvoiceManagement />
              </ModernPageLayout>
            </ProtectedRoute>
          } />
          <Route path="/beta-invoices/new" element={
            <ProtectedRoute>
              <ModernPageLayout title="New Invoice">
                <BetaInvoiceForm />
              </ModernPageLayout>
            </ProtectedRoute>
          } />
          <Route path="/beta-invoices/:id" element={
            <ProtectedRoute>
              <ModernPageLayout title="View Invoice">
                <BetaInvoiceView />
              </ModernPageLayout>
            </ProtectedRoute>
          } />
          <Route path="/beta-invoices/:id/edit" element={
            <ProtectedRoute>
              <ModernPageLayout title="Edit Invoice">
                <BetaInvoiceForm />
              </ModernPageLayout>
            </ProtectedRoute>
          } />
          <Route path="/beta-invoices/:id/payment" element={
            <ProtectedRoute>
              <ModernPageLayout title="Invoice Payment">
                <BetaInvoicePayment />
              </ModernPageLayout>
            </ProtectedRoute>
          } />

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
    <ThemeProvider>
      <CssBaseline />
      <Router>
        <AppWrapper />
      </Router>
    </ThemeProvider>
  );
};

export default App;
