import React from 'react';
import { Chip, ChipProps } from '@mui/material';

type StatusType = 'paid' | 'pending' | 'overdue' | 'draft' | 'active' | 'inactive' | 'success' | 'warning' | 'danger';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: StatusType;
  label?: string;
}

const statusConfig: Record<StatusType, { bgcolor: string; color: string; label?: string }> = {
  paid: {
    bgcolor: '#DCFCE7',
    color: '#166534',
    label: 'Paid',
  },
  active: {
    bgcolor: '#DCFCE7',
    color: '#166534',
    label: 'Active',
  },
  success: {
    bgcolor: '#DCFCE7',
    color: '#166534',
    label: 'Success',
  },
  pending: {
    bgcolor: '#FEF3C7',
    color: '#92400E',
    label: 'Pending',
  },
  warning: {
    bgcolor: '#FEF3C7',
    color: '#92400E',
    label: 'Warning',
  },
  overdue: {
    bgcolor: '#FEE2E2',
    color: '#991B1B',
    label: 'Overdue',
  },
  danger: {
    bgcolor: '#FEE2E2',
    color: '#991B1B',
    label: 'Danger',
  },
  draft: {
    bgcolor: '#E5E7EB',
    color: '#374151',
    label: 'Draft',
  },
  inactive: {
    bgcolor: '#E5E7EB',
    color: '#374151',
    label: 'Inactive',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, sx, ...props }) => {
  const config = statusConfig[status];

  return (
    <Chip
      label={label || config.label}
      size="small"
      sx={{
        backgroundColor: config.bgcolor,
        color: config.color,
        fontWeight: 500,
        fontSize: '0.8125rem',
        height: 24,
        borderRadius: '9999px',
        '& .MuiChip-label': {
          padding: '4px 12px',
        },
        ...sx,
      }}
      {...props}
    />
  );
};

export default StatusBadge;
