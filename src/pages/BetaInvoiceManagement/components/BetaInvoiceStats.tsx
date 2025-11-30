import React from 'react';
import { Paper, Grid, Typography, Box } from '@mui/material';
import { InvoiceStats } from '../../../types/api';

interface BetaInvoiceStatsCardProps {
    stats: InvoiceStats | null;
}

const BetaInvoiceStats: React.FC<BetaInvoiceStatsCardProps> = ({ stats }) => {
    if (!stats) {
        return null;
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Invoice Statistics
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Total Invoices
                        </Typography>
                        <Typography variant="h5">
                            {stats.totalInvoices || 0}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Total Amount
                        </Typography>
                        <Typography variant="h5" color="primary">
                            AED {(stats.totalAmount || 0).toFixed(2)}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Total Paid
                        </Typography>
                        <Typography variant="h5" color="success.main">
                            AED {(stats.totalPaid || 0).toFixed(2)}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Outstanding
                        </Typography>
                        <Typography variant="h5" color="error.main">
                            AED {(stats.totalOutstanding || 0).toFixed(2)}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default BetaInvoiceStats;
