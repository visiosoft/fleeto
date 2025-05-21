import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Tooltip,
  Badge,
  InputBase,
  Button,
  Stack,
  Chip,
  alpha,
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
  AccountBalance as AccountBalanceIcon,
  Note as NoteIcon,
  Receipt as ReceiptIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  AccountCircle as AccountCircleIcon,
  AttachMoney as PayrollIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Map as MapIcon,
  List as ListIcon,
  Help as HelpIcon,
  WbSunny as WbSunnyIcon,
  DarkMode as DarkModeIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

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
  { text: 'User Management', path: '/users', icon: <GroupIcon /> },
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
  const { logout, user, companies } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fleetStatus, setFleetStatus] = useState({ active: 38, total: 50 });

  useEffect(() => {
    // Get company name and logo from localStorage
    const savedCompanies = localStorage.getItem('companies');
    if (savedCompanies) {
      try {
        const parsedCompanies = JSON.parse(savedCompanies);
        if (parsedCompanies && parsedCompanies.length > 0) {
          setCompanyName(parsedCompanies[0].name);
          setCompanyLogo(parsedCompanies[0].logo || '');
        }
      } catch (error) {
        console.error('Error parsing companies from localStorage:', error);
      }
    }
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
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

  const handleViewModeToggle = () => {
    setViewMode(viewMode === 'map' ? 'list' : 'map');
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // TODO: Implement theme switching
  };

  const handleEmergencyHelp = () => {
    // TODO: Implement emergency help functionality
    console.log('Emergency help requested');
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          {'Fleet Management'}
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
          backgroundColor: theme.palette.primary.main,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Logo and Company Name */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              minWidth: 200,
            }}
          >
            {companyLogo ? (
              <Box
                component="img"
                src={companyLogo}
                alt="Company Logo"
                sx={{
                  height: 40,
                  width: 'auto',
                  mr: 2,
                }}
              />
            ) : (
              <BusinessIcon sx={{ fontSize: 32, mr: 1 }} />
            )}
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 600,
                letterSpacing: '0.02em',
                color: '#FFFFFF',
              }}
            >
              {companyName || 'Fleet Management'}
            </Typography>
          </Box>

          {/* Quick Access Menu */}
          <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
            <Tooltip title="Toggle View">
              <IconButton color="inherit" onClick={handleViewModeToggle}>
                {viewMode === 'map' ? <ListIcon /> : <MapIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Engine Faults">
              <IconButton color="inherit">
                <Badge badgeContent={2} color="error">
                  <WarningIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Geofence Alerts">
              <IconButton color="inherit">
                <Badge badgeContent={1} color="warning">
                  <TimerIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Search Bar */}
          <Box
            sx={{
              position: 'relative',
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.common.white, 0.15),
              '&:hover': {
                backgroundColor: alpha(theme.palette.common.white, 0.25),
              },
              width: 300,
              display: { xs: 'none', md: 'flex' },
            }}
          >
            <Box sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
              <SearchIcon sx={{ color: 'white' }} />
              <InputBase
                placeholder="Search by vehicle ID, driver, location..."
                value={searchQuery}
                onChange={handleSearch}
                sx={{
                  color: 'white',
                  ml: 1,
                  flex: 1,
                  '& input::placeholder': {
                    color: 'white',
                    opacity: 0.7,
                  },
                }}
              />
            </Box>
          </Box>

          {/* Fleet Status */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: 'white' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {fleetStatus.active}/{fleetStatus.total} Vehicles Active
            </Typography>
          </Box>

          {/* Theme Toggle */}
          <IconButton color="inherit" onClick={handleDarkModeToggle}>
            {isDarkMode ? <WbSunnyIcon /> : <DarkModeIcon />}
          </IconButton>

          {/* Emergency Help Button */}
          <Button
            variant="contained"
            color="error"
            startIcon={<HelpIcon />}
            onClick={handleEmergencyHelp}
            sx={{
              display: { xs: 'none', md: 'flex' },
              backgroundColor: theme.palette.error.main,
              '&:hover': {
                backgroundColor: theme.palette.error.dark,
              },
            }}
          >
            Emergency
          </Button>
          
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
                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
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