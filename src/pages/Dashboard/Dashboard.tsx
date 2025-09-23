import React, { useState } from 'react';
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
  useMediaQuery,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  Alert as MuiAlert,
  Fab,
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
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  MonetizationOn as MonetizationOnIcon,
  DirectionsCar as VehicleIcon,
  Group as GroupIcon,
  BusinessCenter as BusinessCenterIcon,
  Security as SecurityIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';

// Define types for our chart data
interface ChartDataItem {
  id: string;
  value: number;
}

// Define interfaces for API response data
interface ExpenseCategory {
  category: string;
  vehicleType: string;
  totalAmount: number;
  count: number;
}

interface MonthlyExpense {
  totalAmount: number;
  count: number;
  month: number;
  year: number;
  categories: ExpenseCategory[];
}

interface YearlyExpense {
  totalAmount: number;
  count: number;
  year: number;
  categories: ExpenseCategory[];
}

interface CategoryExpense {
  totalAmount: number;
  count: number;
  category: string;
  percentage: number;
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

interface MonthlyExpensesResponse {
  monthlyExpenses: MonthlyExpense[];
  yearlyTotal: number;
}

interface YearlyExpensesResponse {
  yearlyExpenses: YearlyExpense[];
  grandTotal: number;
}

interface CategoryExpensesResponse {
  categories: CategoryExpense[];
  total: number;
}

// Define interfaces for fuel data
interface FuelExpense {
  _id: string;
  vehicleId: string;
  driverId: string;
  expenseType: string;
  amount: number;
  date: string;
  description: string;
  paymentStatus: string;
  paymentMethod: string;
  vendor?: string;
  invoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface CurrentMonthFuelResponse {
  totalCost: number;
  totalTransactions: number;
  fuelExpenses: FuelExpense[];
  month: number;
  year: number;
}

interface FuelByVehicleType {
  totalAmount: number;
  count: number;
  vehicleType: string;
  percentage: number;
}

interface MonthlyFuelResponse {
  monthlyFuelExpenses: {
    totalAmount: number;
    count: number;
    month: number;
    year: number;
  }[];
  yearlyFuelTotal: number;
}

interface FuelApiResponse {
  status: string;
  data: {
    monthlyExpenses: FuelExpense[];
    yearlyTotal: number;
    byVehicleType: FuelByVehicleType[];
    avgConsumption: number;
  };
}

// Add interface for driver response
interface DriverResponse {
  totalActiveDrivers: number;
  drivers: {
    _id: string;
    status: string;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    licenseState: string;
    licenseExpiry: string;
    contact: string;
    address: string;
    rating: number;
    notes?: string;
  }[];
}

// Add interface for vehicle response
interface VehicleResponse {
  totalActiveVehicles: number;
  vehicles: {
    _id: string;
    status: string;
    make: string;
    model: string;
    year: string;
    licensePlate: string;
  }[];
}

// Add interface for maintenance response
interface MaintenanceExpense {
  _id: string;
  vehicleId: string;
  driverId: string;
  expenseType: string;
  amount: number;
  date: string;
  description: string;
  paymentStatus: string;
  paymentMethod: string;
  vendor?: string;
  invoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface CurrentMonthMaintenanceResponse {
  totalCost: number;
  totalTransactions: number;
  maintenanceExpenses: MaintenanceExpense[];
  month: number;
  year: number;
}

// Add interface for contract statistics
interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  expiringSoon: number;
  totalValue: number;
  recentContracts: {
    _id: string;
    startDate: string;
    endDate: string;
    status: string;
  }[];
  lastUpdated: string;
  debug: {
    totalFound: number;
    contractsWithFutureEndDate: number;
    currentDate: string;
    manualCounts: {
      active: number;
      expiringSoon: number;
      totalValue: number;
    };
    aggregateCounts: {
      active: number;
      expiringSoon: number;
      totalValue: number;
    };
  };
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
  onClick?: () => void;
}> = ({ title, value, icon, trend, trendValue, color, onClick }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          transition: 'transform 0.2s ease-in-out',
          boxShadow: 3,
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: '12px',
              p: 1,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
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
        <LinearProgress
          variant="determinate"
          value={70}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: `${color}30`,
            '& .MuiLinearProgress-bar': {
              backgroundColor: color,
            },
          }}
        />
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
              <Typography variant="h5">AED {data.monthlyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Year to Date</Typography>
              <Typography variant="h5">AED {data.yearToDate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
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
            {data.trendPercentage > 0 ? '+' : ''}{Math.abs(data.trendPercentage).toFixed(1)}% from last month
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const FuelSummary: React.FC<{ fuelData: any }> = ({ fuelData }) => {
  const theme = useTheme();

  if (!fuelData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

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
            data={{
              monthlyCost: fuelData.monthlyCost,
              yearToDate: fuelData.yearToDate,
              trendPercentage: fuelData.trendPercentage
            }} 
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Consumption by Vehicle Type</Typography>
              <Box sx={{ height: 180 }}>
                {fuelData.byVehicleType.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" color="textSecondary">
                      No data available
                    </Typography>
                  </Box>
                ) : (
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
                    tooltip={({ datum }) => (
                      <Box sx={{ bgcolor: 'white', p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                        <Typography variant="body2">
                          {datum.label}: AED {datum.value.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  />
                )}
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
                  {fuelData.avgConsumption.toFixed(1)}
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
                {fuelData.monthlyTrend.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" color="textSecondary">
                      No data available
                    </Typography>
                  </Box>
                ) : (
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
                      legend: 'Cost (AED)',
                      legendPosition: 'middle',
                      legendOffset: -50
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    tooltip={({ value, indexValue }) => (
                      <Box sx={{ bgcolor: 'white', p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                        <Typography variant="body2">
                          {indexValue}: AED {value.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const MaintenanceSummary: React.FC<{ maintenanceData: any }> = ({ maintenanceData }) => {
  const theme = useTheme();

  if (!maintenanceData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

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
            data={{
              monthlyCost: maintenanceData.monthlyCost,
              yearToDate: maintenanceData.yearToDate,
              trendPercentage: maintenanceData.trendPercentage
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Maintenance by Type</Typography>
              <Box sx={{ height: 180 }}>
                {maintenanceData.byType.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" color="textSecondary">
                      No data available
                    </Typography>
                  </Box>
                ) : (
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
                    tooltip={({ datum }) => (
                      <Box sx={{ bgcolor: 'white', p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                        <Typography variant="body2">
                          {datum.label}: AED {datum.value.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  />
                )}
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
                {maintenanceData.monthlyTrend.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" color="textSecondary">
                      No data available
                    </Typography>
                  </Box>
                ) : (
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
                      legend: 'Cost (AED)',
                      legendPosition: 'middle',
                      legendOffset: -50
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    tooltip={({ value, indexValue }) => (
                      <Box sx={{ bgcolor: 'white', p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                        <Typography variant="body2">
                          {indexValue}: AED {value.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const CostSummary: React.FC<{ costData: any }> = ({ costData }) => {
  if (!costData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
    
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Expenses by Category</Typography>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>
            <Box sx={{ height: 300 }}>
              {costData.byCategory.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body2" color="textSecondary">
                    No data available
                  </Typography>
                </Box>
              ) : (
                <ResponsivePie
                  data={costData.byCategory}
                  margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="#333333"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  legends={[
                    {
                      anchor: 'bottom',
                      direction: 'row',
                      justify: false,
                      translateX: 0,
                      translateY: 56,
                      itemsSpacing: 0,
                      itemWidth: 100,
                      itemHeight: 18,
                      itemTextColor: '#999',
                      itemDirection: 'left-to-right',
                      itemOpacity: 1,
                      symbolSize: 18,
                      symbolShape: 'circle',
                    }
                  ]}
                  tooltip={({ datum }) => (
                    <Box sx={{ bgcolor: 'white', p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                      <Typography variant="body2">
                        {datum.label}: AED {datum.value.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Cost Metrics</Typography>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Monthly Cost
                </Typography>
                <Typography variant="h4" sx={{ my: 1 }}>
                  AED {costData.monthlyCost.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Year to Date
                </Typography>
                <Typography variant="h4" sx={{ my: 1 }}>
                  AED {costData.yearToDate.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Monthly Trend
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {costData.trendPercentage >= 0 ? (
                      <TrendingUpIcon sx={{ color: 'success.main', mr: 1 }} />
                    ) : (
                      <TrendingDownIcon sx={{ color: 'error.main', mr: 1 }} />
                    )}
                    <Typography
                      variant="body2"
                      color={costData.trendPercentage >= 0 ? 'success.main' : 'error.main'}
                    >
                      {Math.abs(costData.trendPercentage)}% {costData.trendPercentage >= 0 ? 'increase' : 'decrease'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  
  // Use the custom hook for dashboard data
  const { data, isLoading, error, refresh, refreshAll, isRefreshing } = useDashboardData();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format fuel consumption with currency symbol
  const totalFuelConsumption = data ? `AED ${data.fuelConsumption.total.toLocaleString()}` : 'AED 0';
  
  // Format maintenance cost with currency symbol
  const totalMaintenanceCost = data ? `AED ${data.maintenanceCost.total.toLocaleString()}` : 'AED 0';

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <MuiAlert severity="error" sx={{ mb: 2 }}>
          {error}
        </MuiAlert>
        <Button variant="contained" onClick={refresh} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No data available</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton 
              onClick={refresh} 
              disabled={isRefreshing}
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh all data">
            <IconButton 
              onClick={refreshAll} 
              disabled={isRefreshing}
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isRefreshing && (
        <Box sx={{ mb: 2 }}>
          <MuiAlert severity="info">
            Refreshing data...
          </MuiAlert>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Vehicles"
            value={data.activeVehicles.toString()}
            icon={<VehicleIcon />}
            color={theme.palette.primary.main}
            onClick={() => navigate('/vehicles')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Drivers"
            value={data.activeDrivers.toString()}
            icon={<DriverIcon />}
            color={theme.palette.success.main}
            onClick={() => navigate('/drivers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fuel Consumption"
            value={totalFuelConsumption}
            icon={<FuelIcon />}
            trend={data.fuelConsumption.trend < 0 ? "down" : "up"}
            trendValue={`${Math.abs(data.fuelConsumption.trend)}% this month`}
            color={theme.palette.warning.main}
            onClick={() => navigate('/cost-management')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Maintenance Cost"
            value={totalMaintenanceCost}
            icon={<MaintenanceIcon />}
            trend={data.maintenanceCost.trend < 0 ? "down" : "up"}
            trendValue={`${Math.abs(data.maintenanceCost.trend)}% this month`}
            color={theme.palette.error.main}
            onClick={() => navigate('/cost-management')}
          />
        </Grid>

        {/* Contract Statistics */}
        <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Contract Management
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Contracts"
                  value={data.contractStats.totalContracts.toString()}
                  icon={<DescriptionIcon />}
                  color={theme.palette.info.main}
                  onClick={() => navigate('/contract-management')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Active Contracts"
                  value={data.contractStats.activeContracts.toString()}
                  icon={<CheckCircleIcon />}
                  color={theme.palette.success.main}
                  onClick={() => navigate('/contract-management')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Expiring Soon"
                  value={data.contractStats.expiringSoon.toString()}
                  icon={<WarningIcon />}
                  color={theme.palette.warning.main}
                  onClick={() => navigate('/contract-management')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Value"
                  value={`AED ${data.contractStats.totalValue.toLocaleString()}`}
                  icon={<MonetizationOnIcon />}
                  color={theme.palette.primary.main}
                  onClick={() => navigate('/contract-management')}
                />
              </Grid>
            </Grid>
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
              {tabValue === 0 && <CostSummary costData={data.costData} />}
              {tabValue === 1 && <FuelSummary fuelData={data.fuelData} />}
              {tabValue === 2 && <MaintenanceSummary maintenanceData={data.maintenanceData} />}
            </Box>
          </Paper>
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
      </Grid>

      {/* Floating Action Button for Quick Refresh */}
      <Fab
        color="primary"
        aria-label="refresh"
        onClick={refresh}
        disabled={isRefreshing}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <RefreshIcon />
      </Fab>
    </Box>
  );
};

export default Dashboard; 