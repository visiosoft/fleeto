import React, { useState, useEffect } from 'react';
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
  ListItem,
  Button
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
  Group as GroupIcon,
  BusinessCenter as BusinessCenterIcon,
  Security as SecurityIcon,
  AccountTree as SitemapIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumb from '../Breadcrumb/Breadcrumb';

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
  { text: 'Company Management', path: '/companies', icon: <BusinessIcon /> },
  { text: 'User Management', path: '/users', icon: <GroupIcon /> },
  {
    text: 'General Notes',
    icon: <NoteIcon />,
    path: '/general-notes',
  },
  { text: 'Driver Payroll', icon: <PayrollIcon />, path: '/driver-payroll' },
  { text: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
  { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  { text: 'Sitemap', path: '/sitemap', icon: <SitemapIcon /> },
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
  const { logout, user, companies } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    // Get company name from localStorage
    const savedCompanies = localStorage.getItem('companies');
    if (savedCompanies) {
      try {
        const parsedCompanies = JSON.parse(savedCompanies);
        if (parsedCompanies && parsedCompanies.length > 0) {
          setCompanyName(parsedCompanies[0].name);
        }
      } catch (error) {
        console.error('Error parsing companies from localStorage:', error);
      }
    }
  }, []);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
         { 'Fleet Management'}
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
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          zIndex: theme.zIndex.drawer + 1,
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
            {companyName || 'Fleeto'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              color="inherit"
              startIcon={<BusinessIcon />}
              onClick={() => navigate('/company-settings')}
            >
              Company Settings
            </Button>
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.firstName?.[0] || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
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
      <Box
        component="nav"
        sx={{ 
          width: { sm: drawerWidth }, 
          flexShrink: { sm: 0 },
          mt: '64px',
          height: 'calc(100vh - 64px)',
        }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={isDrawerOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                height: '100%',
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                height: '100%',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          mt: '64px',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          overflow: 'auto',
          bgcolor: 'background.default',
          '& > *': {
            width: '100%',
            p: 1.75,
            maxWidth: '100%',
            boxSizing: 'border-box',
          }
        }}
      >
        <Box sx={{ p: 1.75 }}>
          <Breadcrumb />
        </Box>
        <Box sx={{ p: 1.75 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Navigation;