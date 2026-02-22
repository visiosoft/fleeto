import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import { Construction, Delete, LocalAirport, LocalFireDepartment, LocalShipping, Restaurant, School, DirectionsBus } from '@mui/icons-material';

const IndustryVerticals: React.FC = () => {
    const verticals = [
        {
            icon: <Construction sx={{ fontSize: 32, color: '#0071e3' }} />,
            title: 'Construction Fleet Management',
            description: 'Heavy equipment, cranes, and construction vehicles — all tracked and managed for maximum uptime.'
        },
        {
            icon: <Delete sx={{ fontSize: 32, color: '#059669' }} />,
            title: 'Waste Management',
            description: 'Optimize routes, monitor pickups, and ensure compliance for waste collection fleets.'
        },
        {
            icon: <LocalAirport sx={{ fontSize: 32, color: '#328B9B' }} />,
            title: 'Airports',
            description: 'Track airside vehicles, shuttle buses, and ground support equipment for airport operations.'
        },
        {
            icon: <LocalFireDepartment sx={{ fontSize: 32, color: '#dc2626' }} />,
            title: 'Emergency Response',
            description: 'Ambulances, fire trucks, and emergency vehicles with real-time dispatch and monitoring.'
        },
        {
            icon: <LocalShipping sx={{ fontSize: 32, color: '#7c3aed' }} />,
            title: 'Delivery',
            description: 'Last-mile delivery, courier, and logistics fleets with route optimization and proof of delivery.'
        },
        {
            icon: <Restaurant sx={{ fontSize: 32, color: '#f59e42' }} />,
            title: 'Food and Beverage',
            description: 'Temperature monitoring, delivery tracking, and compliance for F&B distribution.'
        },
        {
            icon: <School sx={{ fontSize: 32, color: '#eab308' }} />,
            title: 'School Transportation',
            description: 'School bus tracking, student safety, and parent notifications for educational institutions.'
        },
        {
            icon: <DirectionsBus sx={{ fontSize: 32, color: '#0B3C5D' }} />,
            title: 'Public Transportation',
            description: 'Monitor city buses, shuttles, and public transit for schedule adherence and passenger safety.'
        },
    ];

    return (
        <Box id="industry-verticals" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#f5f7fa' }}>
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: { xs: '2rem', md: '2.7rem' },
                            fontWeight: 600,
                            fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                            color: '#1d1d1f',
                            mb: 2,
                            letterSpacing: '-0.015em',
                        }}
                    >
                        Industry Verticals
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            fontSize: { xs: '1rem', md: '1.15rem' },
                            color: '#64748b',
                            maxWidth: 700,
                            mx: 'auto',
                            lineHeight: 1.7,
                        }}
                    >
                        FleetOZ is trusted by organizations across diverse industries in the UAE
                    </Typography>
                </Box>
                <Grid container spacing={3}>
                    {verticals.map((vertical, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    height: '100%',
                                    bgcolor: 'white',
                                    border: '1px solid #e5e5e7',
                                    borderRadius: '18px',
                                    boxShadow: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                    },
                                }}
                            >
                                <Box sx={{ mb: 2 }}>{vertical.icon}</Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, fontSize: '1.05rem' }}>
                                    {vertical.title}
                                </Typography>
                                <Typography sx={{ fontSize: '0.93rem', color: '#6e6e73', lineHeight: 1.5 }}>
                                    {vertical.description}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default IndustryVerticals;
