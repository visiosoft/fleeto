import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Navigation from './components/Navigation/Navigation';
import VehicleManagement from './pages/VehicleManagement/VehicleManagement';
import DriverManagement from './pages/DriverManagement';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Tracking from './pages/Tracking/Tracking';
import FuelManagement from './pages/FuelManagement/FuelManagement';
import CostManagement from './pages/CostManagement/CostManagement';
import Compliance from './pages/Compliance/Compliance';
import ContractManagement from './pages/ContractManagement/ContractManagement';

// Create a theme instance
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navigation>
          <Routes>
            <Route path="/" element={<VehicleManagement />} />
            <Route path="/drivers" element={<DriverManagement />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/fuel" element={<FuelManagement />} />
            <Route path="/costs" element={<CostManagement />} />
            <Route path="/contracts" element={<ContractManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Navigation>
      </Router>
    </ThemeProvider>
  );
}

export default App;
