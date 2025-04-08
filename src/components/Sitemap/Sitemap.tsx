import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Link,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  DirectionsCar as VehicleIcon,
  Person as DriverIcon,
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  Description as ContractIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  BusinessCenter as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

interface SitemapSection {
  title: string;
  items: {
    title: string;
    path: string;
    icon: React.ReactNode;
  }[];
}

const Sitemap: React.FC = () => {
  const theme = useTheme();

  const sections: SitemapSection[] = [
    {
      title: 'Main',
      items: [
        { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
        { title: 'Vehicles', path: '/vehicles', icon: <VehicleIcon /> },
        { title: 'Drivers', path: '/drivers', icon: <DriverIcon /> },
      ],
    },
    {
      title: 'Cost Management',
      items: [
        { title: 'Fuel Management', path: '/cost-management/fuel', icon: <FuelIcon /> },
        { title: 'Maintenance', path: '/cost-management/maintenance', icon: <MaintenanceIcon /> },
        { title: 'Reports', path: '/cost-management/reports', icon: <ReportIcon /> },
      ],
    },
    {
      title: 'Business',
      items: [
        { title: 'Contracts', path: '/contract-management', icon: <ContractIcon /> },
        { title: 'Company Settings', path: '/company-settings', icon: <BusinessIcon /> },
        { title: 'Compliance', path: '/compliance', icon: <SecurityIcon /> },
      ],
    },
    {
      title: 'Settings',
      items: [
        { title: 'Profile', path: '/profile', icon: <PersonIcon /> },
        { title: 'System Settings', path: '/settings', icon: <SettingsIcon /> },
      ],
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sitemap
      </Typography>
      <Grid container spacing={3}>
        {sections.map((section) => (
          <Grid item xs={12} sm={6} md={3} key={section.title}>
            <Paper
              sx={{
                p: 2,
                height: '100%',
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Typography variant="h6" gutterBottom>
                {section.title}
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {section.items.map((item) => (
                  <Box
                    component="li"
                    key={item.path}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: theme.palette.primary.main,
                        mr: 1,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Link
                      component={RouterLink}
                      to={item.path}
                      color="inherit"
                      underline="hover"
                      sx={{
                        '&:hover': {
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      {item.title}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Sitemap; 