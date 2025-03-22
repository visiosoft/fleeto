import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DirectionsCar as DirectionsCarIcon,
  Person as PeopleIcon,
  LocationOn as LocationOnIcon,
  Build as BuildIcon,
  LocalGasStation as LocalGasStationIcon,
  AttachMoney as MonetizationOnIcon,
  Assessment as AssessmentIcon,
  Gavel as GavelIcon,
  Settings as SettingsIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

interface NavigationProps {
  children: React.ReactNode;
  isMobile: boolean;
  isDrawerOpen: boolean;
  handleDrawerToggle: () => void;
}

interface MenuItem {
  text: string;
  path: string;
  icon: JSX.Element;
}

// Define menu items outside the component
const MENU_ITEMS: MenuItem[] = [
  { text: 'Vehicle Management', path: '/', icon: <DirectionsCarIcon /> },
  { text: 'Driver Management', path: '/drivers', icon: <PeopleIcon /> },
  { text: 'Tracking', path: '/tracking', icon: <LocationOnIcon /> },
  { text: 'Maintenance', path: '/maintenance', icon: <BuildIcon /> },
  { text: 'Fuel Management', path: '/fuel', icon: <LocalGasStationIcon /> },
  { text: 'Cost Management', path: '/costs', icon: <MonetizationOnIcon /> },
  { text: 'Contract Management', path: '/contracts', icon: <DescriptionIcon /> },
  { text: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
  { text: 'Compliance', path: '/compliance', icon: <GavelIcon /> },
  { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  { text: 'Company Profile', path: '/company-settings', icon: <BusinessIcon /> },
];

// Memoized MenuItem component
const MenuItem = React.memo(({ 
  item, 
  isSelected, 
  onClick 
}: { 
  item: MenuItem; 
  isSelected: boolean; 
  onClick: () => void;
}) => (
  <ListItemButton
    selected={isSelected}
    onClick={onClick}
  >
    <ListItemIcon>{item.icon}</ListItemIcon>
    <ListItemText primary={item.text} />
  </ListItemButton>
));

const Navigation = React.memo(function Navigation({ isMobile, isDrawerOpen, handleDrawerToggle, children }: NavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Memoize the menu list to prevent unnecessary re-renders
  const menuList = useMemo(() => (
    <List>
      {MENU_ITEMS.map((item) => (
        <MenuItem
          key={item.path}
          item={item}
          isSelected={location.pathname === item.path}
          onClick={() => {
            navigate(item.path);
            if (isMobile) {
              handleDrawerToggle();
            }
          }}
        />
      ))}
    </List>
  ), [location.pathname, navigate, isMobile, handleDrawerToggle]);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, ...(isDrawerOpen && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Fleet Management System
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isDrawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          {menuList}
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
});

export default Navigation;