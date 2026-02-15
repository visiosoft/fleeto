import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Breadcrumbs as MuiBreadcrumbs, 
  Typography, 
  Box,
  styled
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

// Styled breadcrumb link
const BreadcrumbLink = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: '#64748B',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'color 0.2s ease',
  '&:hover': {
    color: '#2563EB',
    textDecoration: 'none',
  },
}));

// Styled current page text
const CurrentPageText = styled(Typography)({
  display: 'flex',
  alignItems: 'center',
  color: '#0F172A',
  fontSize: '14px',
  fontWeight: 600,
});

// Breadcrumb configuration
export interface BreadcrumbConfig {
  [key: string]: {
    label: string;
    parent?: string;
    icon?: React.ReactNode;
  };
}

// Default breadcrumb configuration
export const defaultBreadcrumbConfig: BreadcrumbConfig = {
  '/dashboard': { label: 'Dashboard', icon: <HomeIcon sx={{ fontSize: 18, mr: 0.5 }} /> },
  '/vehicles': { label: 'Vehicles', parent: '/dashboard' },
  '/drivers': { label: 'Drivers', parent: '/dashboard' },
  '/tracking': { label: 'Vehicle Tracking', parent: '/dashboard' },
  '/costs': { label: 'Cost Management', parent: '/dashboard' },
  '/contracts': { label: 'Contracts', parent: '/dashboard' },
  '/contracts/template': { label: 'Contract Template', parent: '/contracts' },
  '/reports': { label: 'Reports', parent: '/dashboard' },
  '/compliance': { label: 'Compliance', parent: '/dashboard' },
  '/settings': { label: 'Settings', parent: '/dashboard' },
  '/fines-search': { label: 'RTA Fines Search', parent: '/dashboard' },
  '/company-settings': { label: 'Company Settings', parent: '/settings' },
  '/profile': { label: 'Profile', parent: '/settings' },
  '/users': { label: 'User Management', parent: '/settings' },
  '/cost-management': { label: 'Cost Management', parent: '/dashboard' },
  '/driver-payroll': { label: 'Driver Payroll', parent: '/drivers' },
  '/general-notes': { label: 'General Notes', parent: '/dashboard' },
  
  // Invoice routes
  '/invoices': { label: 'Invoices', parent: '/dashboard' },
  '/invoices/new': { label: 'Create Invoice', parent: '/invoices' },
  '/invoices/edit': { label: 'Edit Invoice', parent: '/invoices' },
  '/invoices/payment': { label: 'Invoice Payment', parent: '/invoices' },
  
  // Beta Invoice routes
  '/beta-invoices': { label: 'Invoice Management', parent: '/dashboard' },
  '/beta-invoices/new': { label: 'Create Invoice', parent: '/beta-invoices' },
  '/beta-invoices/edit': { label: 'Edit Invoice', parent: '/beta-invoices' },
  '/beta-invoices/view': { label: 'View Invoice', parent: '/beta-invoices' },
  '/beta-invoices/payment': { label: 'Invoice Payment', parent: '/beta-invoices' },
  
  // Receipt routes
  '/receipts': { label: 'Receipts', parent: '/dashboard' },
  '/receipts/new': { label: 'Create Receipt', parent: '/receipts' },
  '/receipts/edit': { label: 'Edit Receipt', parent: '/receipts' },
  
  // Letterhead routes
  '/letterheads': { label: 'Letterhead Templates', parent: '/dashboard' },
  '/letterheads/pdf': { label: 'View Letterhead', parent: '/letterheads' },
  
  // Other routes
  '/whatsapp-expenses': { label: 'WhatsApp Expenses', parent: '/dashboard' },
  '/loading-demo': { label: 'Loading Demo', parent: '/dashboard' },
};

interface BreadcrumbsProps {
  config?: BreadcrumbConfig;
  customCrumbs?: Array<{ label: string; path?: string }>;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  config = defaultBreadcrumbConfig,
  customCrumbs 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    if (customCrumbs) {
      return customCrumbs;
    }

    const crumbs: Array<{ label: string; path?: string }> = [];
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // Handle dynamic routes
    let currentPath = '';
    for (let i = 0; i < pathSegments.length; i++) {
      currentPath += `/${pathSegments[i]}`;
      
      // Check if this is a dynamic segment (e.g., ID)
      const isId = /^[0-9a-f]{24}$|^\d+$/.test(pathSegments[i]);
      
      if (isId && i > 0) {
        // Use the parent route pattern for dynamic IDs
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const baseRoute = config[parentPath];
        
        if (baseRoute) {
          // For view/edit actions
          if (i === pathSegments.length - 1) {
            crumbs.push({ label: baseRoute.label, path: currentPath });
          }
        }
      } else {
        const routeConfig = config[currentPath];
        
        if (routeConfig) {
          // Add parent breadcrumbs recursively
          if (routeConfig.parent && !crumbs.find(c => c.path === routeConfig.parent)) {
            const parent = config[routeConfig.parent!];
            if (parent) {
              crumbs.push({ label: parent.label, path: routeConfig.parent });
            }
          }
          
          crumbs.push({ 
            label: routeConfig.label, 
            path: i === pathSegments.length - 1 ? undefined : currentPath 
          });
        }
      }
    }
    
    return crumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on login/register/landing pages
  if (['/login', '/register', '/', '/select-company'].includes(location.pathname)) {
    return null;
  }

  // Don't show if only one breadcrumb (just current page)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Box sx={{ mb: 2, mt: -0.5 }}>
      <MuiBreadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: 18, color: '#94A3B8' }} />}
        aria-label="breadcrumb"
        sx={{
          fontSize: '14px',
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap',
          },
        }}
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          if (isLast || !crumb.path) {
            return (
              <CurrentPageText key={index}>
                {crumb.label}
              </CurrentPageText>
            );
          }
          
          return (
            <BreadcrumbLink
              key={index}
              to={crumb.path}
              onClick={(e) => {
                e.preventDefault();
                navigate(crumb.path!);
              }}
            >
              {index === 0 && config[crumb.path]?.icon}
              {crumb.label}
            </BreadcrumbLink>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;
