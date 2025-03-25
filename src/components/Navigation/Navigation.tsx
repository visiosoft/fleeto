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
import { Link as RouterLink } from 'react-router-dom';

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
  { text: 'Dashboard', path: '/', icon: <AssessmentIcon /> },
  { text: 'Vehicle Management', path: '/vehicles', icon: <DirectionsCarIcon /> },
  { text: 'Driver Management', path: '/drivers', icon: <PeopleIcon /> },
  { text: 'Tracking', path: '/tracking', icon: <LocationOnIcon /> },
  { text: 'Cost Management', path: '/costs', icon: <MonetizationOnIcon /> },
  { text: 'Contracts', path: '/contracts', icon: <DescriptionIcon /> },
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

const Navigation: React.FC<NavigationProps> = ({
  children,
  isMobile,
  isDrawerOpen,
  handleDrawerToggle,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Memoize the menu list to prevent unnecessary re-renders
  const menuList = useMemo(() => (
    <List>
      {MENU_ITEMS.map((item) => (
        <ListItemButton
          key={item.path}
          component={RouterLink}
          to={item.path}
          sx={{
            minHeight: 48,
            px: 2.5,
          }}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      ))}
    </List>
  ), []);

  return (
    <Box sx={{ 
      display: 'flex',
      width: '100%',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Fleet Manager
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? isDrawerOpen : true}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            marginTop: '64px',
            height: 'calc(100% - 64px)',
            border: 'none'
          },
        }}
      >
        <List>
          {MENU_ITEMS.map((item) => (
            <ListItemButton
              key={item.text}
              component={RouterLink}
              to={item.path}
              sx={{
                minHeight: 48,
                px: 2.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          marginTop: '64px',
          backgroundColor: (theme) => theme.palette.background.default,
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
          '& > *': {
            width: '100%',
          }
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Navigation;