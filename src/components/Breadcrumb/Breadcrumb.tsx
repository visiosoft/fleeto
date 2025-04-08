import React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Breadcrumbs,
  Link,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

const routeLabels: { [key: string]: string } = {
  dashboard: 'Dashboard',
  vehicles: 'Vehicle Management',
  drivers: 'Driver Management',
  tracking: 'Tracking',
  contracts: 'Contract Management',
  reports: 'Reports',
  compliance: 'Compliance',
  settings: 'Settings',
  profile: 'Profile',
  'cost-management': 'Cost Management',
  'driver-payroll': 'Driver Payroll',
  'general-notes': 'General Notes',
  invoices: 'Invoice Management',
  companies: 'Company Management',
  users: 'User Management',
  sitemap: 'Sitemap',
  'company-settings': 'Company Settings',
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getLabel = (path: string) => {
    return routeLabels[path] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: theme.palette.text.secondary,
          },
        }}
      >
        <Link
          component={RouterLink}
          to="/dashboard"
          color="inherit"
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          Home
        </Link>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const label = getLabel(value);

          return last ? (
            <Typography
              key={to}
              color="text.primary"
              sx={{ textTransform: 'capitalize' }}
            >
              {label}
            </Typography>
          ) : (
            <Link
              component={RouterLink}
              to={to}
              color="inherit"
              underline="hover"
              key={to}
              sx={{ textTransform: 'capitalize' }}
            >
              {label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default Breadcrumb; 