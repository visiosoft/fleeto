import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
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
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Divider,
  ListItem
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
  Logout as LogoutIcon,
  Person as PersonIcon,
  AccountCircle as AccountCircleIcon,
  AccountBalance as AccountBalanceIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Note as NoteIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  Person as DriverIcon,
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  AttachMoney as PayrollIcon,
  Receipt as ReceiptIcon,
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
  { text: 'Dashboard', path: '/', icon: <AssessmentIcon /> },
  { text: 'Vehicle Management', path: '/vehicles', icon: <DirectionsCarIcon /> },
  { text: 'Driver Management', path: '/drivers', icon: <PeopleIcon /> },
  { text: 'Cost Management', path: '/costs', icon: <AccountBalanceIcon /> },
  { text: 'Contract', path: '/contracts', icon: <DescriptionIcon /> },
  { text: 'Tracking', path: '/tracking', icon: <LocationOnIcon /> },
  { text: 'Invoice Management', path: '/invoices', icon: <ReceiptIcon /> },
  {
    text: 'General Notes',
    icon: <NoteIcon />,
    path: '/general-notes',
  },
  { text: 'Driver Payroll', icon: <PayrollIcon />, path: '/driver-payroll' },
  { text: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
  { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

// Memoized MenuItem component
const MenuItemComponent = React.memo(({ 
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
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Fleet Management
        </Typography>
      </Toolbar>
      <Divider />
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
            selected={location.pathname === item.path}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      
      </List>
    </div>
  );

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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {MENU_ITEMS.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          
          {/* Profile Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Account settings">
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                  <AccountCircleIcon />
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
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
        {drawer}
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