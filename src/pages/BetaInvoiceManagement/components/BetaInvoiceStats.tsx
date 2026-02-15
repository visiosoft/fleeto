import React from 'react';
import { Paper, Grid, Typography, Box, Card, CardContent, Avatar, useTheme, alpha } from '@mui/material';
import { 
    Receipt as ReceiptIcon,
    AttachMoney as MoneyIcon,
    CheckCircle as PaidIcon,
    Warning as OutstandingIcon,
} from '@mui/icons-material';
import { InvoiceStats } from '../../../types/api';

interface BetaInvoiceStatsCardProps {
    stats: InvoiceStats | null;
}

const BetaInvoiceStats: React.FC<BetaInvoiceStatsCardProps> = ({ stats }) => {
    const theme = useTheme();

    if (!stats) {
        return null;
    }

    const statsCards = [
        {
            title: 'Total Invoices',
            value: stats.totalInvoices || 0,
            icon: ReceiptIcon,
            color: '#2563EB',
            bgColor: '#EFF6FF',
            isAmount: false,
        },
        {
            title: 'Total Amount',
            value: (stats.totalAmount || 0).toFixed(2),
            icon: MoneyIcon,
            color: '#7C3AED',
            bgColor: '#F5F3FF',
            isAmount: true,
        },
        {
            title: 'Total Paid',
            value: (stats.totalPaid || 0).toFixed(2),
            icon: PaidIcon,
            color: '#10B981',
            bgColor: '#DCFCE7',
            isAmount: true,
        },
        {
            title: 'Outstanding',
            value: (stats.totalOutstanding || 0).toFixed(2),
            icon: OutstandingIcon,
            color: '#F59E0B',
            bgColor: '#FEF3C7',
            isAmount: true,
        },
    ];

    return (
        <Grid container spacing={3}>
            {statsCards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card 
                            sx={{ 
                                height: '100%',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '12px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s ease',
                                overflow: 'hidden',
                                position: 'relative',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                                },
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                color: '#374151',
                                                mb: 1,
                                            }}
                                        >
                                            {card.title}
                                        </Typography>
                                        <Typography 
                                            variant="h5" 
                                            sx={{ 
                                                fontWeight: 700,
                                                fontSize: '28px',
                                                color: '#111827',
                                                display: 'flex',
                                                alignItems: 'baseline',
                                                gap: 0.5,
                                            }}
                                        >
                                            {card.isAmount && (
                                                <Typography 
                                                    component="span" 
                                                    variant="body2" 
                                                    sx={{ 
                                                        fontWeight: 500,
                                                        fontSize: '13px',
                                                        color: '#6B7280',
                                                    }}
                                                >
                                                    AED
                                                </Typography>
                                            )}
                                            {card.value.toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Avatar 
                                        sx={{ 
                                            width: 48, 
                                            height: 48,
                                            backgroundColor: card.bgColor,
                                        }}
                                    >
                                        <Icon sx={{ fontSize: 24, color: card.color }} />
                                    </Avatar>
                                </Box>
                                <Box 
                                    sx={{ 
                                        height: 6,
                                        borderRadius: 9999,
                                        backgroundColor: '#F1F5F9',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Box 
                                        sx={{ 
                                            height: '100%',
                                            width: card.isAmount 
                                                ? `${Math.min((parseFloat(card.value.toString()) / (stats.totalAmount || 1)) * 100, 100)}%`
                                                : '100%',
                                            backgroundColor: card.color,
                                            borderRadius: 9999,
                                            transition: 'width 1s ease-in-out',
                                        }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                );
            })}
        </Grid>
    );
};

export default BetaInvoiceStats;
