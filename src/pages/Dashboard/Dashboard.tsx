import React, { useState, useEffect } from 'react';
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
  Tab,
  Tabs,
  Divider,
  CircularProgress,
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
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { API_CONFIG, getApiUrl } from '../../config/api';
import costService from '../../services/costService';

// Mock data for fuel summary - replace with actual API calls
const fuelData = {
  monthlyCost: 1480,
  yearToDate: 12750,
  avgConsumption: 9.2, // L/100km
  trendPercentage: -3,
  byVehicleType: [
    { id: 'Sedan', value: 35 },
    { id: 'SUV', value: 40 },
    { id: 'Van', value: 15 },
    { id: 'Truck', value: 10 },
  ] as ChartDataItem[],
  monthlyTrend: [
    { month: 'Jan', cost: 1250 },
    { month: 'Feb', cost: 1350 },
    { month: 'Mar', cost: 1420 },
    { month: 'Apr', cost: 1380 },
    { month: 'May', cost: 1480 },
  ]
};

// Define types for our chart data
interface ChartDataItem {
  id: string;
  value: number;
}

// Mock data for maintenance summary - replace with actual API calls
const maintenanceData = {
  monthlyCost: 2340,
  yearToDate: 18650,
  scheduledPercentage: 65,
  trendPercentage: 8,
  byType: [
    { id: 'Scheduled', value: 65 },
    { id: 'Repairs', value: 25 },
    { id: 'Inspection', value: 10 },
  ] as ChartDataItem[],
  monthlyTrend: [
    { month: 'Jan', cost: 1850 },
    { month: 'Feb', cost: 1920 },
    { month: 'Mar', cost: 2050 },
    { month: 'Apr', cost: 2180 },
    { month: 'May', cost: 2340 },
  ]
};

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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: color + '15', p: 1, borderRadius: 2 }}>
            {React.cloneElement(icon as React.ReactElement, { sx: { color: color } })}
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

const SummaryCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  color: string;
  data: {
    monthlyCost: number;
    yearToDate: number;
    trendPercentage: number;
  };
}> = ({ title, icon, color, data }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            bgcolor: color + '15', 
            borderRadius: '50%', 
            p: 1, 
            mr: 1, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {React.cloneElement(icon as React.ReactElement, { sx: { color: color } })}
          </Box>
          <Typography variant="h6">{title}</Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Monthly</Typography>
              <Typography variant="h5">${data.monthlyCost.toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Year to Date</Typography>
              <Typography variant="h5">${data.yearToDate.toLocaleString()}</Typography>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {data.trendPercentage > 0 ? (
            <TrendingUpIcon sx={{ color: theme.palette.error.main, fontSize: '1rem' }} />
          ) : (
            <TrendingDownIcon sx={{ color: theme.palette.success.main, fontSize: '1rem' }} />
          )}
          <Typography
            variant="caption"
            sx={{
              color: data.trendPercentage > 0 ? theme.palette.error.main : theme.palette.success.main,
              ml: 0.5,
            }}
          >
            {data.trendPercentage > 0 ? '+' : ''}{data.trendPercentage}% from last month
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const FuelSummary: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Fuel Summary
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <SummaryCard 
            title="Fuel Expenses" 
            icon={<FuelIcon />} 
            color={theme.palette.warning.main} 
            data={fuelData} 
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Consumption by Vehicle Type</Typography>
              <Box sx={{ height: 180 }}>
                <ResponsivePie
                  data={fuelData.byVehicleType}
                  margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: 'yellow_orange_red' }}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  enableArcLinkLabels={false}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Average Consumption</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180 }}>
                <Typography variant="h3" color={theme.palette.warning.main}>
                  {fuelData.avgConsumption}
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  L/100km
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Monthly Trend</Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveBar
                  data={fuelData.monthlyTrend}
                  keys={['cost']}
                  indexBy="month"
                  margin={{ top: 10, right: 30, bottom: 50, left: 60 }}
                  padding={0.3}
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors={{ scheme: 'yellow_orange_red' }}
                  borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Month',
                    legendPosition: 'middle',
                    legendOffset: 40
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Cost ($)',
                    legendPosition: 'middle',
                    legendOffset: -50
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const MaintenanceSummary: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Maintenance Summary
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <SummaryCard 
            title="Maintenance Expenses" 
            icon={<MaintenanceIcon />} 
            color={theme.palette.error.main} 
            data={maintenanceData}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Maintenance by Type</Typography>
              <Box sx={{ height: 180 }}>
                <ResponsivePie
                  data={maintenanceData.byType}
                  margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: 'red_purple' }}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  enableArcLinkLabels={false}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Scheduled Maintenance</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180 }}>
                <Typography variant="h3" color={theme.palette.error.main}>
                  {maintenanceData.scheduledPercentage}%
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  of total maintenance
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Monthly Trend</Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveBar
                  data={maintenanceData.monthlyTrend}
                  keys={['cost']}
                  indexBy="month"
                  margin={{ top: 10, right: 30, bottom: 50, left: 60 }}
                  padding={0.3}
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors={{ scheme: 'red_purple' }}
                  borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Month',
                    legendPosition: 'middle',
                    legendOffset: 40
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Cost ($)',
                    legendPosition: 'middle',
                    legendOffset: -50
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const CostSummary: React.FC = () => {
  const theme = useTheme();
  
  // Define the interface for the cost data state
  interface CostDataState {
    monthlyCost: number;
    yearToDate: number;
    trendPercentage: number;
    byCategory: ChartDataItem[];
  }

  const [costData, setCostData] = useState<CostDataState>({
    monthlyCost: 0,
    yearToDate: 0,
    trendPercentage: 0,
    byCategory: []
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchCostData = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, these would be actual API calls
        // const summary = await costService.getCostsSummary();
        // const trends = await costService.getCostTrends();
        
        // Mock data for now
        setCostData({
          monthlyCost: 4820,
          yearToDate: 31400,
          trendPercentage: 5,
          byCategory: [
            { id: 'Fuel', value: 35 },
            { id: 'Maintenance', value: 45 },
            { id: 'Insurance', value: 15 },
            { id: 'Other', value: 5 },
          ]
        });
      } catch (error) {
        console.error('Failed to fetch cost data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCostData();
  }, []);
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Cost Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <SummaryCard 
            title="Total Expenses" 
            icon={<MoneyIcon />} 
            color={theme.palette.primary.main} 
            data={{
              monthlyCost: costData.monthlyCost,
              yearToDate: costData.yearToDate,
              trendPercentage: costData.trendPercentage
            }}
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Expenses by Category</Typography>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ height: 200 }}>
                  <ResponsivePie
                    data={costData.byCategory}
                    margin={{ top: 10, right: 80, bottom: 10, left: 20 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={{ scheme: 'blues' }}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    arcLinkLabelsTextColor="#333333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    legends={[
                      {
                        anchor: 'right',
                        direction: 'column',
                        justify: false,
                        translateX: 80,
                        translateY: 0,
                        itemsSpacing: 2,
                        itemWidth: 80,
                        itemHeight: 20,
                        itemTextColor: '#999',
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 12,
                        symbolShape: 'circle',
                      }
                    ]}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Calculate the total fuel consumption (currently based on mock data)
  const totalFuelConsumption = `${fuelData.monthlyCost.toLocaleString()}L`;
  
  // Format maintenance cost with currency symbol
  const maintenanceCost = `$${maintenanceData.monthlyCost.toLocaleString()}`;

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
            value={totalFuelConsumption}
            icon={<FuelIcon />}
            trend="down"
            trendValue={`${fuelData.trendPercentage}% this month`}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Maintenance Cost"
            value={maintenanceCost}
            icon={<MaintenanceIcon />}
            trend="up"
            trendValue={`+${maintenanceData.trendPercentage}% this month`}
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
                message: 'Insurance renewal pending for 4 vehicles',
                severity: 'medium',
              },
            ]}
          />
        </Grid>

        {/* Detailed Summaries Section */}
        <Grid item xs={12}>
          <Paper sx={{ mt: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard summary tabs">
                <Tab label="Cost Overview" />
                <Tab label="Fuel Management" />
                <Tab label="Maintenance" />
              </Tabs>
            </Box>
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && <CostSummary />}
              {tabValue === 1 && <FuelSummary />}
              {tabValue === 2 && <MaintenanceSummary />}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 