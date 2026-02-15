import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Breadcrumbs from '../components/Breadcrumbs';

/**
 * Example: Using custom breadcrumbs on a page
 * 
 * This file demonstrates different ways to use breadcrumbs in your pages
 */

// Example 1: Using breadcrumbs with custom labels
export const ExampleWithCustomBreadcrumbs = () => {
  // Custom breadcrumbs for a specific invoice
  const customCrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Invoice Management', path: '/beta-invoices' },
    { label: 'Invoice #INV-2024-001' }, // Current page, no path
  ];

  return (
    <Box>
      <Breadcrumbs customCrumbs={customCrumbs} />
      <Typography variant="h4">Invoice #INV-2024-001</Typography>
    </Box>
  );
};

// Example 2: Using automatic breadcrumbs (recommended)
export const ExampleWithAutoBreadcrumbs = () => {
  // Breadcrumbs will be automatically generated from route config
  return (
    <Box>
      {/* Just include the component - it handles everything automatically */}
      <Breadcrumbs />
      <Typography variant="h4">Page Content</Typography>
    </Box>
  );
};

// Example 3: Using custom hook for dynamic breadcrumbs
import { useBreadcrumbs } from '../hooks/useBreadcrumbs';

export const ExampleWithDynamicBreadcrumbs = () => {
  const invoiceId = 'INV-2024-001'; // Could come from useParams()
  
  // Pass dynamic labels for specific route segments
  const breadcrumbs = useBreadcrumbs({
    dynamicLabels: {
      // Map route segment to custom label
      [invoiceId]: `Invoice ${invoiceId}`,
    },
  });

  return (
    <Box>
      <Breadcrumbs />
      <Typography variant="h4">Invoice Details</Typography>
    </Box>
  );
};

// Example 4: Page with breadcrumbs and header
export const ExamplePageLayout = () => {
  return (
    <Box>
      {/* Breadcrumbs at the top */}
      <Breadcrumbs />
      
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#0F172A', mb: 1 }}>
          Page Title
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Page description or subtitle
        </Typography>
      </Box>
      
      {/* Page content */}
      <Paper sx={{ p: 3 }}>
        <Typography>Your content here</Typography>
      </Paper>
    </Box>
  );
};
