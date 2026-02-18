import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  useTheme,
  alpha,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Stack,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  DirectionsCar as VehicleIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import moment from 'moment';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/environment';

interface Vehicle {
  _id: string;
  licensePlate: string;
  make: string;
  model: string;
}

interface VehicleReport {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  contractAmount: number;
  expenses: number;
  profit: number;
  profitMargin: number;
}

interface MonthlyData {
  month: string;
  vehicles: VehicleReport[];
  totalContractAmount: number;
  totalExpenses: number;
  totalProfit: number;
  averageProfitMargin: number;
}

const MonthlyReport: React.FC = () => {
  const theme = useTheme();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(moment().format('YYYY-MM'));
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(API_ENDPOINTS.vehicles, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          setVehicles(response.data);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };
    fetchVehicles();
  }, []);

  // Fetch monthly report data
  useEffect(() => {
    const fetchMonthlyReport = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const startDate = moment(selectedMonth).startOf('month');
        const endDate = moment(selectedMonth).endOf('month');

        // Fetch expenses
        const expensesResponse = await axios.get(API_ENDPOINTS.costs.all, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Fetch contracts
        const contractsResponse = await axios.get(API_ENDPOINTS.contracts, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const allVehicles = selectedVehicles.length > 0 
          ? vehicles.filter(v => selectedVehicles.includes(v._id))
          : vehicles;

        const vehicleReports: VehicleReport[] = allVehicles.map(vehicle => {
          // Calculate expenses for this vehicle in selected month
          const vehicleExpenses = expensesResponse.data.vehicles
            ?.find((v: any) => v.vehicleId === vehicle._id)
            ?.details?.filter((d: any) => {
              const expenseDate = moment(d.date);
              return expenseDate.isBetween(startDate, endDate, 'day', '[]');
            })
            .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0) || 0;

          // Calculate contract amount from active contracts for this vehicle
          const vehicleContracts = contractsResponse.data
            .filter((c: any) => c.vehicleId === vehicle._id && c.status === 'Active');
          
          // Calculate total annual contract value
          const totalContractValue = vehicleContracts
            .reduce((sum: number, c: any) => sum + Number(c.value || 0), 0);

          const profit = totalContractValue - vehicleExpenses;
          const profitMargin = totalContractValue > 0 ? (profit / totalContractValue) * 100 : 0;

          return {
            vehicleId: vehicle._id,
            vehicleName: `${vehicle.make} ${vehicle.model}`,
            licensePlate: vehicle.licensePlate,
            contractAmount: totalContractValue,
            expenses: vehicleExpenses,
            profit,
            profitMargin,
          };
        });

        const totalContractAmount = vehicleReports.reduce((sum, v) => sum + v.contractAmount, 0);
        const totalExpenses = vehicleReports.reduce((sum, v) => sum + v.expenses, 0);
        const totalProfit = totalContractAmount - totalExpenses;
        const averageProfitMargin = totalContractAmount > 0 
          ? (totalProfit / totalContractAmount) * 100 
          : 0;

        setMonthlyData({
          month: moment(selectedMonth).format('MMMM YYYY'),
          vehicles: vehicleReports,
          totalContractAmount,
          totalExpenses,
          totalProfit,
          averageProfitMargin,
        });
      } catch (error) {
        console.error('Error fetching monthly report:', error);
      } finally {
        setLoading(false);
      }
    };

    if (vehicles.length > 0) {
      fetchMonthlyReport();
    }
  }, [selectedMonth, selectedVehicles, vehicles]);

  const handleVehicleChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedVehicles(event.target.value as string[]);
  };

  const handleMonthChange = (event: SelectChangeEvent) => {
    setSelectedMonth(event.target.value);
  };

  // Generate last 12 months for dropdown
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = moment().subtract(i, 'months');
    return {
      value: date.format('YYYY-MM'),
      label: date.format('MMMM YYYY'),
    };
  });

  // Prepare chart data
  const barChartData = monthlyData?.vehicles.map(v => ({
    vehicle: v.licensePlate,
    'Contract Amount': v.contractAmount,
    Expenses: v.expenses,
    Profit: v.profit,
  })) || [];

  const pieChartData = monthlyData?.vehicles
    .filter(v => v.profit > 0)
    .map(v => ({
      id: v.licensePlate,
      label: v.licensePlate,
      value: v.profit,
    })) || [];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', height: '100%', p: 3, overflow: 'hidden' }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#1F2937',
            mb: 1,
          }}
        >
          Monthly Financial Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comprehensive analysis of contract revenue, expenses, and profitability
        </Typography>
      </Box>

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Month</InputLabel>
            <Select
              value={selectedMonth}
              label="Select Month"
              onChange={handleMonthChange}
              startAdornment={<CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              {monthOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Filter Vehicles (Optional)</InputLabel>
            <Select
              multiple
              value={selectedVehicles}
              label="Filter Vehicles (Optional)"
              onChange={handleVehicleChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const vehicle = vehicles.find(v => v._id === value);
                    return (
                      <Chip 
                        key={value} 
                        label={vehicle?.licensePlate || value}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {vehicles.map((vehicle) => (
                <MenuItem key={vehicle._id} value={vehicle._id}>
                  {vehicle.licensePlate} - {vehicle.make} {vehicle.model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {monthlyData && (
        <>
          {/* Summary KPI Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card
                sx={{
                  height: '100%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        backgroundColor: alpha('#8B5CF6', 0.1),
                        borderRadius: '8px',
                        p: 1,
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MoneyIcon sx={{ color: '#8B5CF6', fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      Contract Amount
                    </Typography>
                  </Box>
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{
                      mb: 2,
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#111827',
                    }}
                  >
                    {monthlyData.totalContractAmount.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                  </Typography>
                  <Box
                    sx={{
                      height: 6,
                      borderRadius: 9999,
                      backgroundColor: alpha('#8B5CF6', 0.2),
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: '70%',
                        backgroundColor: '#8B5CF6',
                        borderRadius: 9999,
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card
                sx={{
                  height: '100%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        backgroundColor: alpha('#EF4444', 0.1),
                        borderRadius: '8px',
                        p: 1,
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TrendingDownIcon sx={{ color: '#EF4444', fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      Total Expenses
                    </Typography>
                  </Box>
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{
                      mb: 2,
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#111827',
                    }}
                  >
                    {monthlyData.totalExpenses.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                  </Typography>
                  <Box
                    sx={{
                      height: 6,
                      borderRadius: 9999,
                      backgroundColor: alpha('#EF4444', 0.2),
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: '70%',
                        backgroundColor: '#EF4444',
                        borderRadius: 9999,
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card
                sx={{
                  height: '100%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        backgroundColor: monthlyData.totalProfit >= 0 
                          ? alpha('#10B981', 0.1) 
                          : alpha('#F59E0B', 0.1),
                        borderRadius: '8px',
                        p: 1,
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TrendingUpIcon 
                        sx={{ 
                          color: monthlyData.totalProfit >= 0 ? '#10B981' : '#F59E0B', 
                          fontSize: 24 
                        }} 
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      Net Profit
                    </Typography>
                  </Box>
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{
                      mb: 2,
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#111827',
                    }}
                  >
                    {monthlyData.totalProfit.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                  </Typography>
                  <Box
                    sx={{
                      height: 6,
                      borderRadius: 9999,
                      backgroundColor: monthlyData.totalProfit >= 0 
                        ? alpha('#10B981', 0.2) 
                        : alpha('#F59E0B', 0.2),
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: '70%',
                        backgroundColor: monthlyData.totalProfit >= 0 ? '#10B981' : '#F59E0B',
                        borderRadius: 9999,
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card
                sx={{
                  height: '100%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        backgroundColor: alpha('#3B82F6', 0.1),
                        borderRadius: '8px',
                        p: 1,
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AssessmentIcon sx={{ color: '#3B82F6', fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      Profit Margin
                    </Typography>
                  </Box>
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{
                      mb: 2,
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#111827',
                    }}
                  >
                    {monthlyData.averageProfitMargin.toFixed(1)}%
                  </Typography>
                  <Box
                    sx={{
                      height: 6,
                      borderRadius: 9999,
                      backgroundColor: alpha('#3B82F6', 0.2),
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${Math.min(monthlyData.averageProfitMargin, 100)}%`,
                        backgroundColor: '#3B82F6',
                        borderRadius: 9999,
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={7}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  height: 450,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Financial Performance by Vehicle
                </Typography>
                <Box sx={{ height: 370 }}>
                  <ResponsiveBar
                    data={barChartData}
                    keys={['Contract Amount', 'Expenses', 'Profit']}
                    indexBy="vehicle"
                    margin={{ top: 10, right: 130, bottom: 50, left: 80 }}
                    padding={0.3}
                    valueScale={{ type: 'linear' }}
                    colors={['#8B5CF6', '#EF4444', '#10B981']}
                    borderRadius={8}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Vehicle',
                      legendPosition: 'middle',
                      legendOffset: 45,
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Amount (AED)',
                      legendPosition: 'middle',
                      legendOffset: -60,
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    legends={[
                      {
                        dataFrom: 'keys',
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 120,
                        translateY: 0,
                        itemsSpacing: 2,
                        itemWidth: 100,
                        itemHeight: 20,
                        itemDirection: 'left-to-right',
                        itemOpacity: 0.85,
                        symbolSize: 20,
                      },
                    ]}
                    enableLabel={false}
                    theme={{
                      axis: {
                        ticks: {
                          text: {
                            fontSize: 11,
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  height: 450,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Profit Distribution
                </Typography>
                <Box sx={{ height: 370 }}>
                  {pieChartData.length > 0 ? (
                    <ResponsivePie
                      data={pieChartData}
                      margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
                      innerRadius={0.6}
                      padAngle={0.7}
                      cornerRadius={8}
                      activeOuterRadiusOffset={8}
                      colors={{ scheme: 'nivo' }}
                      borderWidth={1}
                      borderColor={{
                        from: 'color',
                        modifiers: [['darker', 0.2]],
                      }}
                      arcLinkLabelsSkipAngle={10}
                      arcLinkLabelsTextColor="#333333"
                      arcLinkLabelsThickness={2}
                      arcLinkLabelsColor={{ from: 'color' }}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor={{
                        from: 'color',
                        modifiers: [['darker', 2]],
                      }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Typography variant="body2" color="text.secondary">
                        No profit data available for selected period
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Detailed Vehicle Table */}
          <Paper
            sx={{
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 3, background: alpha(theme.palette.primary.main, 0.05) }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Detailed Financial Breakdown
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: alpha(theme.palette.primary.main, 0.02) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Vehicle</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Contract Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Expenses</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Net Profit</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Profit Margin</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyData.vehicles.map((vehicle) => (
                    <TableRow
                      key={vehicle.vehicleId}
                      sx={{
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.02),
                        },
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            <VehicleIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              {vehicle.licensePlate}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {vehicle.vehicleName}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" sx={{ color: '#8B5CF6', fontWeight: 600 }}>
                          {vehicle.contractAmount.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" sx={{ color: '#EF4444', fontWeight: 600 }}>
                          {vehicle.expenses.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={vehicle.profit.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                          sx={{
                            bgcolor: vehicle.profit >= 0 ? alpha('#10B981', 0.1) : alpha('#EF4444', 0.1),
                            color: vehicle.profit >= 0 ? '#059669' : '#DC2626',
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${vehicle.profitMargin.toFixed(1)}%`}
                          sx={{
                            bgcolor: vehicle.profitMargin >= 0 ? alpha('#3B82F6', 0.1) : alpha('#EF4444', 0.1),
                            color: vehicle.profitMargin >= 0 ? '#2563EB' : '#DC2626',
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow sx={{ background: alpha(theme.palette.primary.main, 0.08) }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      TOTAL
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" sx={{ color: '#8B5CF6', fontWeight: 700, fontSize: '1rem' }}>
                        {monthlyData.totalContractAmount.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" sx={{ color: '#EF4444', fontWeight: 700, fontSize: '1rem' }}>
                        {monthlyData.totalExpenses.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                        {monthlyData.totalProfit.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" sx={{ color: '#2563EB', fontWeight: 700, fontSize: '1rem' }}>
                        {monthlyData.averageProfitMargin.toFixed(1)}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Typography variant="h6" color="text.secondary">
            Loading report...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MonthlyReport;
