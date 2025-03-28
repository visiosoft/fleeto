import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { InvoiceStats } from '../../../types/api';

interface InvoiceStatsCardProps {
  stats: InvoiceStats | null;
}

const InvoiceStatsCard: React.FC<InvoiceStatsCardProps> = ({ stats }) => {
  if (!stats) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} md={3} key={i}>
            <Card>
              <CardContent>
                <Box sx={{ height: 120 }}>
                  <LinearProgress />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  const getStatusPercentage = (amount: number) => {
    return stats.totalAmount > 0 ? (amount / stats.totalAmount) * 100 : 0;
  };

  const formatAmount = (amount: number | undefined) => {
    return amount !== undefined ? amount.toFixed(2) : '0.00';
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <ReceiptIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Invoices</Typography>
            </Box>
            <Typography variant="h4">{stats.totalInvoices || 0}</Typography>
            <Typography variant="body2" color="textSecondary">
              Total Amount: AED {formatAmount(stats.totalAmount)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Paid</Typography>
            </Box>
            <Typography variant="h4">AED {formatAmount(stats.paidAmount)}</Typography>
            <Typography variant="body2" color="textSecondary">
              {stats.byStatus?.paid || 0} invoices
            </Typography>
            <LinearProgress
              variant="determinate"
              value={getStatusPercentage(stats.paidAmount)}
              color="success"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <PaymentIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Pending</Typography>
            </Box>
            <Typography variant="h4">AED {formatAmount(stats.pendingAmount)}</Typography>
            <Typography variant="body2" color="textSecondary">
              {stats.byStatus?.sent || 0} invoices
            </Typography>
            <LinearProgress
              variant="determinate"
              value={getStatusPercentage(stats.pendingAmount)}
              color="warning"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <WarningIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Overdue</Typography>
            </Box>
            <Typography variant="h4">AED {formatAmount(stats.overdueAmount)}</Typography>
            <Typography variant="body2" color="textSecondary">
              {stats.byStatus?.overdue || 0} invoices
            </Typography>
            <LinearProgress
              variant="determinate"
              value={getStatusPercentage(stats.overdueAmount)}
              color="error"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default InvoiceStatsCard; 