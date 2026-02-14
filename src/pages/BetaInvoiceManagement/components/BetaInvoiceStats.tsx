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
            color: theme.palette.info.main,
            bgGradient: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            isAmount: false,
        },
        {
            title: 'Total Amount',
            value: (stats.totalAmount || 0).toFixed(2),
            icon: MoneyIcon,
            color: theme.palette.primary.main,
            bgGradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            isAmount: true,
        },
        {
            title: 'Total Paid',
            value: (stats.totalPaid || 0).toFixed(2),
            icon: PaidIcon,
            color: theme.palette.success.main,
            bgGradient: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            isAmount: true,
        },
        {
            title: 'Outstanding',
            value: (stats.totalOutstanding || 0).toFixed(2),
            icon: OutstandingIcon,
            color: theme.palette.error.main,
            bgGradient: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
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
                                borderRadius: 3,
                                boxShadow: `0 4px 20px ${alpha(card.color, 0.15)}`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: `1px solid ${alpha(card.color, 0.1)}`,
                                overflow: 'hidden',
                                position: 'relative',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: `0 12px 28px ${alpha(card.color, 0.25)}`,
                                },
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '4px',
                                    background: card.bgGradient,
                                },
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box>
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary" 
                                            sx={{ 
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                fontSize: '0.7rem',
                                                mb: 1,
                                            }}
                                        >
                                            {card.title}
                                        </Typography>
                                        <Typography 
                                            variant="h5" 
                                            sx={{ 
                                                fontWeight: 700,
                                                color: card.color,
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
                                                        fontWeight: 600,
                                                        color: theme.palette.text.secondary,
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
                                            width: 44, 
                                            height: 44,
                                            background: card.bgGradient,
                                            boxShadow: `0 4px 14px ${alpha(card.color, 0.4)}`,
                                        }}
                                    >
                                        <Icon sx={{ fontSize: 22, color: 'white' }} />
                                    </Avatar>
                                </Box>
                                <Box 
                                    sx={{ 
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: alpha(card.color, 0.1),
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Box 
                                        sx={{ 
                                            height: '100%',
                                            width: card.isAmount 
                                                ? `${Math.min((parseFloat(card.value.toString()) / (stats.totalAmount || 1)) * 100, 100)}%`
                                                : '100%',
                                            background: card.bgGradient,
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
