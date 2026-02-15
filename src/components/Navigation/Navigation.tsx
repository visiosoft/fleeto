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
  useTheme as useMuiTheme,
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
  Description as InvoiceIcon,
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
  LocalHospital as EmergencyIcon,
  WhatsApp as WhatsAppIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Breadcrumbs from '../Breadcrumbs';

const drawerWidth = 240;
const drawerWidthCollapsed = 65;

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
  { text: 'Dashboard', path: '/dashboard', icon: <AssessmentIcon /> },
  { text: 'Vehicle', path: '/vehicles', icon: <DirectionsCarIcon /> },
  { text: 'Driver', path: '/drivers', icon: <PeopleIcon /> },
  { text: 'Cost', path: '/costs', icon: <AccountBalanceIcon /> },
  { text: 'Contract', path: '/contracts', icon: <GavelIcon /> },
  { text: 'Tracking', path: '/tracking', icon: <LocationOnIcon /> },
  
  { text: 'Invoice', path: '/beta-invoices', icon: <InvoiceIcon /> },
  { text: 'Receipt', path: '/receipts', icon: <ReceiptIcon /> },
  { text: 'Letterhead', path: '/letterheads', icon: <DescriptionIcon /> },
  { text: 'User', path: '/users', icon: <GroupIcon /> },
  {
    text: 'General Notes',
    icon: <NoteIcon />,
    path: '/general-notes',
  },
  { text: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
  { text: 'RTA Fines Search', path: '/fines-search', icon: <GavelIcon /> },
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
  const muiTheme = useMuiTheme();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, companies } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fleetStatus, setFleetStatus] = useState({ active: 38, total: 50 });
  const [isCollapsed, setIsCollapsed] = useState(true); // Default collapsed

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

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleEmergencyHelp = () => {
    // Call 911 or emergency services
    window.location.href = 'tel:911';
  };

  const handleDrawerCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'space-between', alignItems: 'center' }}>
        
        <Tooltip title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} placement="right">
          <IconButton onClick={handleDrawerCollapse} size="small">
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1 }}>
        {MENU_ITEMS.map((item) => (
          <Tooltip key={item.text} title={isCollapsed ? item.text : ''} placement="right">
            <ListItemButton
              component={RouterLink}
              to={item.path}
              sx={{
                minHeight: 48,
                justifyContent: isCollapsed ? 'center' : 'initial',
                px: 2,
                my: 0.5,
                borderRadius: '8px',
                color: '#64748B',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#F1F5F9',
                  color: '#111827',
                },
                '&.Mui-selected': {
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  fontWeight: 600,
                  borderLeft: '3px solid #2563EB',
                  '&:hover': {
                    backgroundColor: '#DBEAFE',
                  },
                },
              }}
              selected={location.pathname === item.path}
            >
              <ListItemIcon sx={{ 
                minWidth: 0, 
                mr: isCollapsed ? 0 : 2,
                justifyContent: 'center',
                color: 'inherit',
              }}>
                {item.icon}
              </ListItemIcon>
              {!isCollapsed && <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '14px',
                  fontWeight: 'inherit',
                }}
              />}
            </ListItemButton>
          </Tooltip>
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
        <Toolbar sx={{
          gap: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: 2,
                display: { sm: 'none' },
                color: muiTheme.palette.text.secondary,
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo and Company Name */}
            <Box
              component={RouterLink}
              to="/dashboard"
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
                <Box
                  component="img"
                  src="/images/van-logo.svg"
                  alt="Fleet Management Logo"
                  sx={{
                    height: 40,
                    width: 40,
                    mr: 2,
                  }}
                />
              )}
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  color: muiTheme.palette.text.primary,
                }}
              >
                {companyName || 'Fleet Management'}
              </Typography>
            </Box>
          </Box>

          {/* Center Section - Search Bar */}
          <Box
            sx={{
              position: 'relative',
              borderRadius: 1,
              backgroundColor: muiTheme.palette.background.paper,
              border: `1px solid ${muiTheme.palette.mode === 'dark' ? '#404040' : '#E2E8F0'}`,
              '&:hover': {
                borderColor: muiTheme.palette.primary.main,
              },
              width: 300,
              display: { xs: 'none', md: 'flex' },
            }}
          >
            <Box sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
              <SearchIcon sx={{ color: muiTheme.palette.text.secondary }} />
              <InputBase
                placeholder="Search by vehicle ID, driver, location..."
                value={searchQuery}
                onChange={handleSearch}
                sx={{
                  color: muiTheme.palette.text.primary,
                  ml: 1,
                  flex: 1,
                  '& input::placeholder': {
                    color: muiTheme.palette.text.secondary,
                    opacity: 0.7,
                  },
                }}
              />
            </Box>
          </Box>

          {/* Right Section */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            {/* Fleet Status */}
            <Box sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1,
              mr: 2,
            }}>
              <AccessTimeIcon sx={{ fontSize: 20, color: muiTheme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ color: muiTheme.palette.text.primary }}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {fleetStatus.active}/{fleetStatus.total} Active
              </Typography>
            </Box>

            {/* Quick Actions */}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Notifications">
                <IconButton
                  size="small"
                  sx={{ color: muiTheme.palette.text.secondary }}
                >
                  <Badge badgeContent={3} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                <IconButton
                  onClick={toggleTheme}
                  size="small"
                  sx={{
                    color: muiTheme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: muiTheme.palette.mode === 'dark' ? '#404040' : '#E2E8F0',
                    }
                  }}
                >
                  {isDarkMode ? <WbSunnyIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Emergency Help Button */}
            <Button
              variant="contained"
              startIcon={<EmergencyIcon />}
              onClick={handleEmergencyHelp}
              size="small"
              sx={{
                display: { xs: 'none', md: 'flex' },
                backgroundColor: muiTheme.palette.error.main,
                color: '#FFFFFF',
                ml: 1,
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: muiTheme.palette.error.dark,
                  transform: 'scale(1.05)',
                  transition: 'transform 0.2s ease-in-out',
                },
                '& .MuiButton-startIcon': {
                  marginRight: 0.5,
                },
              }}
            >
              911
            </Button>

            {/* Profile Menu */}
            <Box sx={{ ml: 1 }}>
              <Tooltip title="Account settings">
                <IconButton
                  size="small"
                  edge="end"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  sx={{ color: muiTheme.palette.text.secondary }}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: muiTheme.palette.primary.main }}>
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
                PaperProps={{
                  sx: {
                    mt: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: `1px solid ${muiTheme.palette.mode === 'dark' ? '#404040' : '#E2E8F0'}`,
                  }
                }}
              >
                <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" sx={{ color: muiTheme.palette.text.secondary }} />
                  </ListItemIcon>
                  <Typography sx={{ color: muiTheme.palette.text.primary }}>Profile</Typography>
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" sx={{ color: muiTheme.palette.text.secondary }} />
                  </ListItemIcon>
                  <Typography sx={{ color: muiTheme.palette.text.primary }}>Settings</Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" sx={{ color: muiTheme.palette.text.secondary }} />
                  </ListItemIcon>
                  <Typography sx={{ color: muiTheme.palette.text.primary }}>Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? isDrawerOpen : true}
        onClose={handleDrawerToggle}
        sx={{
          width: isCollapsed ? drawerWidthCollapsed : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isCollapsed ? drawerWidthCollapsed : drawerWidth,
            boxSizing: 'border-box',
            marginTop: '64px',
            height: 'calc(100% - 64px)',
            border: 'none',
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          pt: 2,
          width: { 
            xs: '100%', 
            sm: `calc(100% - ${isCollapsed ? drawerWidthCollapsed : drawerWidth}px)` 
          },
          marginTop: '64px',
          backgroundColor: (theme) => theme.palette.background.default,
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Breadcrumbs */}
        <Breadcrumbs />
        
        {/* Page Content */}
        <Box sx={{ width: '100%' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Navigation;