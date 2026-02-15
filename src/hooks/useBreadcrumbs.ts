import { useLocation, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { defaultBreadcrumbConfig, BreadcrumbConfig } from '../components/Breadcrumbs/Breadcrumbs';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface UseBreadcrumbsOptions {
  config?: BreadcrumbConfig;
  dynamicLabels?: { [key: string]: string };
}

/**
 * Custom hook for generating breadcrumbs based on current route
 * @param options Configuration options
 * @returns Array of breadcrumb items
 */
export const useBreadcrumbs = (options: UseBreadcrumbsOptions = {}) => {
  const location = useLocation();
  const params = useParams();
  const { config = defaultBreadcrumbConfig, dynamicLabels = {} } = options;

  const breadcrumbs = useMemo(() => {
    const crumbs: BreadcrumbItem[] = [];
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    let currentPath = '';
    
    for (let i = 0; i < pathSegments.length; i++) {
      currentPath += `/${pathSegments[i]}`;
      const segment = pathSegments[i];
      
      // Check if this is a dynamic ID segment
      const isId = /^[0-9a-f]{24}$|^\d+$/.test(segment);
      
      if (isId) {
        // Handle dynamic route segments (IDs)
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const action = pathSegments[i + 1]; // Could be 'edit', 'view', 'payment', etc.
        
        if (action) {
          // Path like /invoices/:id/edit
          const actionPath = `${basePath}/${action}`;
          const actionConfig = config[actionPath];
          
          if (actionConfig) {
            // Add the dynamic label if provided
            const label = dynamicLabels[segment] || actionConfig.label;
            crumbs.push({ label, path: undefined }); // Last item, no path
            break;
          }
        } else {
          // Path like /invoices/:id (view)
          const viewPath = `${basePath}/view`;
          const viewConfig = config[viewPath];
          
          if (viewConfig) {
            const label = dynamicLabels[segment] || viewConfig.label;
            crumbs.push({ label, path: undefined });
          }
        }
      } else {
        // Static route segment
        const routeConfig = config[currentPath];
        
        if (routeConfig) {
          // Add parent breadcrumbs if not already added
          if (routeConfig.parent) {
            const parentConfig = config[routeConfig.parent];
            if (parentConfig && !crumbs.find(c => c.path === routeConfig.parent)) {
              crumbs.push({
                label: parentConfig.label,
                path: routeConfig.parent,
                icon: parentConfig.icon,
              });
            }
          }
          
          // Add current breadcrumb
          const isLast = i === pathSegments.length - 1 && !isId;
          crumbs.push({
            label: routeConfig.label,
            path: isLast ? undefined : currentPath,
            icon: routeConfig.icon,
          });
        }
      }
    }
    
    return crumbs;
  }, [location.pathname, config, dynamicLabels]);

  return breadcrumbs;
};

/**
 * Hook to get the current page title from breadcrumbs
 */
export const usePageTitle = (options: UseBreadcrumbsOptions = {}) => {
  const breadcrumbs = useBreadcrumbs(options);
  return breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : '';
};

/**
 * Hook to determine if breadcrumbs should be shown
 */
export const useShouldShowBreadcrumbs = () => {
  const location = useLocation();
  const excludedPaths = ['/login', '/register', '/', '/select-company'];
  return !excludedPaths.includes(location.pathname);
};
