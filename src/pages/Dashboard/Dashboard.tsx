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
} from '@mui/icons-material';
import axios from 'axios';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { API_CONFIG, getApiUrl } from '../../config/api';
import costService from '../../services/costService';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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

const FuelSummary: React.FC = () => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fuelData, setFuelData] = useState<{
    monthlyCost: number;
    yearToDate: number;
    avgConsumption: number;
    trendPercentage: number;
    byVehicleType: ChartDataItem[];
    monthlyTrend: { month: string; cost: number }[];
  }>({
    monthlyCost: 0,
    yearToDate: 0,
    avgConsumption: 0,
    trendPercentage: 0,
    byVehicleType: [],
    monthlyTrend: [],
  });

  useEffect(() => {
    const fetchFuelData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch current month's fuel data
        const currentMonthResponse = await axios.get<ApiResponse<CurrentMonthFuelResponse>>(
          getApiUrl('/dashboard/fuel/current-month')
        );

        console.log('Current month fuel response:', currentMonthResponse.data);

        if (currentMonthResponse.data.status === 'error') {
          throw new Error(currentMonthResponse.data.message || 'Failed to fetch fuel data');
        }

        if (!currentMonthResponse.data.data) {
          throw new Error('No fuel data available');
        }

        const { totalCost, totalTransactions, fuelExpenses } = currentMonthResponse.data.data;

        // Calculate average consumption (L/100km)
        const avgConsumption = totalTransactions > 0 ? totalCost / totalTransactions : 0;

        // Create vehicle type distribution based on the current month's total
        const vehicleTypeData = [
          { id: 'Sedan', value: totalCost * 0.4, label: 'Sedan' },
          { id: 'SUV', value: totalCost * 0.3, label: 'SUV' },
          { id: 'Van', value: totalCost * 0.2, label: 'Van' },
          { id: 'Truck', value: totalCost * 0.1, label: 'Truck' },
        ];

        // Transform monthly data for the bar chart
        const monthlyTrendData = [
          {
            month: moment().format('MMM'),
            cost: totalCost
          }
        ];

        console.log('Processed fuel data:', {
          monthlyCost: totalCost,
          yearToDate: totalCost, // Since we only have current month data
          avgConsumption,
          trendPercentage: 0, // No trend data available
          monthlyTrend: monthlyTrendData,
          vehicleTypes: vehicleTypeData,
        });

        setFuelData({
          monthlyCost: totalCost,
          yearToDate: totalCost,
          avgConsumption: avgConsumption,
          trendPercentage: 0,
          byVehicleType: vehicleTypeData,
          monthlyTrend: monthlyTrendData,
        });
      } catch (error) {
        console.error('Failed to fetch fuel data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch fuel data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFuelData();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
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

const MaintenanceSummary: React.FC = () => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceData, setMaintenanceData] = useState<{
    monthlyCost: number;
    yearToDate: number;
    scheduledPercentage: number;
    trendPercentage: number;
    byType: ChartDataItem[];
    monthlyTrend: { month: string; cost: number }[];
  }>({
    monthlyCost: 0,
    yearToDate: 0,
    scheduledPercentage: 0,
    trendPercentage: 0,
    byType: [],
    monthlyTrend: [],
  });

  useEffect(() => {
    const fetchMaintenanceData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch current month's maintenance data
        const currentMonthResponse = await axios.get<ApiResponse<CurrentMonthMaintenanceResponse>>(
          getApiUrl('/dashboard/maintenance/current-month')
        );

        console.log('Current month maintenance response:', currentMonthResponse.data);

        if (currentMonthResponse.data.status === 'error') {
          throw new Error(currentMonthResponse.data.message || 'Failed to fetch maintenance data');
        }

        if (!currentMonthResponse.data.data) {
          throw new Error('No maintenance data available');
        }

        const { totalCost, totalTransactions, maintenanceExpenses } = currentMonthResponse.data.data;

        // Calculate scheduled maintenance percentage (mock for now)
        const scheduledPercentage = 65;

        // Create maintenance type distribution based on the current month's total
        const maintenanceTypeData = [
          { id: 'Scheduled', value: totalCost * 0.6, label: 'Scheduled' },
          { id: 'Repairs', value: totalCost * 0.3, label: 'Repairs' },
          { id: 'Inspection', value: totalCost * 0.1, label: 'Inspection' },
        ];

        // Transform monthly data for the bar chart
        const monthlyTrendData = [
          {
            month: moment().format('MMM'),
            cost: totalCost
          }
        ];

        console.log('Processed maintenance data:', {
          monthlyCost: totalCost,
          yearToDate: totalCost, // Since we only have current month data
          scheduledPercentage,
          trendPercentage: 0, // No trend data available
          monthlyTrend: monthlyTrendData,
          maintenanceTypes: maintenanceTypeData,
        });

        setMaintenanceData({
          monthlyCost: totalCost,
          yearToDate: totalCost,
          scheduledPercentage,
          trendPercentage: 0,
          byType: maintenanceTypeData,
          monthlyTrend: monthlyTrendData,
        });
      } catch (error) {
        console.error('Failed to fetch maintenance data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch maintenance data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaintenanceData();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
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

const CostSummary: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costData, setCostData] = useState<{
    monthlyCost: number;
    yearToDate: number;
    trendPercentage: number;
    byCategory: ChartDataItem[];
  }>({
    monthlyCost: 0,
    yearToDate: 0,
    trendPercentage: 0,
    byCategory: [],
  });

  useEffect(() => {
    const fetchCostData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch monthly expenses
        const monthlyResponse = await axios.get<ApiResponse<MonthlyExpensesResponse>>(
          getApiUrl(API_CONFIG.ENDPOINTS.COSTS + '/monthly')
        );

        if (monthlyResponse.data.status === 'error' || !monthlyResponse.data.data?.monthlyExpenses) {
          throw new Error(monthlyResponse.data.message || 'Failed to fetch monthly expenses');
        }

        const monthlyExpenses = monthlyResponse.data.data.monthlyExpenses;
        const currentMonthTotal = monthlyExpenses.length > 0 ? monthlyExpenses[0].totalAmount : 0;

        // Fetch yearly expenses
        const yearlyResponse = await axios.get<ApiResponse<YearlyExpensesResponse>>(
          getApiUrl(API_CONFIG.ENDPOINTS.COSTS + '/yearly')
        );

        if (yearlyResponse.data.status === 'error' || !yearlyResponse.data.data?.yearlyExpenses) {
          throw new Error(yearlyResponse.data.message || 'Failed to fetch yearly expenses');
        }

        const yearlyExpenses = yearlyResponse.data.data.yearlyExpenses;
        const yearlyTotal = yearlyResponse.data.data.grandTotal || 0;

        // Fetch category expenses
        const categoryResponse = await axios.get<ApiResponse<CategoryExpensesResponse>>(
          getApiUrl(API_CONFIG.ENDPOINTS.COSTS + '/by-category')
        );

        if (categoryResponse.data.status === 'error' || !categoryResponse.data.data?.categories) {
          throw new Error(categoryResponse.data.message || 'Failed to fetch category expenses');
        }

        const categories = categoryResponse.data.data.categories;
        
        // Calculate trend percentage (mock for now, you can implement actual calculation)
        const trendPercentage = 5; // Example: 5% increase

        // Transform category data for the pie chart
        const categoryChartData = categories.map((item: CategoryExpense) => ({
          id: item.category.charAt(0).toUpperCase() + item.category.slice(1),
          value: item.totalAmount,
          label: item.category.charAt(0).toUpperCase() + item.category.slice(1),
        }));

        setCostData({
          monthlyCost: currentMonthTotal,
          yearToDate: yearlyTotal,
          trendPercentage: trendPercentage,
          byCategory: categoryChartData,
        });
      } catch (error) {
        console.error('Failed to fetch cost data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch cost data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCostData();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
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
  const [activeDrivers, setActiveDrivers] = useState<number>(0);
  const [activeVehicles, setActiveVehicles] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fuelConsumption, setFuelConsumption] = useState<{
    total: number;
    trend: number;
  }>({
    total: 0,
    trend: 0
  });
  const [maintenanceCost, setMaintenanceCost] = useState<{
    total: number;
    trend: number;
  }>({
    total: 0,
    trend: 0
  });
  const [contractStats, setContractStats] = useState<ContractStats>({
    totalContracts: 0,
    activeContracts: 0,
    expiringSoon: 0,
    totalValue: 0,
    recentContracts: [],
    lastUpdated: '',
    debug: {
      totalFound: 0,
      contractsWithFutureEndDate: 0,
      currentDate: '',
      manualCounts: {
        active: 0,
        expiringSoon: 0,
        totalValue: 0
      },
      aggregateCounts: {
        active: 0,
        expiringSoon: 0,
        totalValue: 0
      }
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch active drivers
        const driversResponse = await axios.get<ApiResponse<DriverResponse>>(
          getApiUrl('/dashboard/active-drivers')
        );

        if (driversResponse.data.status === 'error' || !driversResponse.data.data) {
          throw new Error(driversResponse.data.message || 'Failed to fetch active drivers');
        }

        setActiveDrivers(driversResponse.data.data.totalActiveDrivers);

        // Fetch active vehicles
        const vehiclesResponse = await axios.get<ApiResponse<VehicleResponse>>(
          getApiUrl('/dashboard/active-vehicles')
        );

        if (vehiclesResponse.data.status === 'error' || !vehiclesResponse.data.data) {
          throw new Error(vehiclesResponse.data.message || 'Failed to fetch active vehicles');
        }

        setActiveVehicles(vehiclesResponse.data.data.totalActiveVehicles);

        // Fetch current month's fuel data
        const fuelResponse = await axios.get<ApiResponse<CurrentMonthFuelResponse>>(
          getApiUrl('/dashboard/fuel/current-month')
        );

        if (fuelResponse.data.status === 'success' && fuelResponse.data.data) {
          setFuelConsumption({
            total: fuelResponse.data.data.totalCost,
            trend: 0 // Since we don't have trend data in the API response
          });
        }

        // Fetch current month's maintenance data
        const maintenanceResponse = await axios.get<ApiResponse<CurrentMonthMaintenanceResponse>>(
          getApiUrl('/dashboard/maintenance/current-month')
        );

        if (maintenanceResponse.data.status === 'success' && maintenanceResponse.data.data) {
          setMaintenanceCost({
            total: maintenanceResponse.data.data.totalCost,
            trend: 0 // Since we don't have trend data in the API response
          });
        }

        // Fetch contract statistics
        const contractsResponse = await axios.get<ApiResponse<ContractStats>>(
          getApiUrl('/dashboard/contracts/stats')
        );

        if (contractsResponse.data.status === 'success' && contractsResponse.data.data) {
          setContractStats(contractsResponse.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format fuel consumption with currency symbol
  const totalFuelConsumption = `AED ${fuelConsumption.total.toLocaleString()}`;
  
  // Format maintenance cost with currency symbol
  const totalMaintenanceCost = `AED ${maintenanceCost.total.toLocaleString()}`;

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

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
            value={activeVehicles.toString()}
            icon={<VehicleIcon />}
            color={theme.palette.primary.main}
            onClick={() => navigate('/vehicles')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Drivers"
            value={activeDrivers.toString()}
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
            trend={fuelConsumption.trend < 0 ? "down" : "up"}
            trendValue={`${Math.abs(fuelConsumption.trend)}% this month`}
            color={theme.palette.warning.main}
            onClick={() => navigate('/cost-management')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Maintenance Cost"
            value={totalMaintenanceCost}
            icon={<MaintenanceIcon />}
            trend={maintenanceCost.trend < 0 ? "down" : "up"}
            trendValue={`${Math.abs(maintenanceCost.trend)}% this month`}
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
                  value={contractStats.totalContracts.toString()}
                  icon={<DescriptionIcon />}
                  color={theme.palette.info.main}
                  onClick={() => navigate('/contract-management')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Active Contracts"
                  value={contractStats.activeContracts.toString()}
                  icon={<CheckCircleIcon />}
                  color={theme.palette.success.main}
                  onClick={() => navigate('/contract-management')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Expiring Soon"
                  value={contractStats.expiringSoon.toString()}
                  icon={<WarningIcon />}
                  color={theme.palette.warning.main}
                  onClick={() => navigate('/contract-management')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Value"
                  value={`AED ${contractStats.totalValue.toLocaleString()}`}
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
              {tabValue === 0 && <CostSummary />}
              {tabValue === 1 && <FuelSummary />}
              {tabValue === 2 && <MaintenanceSummary />}
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
    </Box>
  );
};

export default Dashboard; 