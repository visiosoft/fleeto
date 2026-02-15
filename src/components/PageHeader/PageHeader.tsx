import React from 'react';
import { Box, Typography, Button, Chip, Divider } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  };
  actions?: React.ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * PageHeader Component
 * 
 * A reusable page header component that works well with breadcrumbs.
 * Should be placed below Breadcrumbs component.
 * 
 * @example
 * <Box>
 *   <Breadcrumbs />
 *   <PageHeader 
 *     title="Invoice Management"
 *     subtitle="Manage all your invoices in one place"
 *     badge={{ label: 'Beta', color: 'info' }}
 *     actions={
 *       <Button variant="contained" startIcon={<AddIcon />}>
 *         Create Invoice
 *       </Button>
 *     }
 *   />
 * </Box>
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  sx = {},
}) => {
  return (
    <Box sx={{ mb: 3, ...sx }}>
      {/* Title Row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: subtitle ? 1 : 2,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {/* Title and Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              fontSize: '28px',
              color: '#0F172A',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          
          {badge && (
            <Chip
              label={badge.label}
              color={badge.color || 'default'}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '12px',
                height: '24px',
              }}
            />
          )}
        </Box>

        {/* Actions */}
        {actions && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {actions}
          </Box>
        )}
      </Box>

      {/* Subtitle */}
      {subtitle && (
        <Typography
          variant="body1"
          sx={{
            color: '#64748B',
            fontSize: '14px',
            mb: 2,
          }}
        >
          {subtitle}
        </Typography>
      )}

      {/* Divider */}
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
};

export default PageHeader;
