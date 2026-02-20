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
  Article as ArticleIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import BetaInvoiceService from '../../services/BetaInvoiceService';
import ReceiptService from '../../services/ReceiptService';

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

  const handleClick = () => {
    console.log('StatCard clicked:', title);
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        } : {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        },
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: '8px',
              p: 1,
              mr: 2,
              pointerEvents: 'none',
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              pointerEvents: 'none',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography
          variant="h4"
          component="div"
          sx={{
            mb: 1,
            pointerEvents: 'none',
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {value}
        </Typography>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {trend === 'up' ? (
              <TrendingUpIcon sx={{ color: '#10B981', fontSize: '1rem', pointerEvents: 'none' }} />
            ) : (
              <TrendingDownIcon sx={{ color: '#EF4444', fontSize: '1rem', pointerEvents: 'none' }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trend === 'up' ? '#10B981' : '#EF4444',
                fontSize: '13px',
                fontWeight: 500,
                ml: 0.5,
                pointerEvents: 'none',
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
            borderRadius: 9999,
            backgroundColor: `${color}20`,
            pointerEvents: 'none',
            '& .MuiLinearProgress-bar': {
              backgroundColor: color,
              borderRadius: 9999,
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
  const [vehicleExpenses, setVehicleExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchVehicleExpenses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('/api/costs/all', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();

        // Filter for current month and group by vehicle
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const vehicleMap = new Map<string, number>();

        data.vehicles?.forEach((vehicle: any) => {
          let vehicleTotal = 0;
          vehicle.details?.forEach((expense: any) => {
            const expenseDate = new Date(expense.date);
            if (expenseDate >= startOfMonth && expenseDate <= endOfMonth) {
              vehicleTotal += expense.amount;
            }
          });
          if (vehicleTotal > 0) {
            vehicleMap.set(vehicle.vehicleName, vehicleTotal);
          }
        });

        const chartData = Array.from(vehicleMap.entries()).map(([vehicleName, total]) => ({
          id: vehicleName,
          label: vehicleName,
          value: total
        }));

        setVehicleExpenses(chartData);
      } catch (error) {
        console.error('Error fetching vehicle expenses:', error);
        setVehicleExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleExpenses();
  }, []);

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
              <Typography variant="h6">Current Month - Expenses by Vehicle</Typography>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>
            <Box sx={{ height: 300 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : vehicleExpenses.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body2" color="textSecondary">
                    No expenses for current month
                  </Typography>
                </Box>
              ) : (
                <ResponsivePie
                  data={vehicleExpenses}
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
                  valueFormat={value => `AED ${value.toLocaleString()}`}
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
                        {datum.label}: AED {datum.value.toLocaleString()}
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
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<any[]>([]);
  const [totalFines, setTotalFines] = useState<{ total_amount: string } | null>(null);
  const [recentFines, setRecentFines] = useState<any[]>([]);

  // Use the custom hook for dashboard data
  const { data, isLoading, error, refresh, refreshAll, isRefreshing } = useDashboardData();

  // Fetch recent invoices
  React.useEffect(() => {
    const fetchRecentInvoices = async () => {
      try {
        const response = await BetaInvoiceService.getInstance().getAllInvoices(1, 5);
        console.log('Invoices API response:', response);
        if (response?.data?.status === 'success' && Array.isArray(response.data.data)) {
          setRecentInvoices(response.data.data.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching recent invoices:', err);
      }
    };

    const fetchRecentReceipts = async () => {
      try {
        const response = await ReceiptService.getInstance().getAllReceipts(1, 5);
        console.log('Receipts API response:', response);
        if (response?.data?.status === 'success') {
          // Receipts are nested under data.receipts, not data directly
          const receiptsData = response.data.data?.receipts || [];
          setRecentReceipts(receiptsData.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching recent receipts:', err);
      }
    };

    const fetchTotalFines = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/rta-fines/total', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const result = await response.json();
        console.log('Total Fines API Response:', result);
        if (result?.status === 'success') {
          console.log('Total Fines Data:', result.data);
          setTotalFines(result.data);
        }
      } catch (err) {
        console.error('Error fetching total fines:', err);
      }
    };

    const fetchRecentFines = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/rta-fines', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const result = await response.json();
        if (result?.status === 'success' && result.data?.fines) {
          // Get last 3 fines
          setRecentFines(result.data.fines.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching recent fines:', err);
      }
    };

    fetchRecentInvoices();
    fetchRecentReceipts();
    fetchTotalFines();
    fetchRecentFines();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format total expenses with currency symbol
  const totalExpenses = data ? `AED ${data.costData.monthlyCost.toLocaleString()}` : 'AED 0';

  // Format expected income from active contracts
  const expectedIncome = data ? `AED ${data.contractStats.totalValue.toLocaleString()}` : 'AED 0';

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
            title="RTA Fines"
            value={totalFines?.total_amount || 'AED 0'}
            icon={<WarningIcon />}
            color={theme.palette.error.main}
            onClick={() => navigate('/rta-fines')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Vehicles"
            value={data?.activeVehicles ? data.activeVehicles.toString() : '0'}
            icon={<VehicleIcon />}
            color={theme.palette.primary.main}
            onClick={() => {
              console.log('Dashboard data:', data);
              console.log('Active vehicles:', data?.activeVehicles);
              navigate('/vehicles');
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Drivers"
            value={data.activeDrivers.toString()}
            icon={<DriverIcon />}
            color={theme.palette.success.main}
            onClick={() => {
              console.log('Navigating to drivers');
              navigate('/drivers');
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Expenses"
            value={totalExpenses}
            icon={<ReceiptIcon />}
            trend={data.costData.trendPercentage < 0 ? "down" : "up"}
            trendValue={`${Math.abs(data.costData.trendPercentage)}% this month`}
            color={theme.palette.warning.main}
            onClick={() => navigate('/cost-management')}
          />
        </Grid>

        {/* Quick Access Cards */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Quick Access
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  }
                }}
                onClick={() => navigate('/contracts')}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <DescriptionIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1.5 }} />
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    Create Contracts
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Manage all contracts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  }
                }}
                onClick={() => navigate('/beta-invoices')}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <MonetizationOnIcon sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1.5 }} />
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    Create Invoices
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    View and manage invoices
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  }
                }}
                onClick={() => navigate('/receipts')}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <MoneyIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1.5 }} />
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    Create Receipts
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Payment receipts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  }
                }}
                onClick={() => window.open('https://ums.rta.ae/violations/public-fines/fines-search', '_blank', 'noopener,noreferrer')}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Box
                    component="img"
                    src="/rta_dubai.png"
                    alt="RTA Dubai"
                    sx={{
                      width: 48,
                      height: 48,
                      mb: 1.5,
                      objectFit: 'contain'
                    }}
                  />
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    RTA Fine Search
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Manage RTA Fines for (51563245)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Important Alerts - Recent RTA Fines */}
        {recentFines.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="error" />
                    Important Alerts - Recent RTA Fines
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/rta-fines')}
                    endIcon={<ArrowForwardIcon />}
                  >
                    View All
                  </Button>
                </Box>
                <Box sx={{ mt: 2 }}>
                  {recentFines.map((fine, index) => (
                    <Box
                      key={fine._id || index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                        p: 2,
                        backgroundColor: (theme) => theme.palette.grey[50],
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: (theme) => theme.palette.error.light,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.error.light,
                          opacity: 0.1,
                        },
                      }}
                      onClick={() => navigate('/rta-fines')}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="error">
                          {fine.violation_details || fine.description || 'RTA Fine'}
                        </Typography>
                        {/* Number plate design */}
                        {fine.number_plate && (
                          (() => {
                            const [region, plate] = fine.number_plate.split('\n');
                            return (
                              <Box
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  borderRadius: '10px',
                                  background: '#fff',
                                  border: '2px solid #222',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                  minWidth: '120px',
                                  maxWidth: '180px',
                                  px: 2,
                                  py: 1,
                                  mb: 0.5,
                                }}
                              >
                                <Box sx={{
                                  background: '#1976D2',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '16px',
                                  borderRadius: '6px',
                                  px: 1.5,
                                  py: 0.5,
                                  mr: 1.5,
                                  minWidth: '32px',
                                  textAlign: 'center',
                                  letterSpacing: '1px',
                                }}>
                                  {region}
                                </Box>
                                <Box sx={{
                                  color: '#222',
                                  fontWeight: 700,
                                  fontSize: '20px',
                                  letterSpacing: '2px',
                                  textAlign: 'center',
                                  minWidth: '60px',
                                }}>
                                  {plate}
                                </Box>
                              </Box>
                            );
                          })()
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {fine.date && `Date: ${new Date(fine.date).toLocaleDateString()}`}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={700} color="error">
                          AED {fine.amount || fine.fine_amount || '0'}
                        </Typography>
                        <Chip
                          label={fine.status?.toUpperCase() || 'UNPAID'}
                          size="small"
                          color="error"
                          sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

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

        {/* Recent Receipts */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Receipts
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/receipts')}
                  endIcon={<ArrowForwardIcon />}
                >
                  View All
                </Button>
              </Box>
              <Box sx={{ mt: 2 }}>
                {recentReceipts.length > 0 ? (
                  recentReceipts.map((receipt, index) => (
                    <Box
                      key={receipt._id || index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                        p: 2,
                        backgroundColor: (theme) => theme.palette.grey[50],
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: (theme) => theme.palette.grey[200],
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.grey[100],
                        },
                      }}
                      onClick={() => navigate('/receipts')}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {receipt.receiptNumber || receipt.title || `Receipt #${index + 1}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {receipt.vendor || receipt.description || receipt.category || receipt.expenseType || 'Expense'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={700} color="primary">
                          AED {(receipt.amount || receipt.totalAmount || 0).toLocaleString()}
                        </Typography>
                        <Chip
                          label={receipt.status?.toUpperCase() || 'PENDING'}
                          size="small"
                          color={
                            receipt.status === 'received' || receipt.status === 'paid' ? 'success' :
                              receipt.status === 'pending' ? 'warning' :
                                receipt.status === 'failed' ? 'error' :
                                  receipt.status === 'refunded' ? 'info' :
                                    'default'
                          }
                          sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No recent receipts
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Invoices */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Invoices
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/beta-invoices')}
                  endIcon={<ArrowForwardIcon />}
                >
                  View All
                </Button>
              </Box>
              <Box sx={{ mt: 2 }}>
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice, index) => (
                    <Box
                      key={invoice._id || index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                        p: 2,
                        backgroundColor: (theme) => theme.palette.grey[50],
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: (theme) => theme.palette.grey[200],
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.grey[100],
                        },
                      }}
                      onClick={() => navigate(`/beta-invoices/${invoice._id}`)}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {invoice.invoiceNumber || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invoice.contract?.companyName || 'Unknown Company'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={700} color="primary">
                          AED {invoice.total?.toLocaleString() || '0'}
                        </Typography>
                        <Chip
                          label={(invoice.status || 'draft').toUpperCase()}
                          size="small"
                          color={
                            invoice.status === 'paid' ? 'success' :
                              invoice.status === 'partial' ? 'warning' :
                                invoice.status === 'unpaid' || invoice.status === 'overdue' || invoice.status === 'cancelled' ? 'error' :
                                  invoice.status === 'sent' ? 'info' :
                                    'default'
                          }
                          sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No recent invoices
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
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