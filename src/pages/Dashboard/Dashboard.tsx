import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Person as DriverIcon,
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  Warning as AlertIcon,
  CheckCircle as HealthIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
}> = ({ title, value, icon, trend, trendValue, color }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ my: 1, color: color }}>
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {trend === 'up' ? (
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: '1rem' }} />
                ) : (
                  <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: '1rem' }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
                    ml: 0.5,
                  }}
                >
                  {trendValue}
                </Typography>
              </Box>
            )}
          </Box>
          <Box>
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const AlertCard: React.FC<{
  title: string;
  alerts: { message: string; severity: 'low' | 'medium' | 'high' }[];
}> = ({ title, alerts }) => {
  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ mt: 2 }}>
          {alerts.map((alert, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1,
                p: 1,
                backgroundColor: (theme) => theme.palette.grey[50],
                borderRadius: 1,
              }}
            >
              <AlertIcon 
                sx={{ 
                  color: (theme) => {
                    const color = getSeverityColor(alert.severity);
                    return theme.palette[color].main;
                  },
                  mr: 1 
                }} 
              />
              <Typography variant="body2">{alert.message}</Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

const HealthCard: React.FC<{
  title: string;
  items: { name: string; health: number }[];
}> = ({ title, items }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ mt: 2 }}>
        {items.map((item, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">{item.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {item.health}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={item.health}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: (theme) => theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: (theme) =>
                    item.health > 70
                      ? theme.palette.success.main
                      : item.health > 30
                      ? theme.palette.warning.main
                      : theme.palette.error.main,
                },
              }}
            />
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const theme = useTheme();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Vehicles"
            value="124"
            icon={<CarIcon />}
            trend="up"
            trendValue="+5% this month"
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Drivers"
            value="89"
            icon={<DriverIcon />}
            trend="up"
            trendValue="+2% this month"
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fuel Consumption"
            value="4,827L"
            icon={<FuelIcon />}
            trend="down"
            trendValue="-3% this month"
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Maintenance Cost"
            value="$12,480"
            icon={<MaintenanceIcon />}
            trend="up"
            trendValue="+8% this month"
            color={theme.palette.error.main}
          />
        </Grid>

        {/* Fleet Health */}
        <Grid item xs={12} md={6}>
          <HealthCard
            title="Fleet Health Status"
            items={[
              { name: 'Vehicle Maintenance', health: 85 },
              { name: 'Driver Performance', health: 92 },
              { name: 'Fuel Efficiency', health: 78 },
              { name: 'Documentation', health: 95 },
            ]}
          />
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={6}>
          <AlertCard
            title="Recent Alerts"
            alerts={[
              {
                message: '5 vehicles due for maintenance next week',
                severity: 'medium',
              },
              {
                message: '3 driver licenses expiring in 30 days',
                severity: 'high',
              },
              {
                message: 'Fuel consumption above average in 2 vehicles',
                severity: 'low',
              },
              {
                message: '7 vehicles need tire inspection',
                severity: 'medium',
              },
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 