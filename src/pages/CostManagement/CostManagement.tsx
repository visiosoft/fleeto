import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Chip,
  FormHelperText,
  Divider,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon,
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  DirectionsCar as VehicleIcon,
  Receipt as TaxIcon,
  Shield as InsuranceIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { BarDatum } from '@nivo/bar';
import costService from '../../services/costService';
import { Cost } from '../../types';
import axios from 'axios';
import { getApiUrl } from '../../utils/apiUtils';
import { API_CONFIG } from '../../config/apiConfig';

// Define Vehicle interface
interface Vehicle {
  _id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: string;
}

// Define types for our chart data
type ExpenseType = 'fuel' | 'maintenance' | 'insurance' | 'registration' | 'lease' | 'toll' | 'tax' | 'other';
type PaymentStatus = 'paid' | 'pending' | 'overdue';
type PaymentMethod = 'cash' | 'credit' | 'debit' | 'bank transfer' | 'other';

// Omit date from Cost type and create our own version with Moment
interface CostFormValues extends Omit<Cost, '_id' | 'createdAt' | 'updatedAt' | 'date'> {
  date: moment.Moment | null;
}

interface CostSummary {
  expenseType: string;
  total: number;
}

// Add interfaces for data types
interface MonthlyData extends BarDatum {
  month: string;
  amount: number;
}

interface YearlyData extends BarDatum {
  year: string;
  amount: number;
}

interface CategoryData {
  category: string;
  amount: number;
}

const CostManagement: React.FC = () => {
  // State variables
  const [costs, setCosts] = useState<Cost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formValues, setFormValues] = useState<CostFormValues>({
    vehicleId: '',
    driverId: '',
    expenseType: 'fuel',
    amount: 0,
    date: moment(),
    description: '',
    paymentStatus: 'pending',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CostFormValues, string>>>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
    duration?: number;
  }>({
    open: false,
    message: '',
    severity: 'success',
    duration: 5000
  });
  const [filters, setFilters] = useState({
    expenseType: '',
    startDate: moment().subtract(30, 'days'),
    endDate: moment(),
    paymentStatus: '',
  });
  const [costSummary, setCostSummary] = useState<CostSummary[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    costId: string | null;
  }>({
    open: false,
    costId: null,
  });
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyData[]>([]);
  const [yearlyExpenses, setYearlyExpenses] = useState<YearlyData[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryData[]>([]);

  // Fetch vehicles data
  const fetchVehicles = useCallback(async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.VEHICLES));
      const vehiclesData: Vehicle[] = response.data.map((v: any) => ({
        _id: v._id,
        licensePlate: v.licensePlate,
        make: v.make,
        model: v.model,
        year: v.year
      }));
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      showSnackbar('Failed to fetch vehicles. Please try again later.', 'error', 6000);
    }
  }, []);

  // Fetch costs data
  const fetchCosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await costService.getAllCosts();
      setCosts(response);
    } catch (error) {
      console.error('Failed to fetch costs:', error);
      showSnackbar('Failed to fetch costs. Please try again later.', 'error', 6000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch cost summary
  const fetchCostSummary = useCallback(async () => {
    try {
      const response = await costService.getCostsSummary();
      if (Array.isArray(response)) {
        setCostSummary(response);
      } else if (response && typeof response === 'object') {
        const summaryArray = Object.entries(response).map(([expenseType, total]) => ({
          expenseType,
          total: typeof total === 'number' ? total : Number(total) || 0
        }));
        setCostSummary(summaryArray);
      } else {
        console.error('Invalid cost summary response format:', response);
        showSnackbar('Invalid cost summary data received.', 'warning', 4000);
        setCostSummary([]);
      }
    } catch (error) {
      console.error('Failed to fetch cost summary:', error);
      showSnackbar('Failed to fetch cost summary. Please try again later.', 'error', 6000);
      setCostSummary([]);
    }
  }, []);

  // Add new function to fetch expense data
  const fetchExpenseData = useCallback(async () => {
    try {
      // Fetch monthly expenses
      const monthlyResponse = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.COSTS + '/monthly'));
      console.log('Monthly Response:', monthlyResponse.data);
      
      let monthlyData: MonthlyData[] = [];
      if (monthlyResponse.data.status === 'success' && monthlyResponse.data.data.monthlyExpenses) {
        monthlyData = monthlyResponse.data.data.monthlyExpenses.map((item: any) => {
          const monthDate = moment().month(item.month - 1).year(item.year);
          return {
            month: monthDate.format('MMM YYYY'),
            amount: item.totalAmount,
            'Monthly Expenses': item.totalAmount
          };
        });
      }
      console.log('Transformed Monthly Data:', monthlyData);
      setMonthlyExpenses(monthlyData);

      // Fetch yearly expenses
      const yearlyResponse = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.COSTS + '/yearly'));
      console.log('Yearly Response:', yearlyResponse.data);
      
      let yearlyData: YearlyData[] = [];
      if (yearlyResponse.data.status === 'success' && yearlyResponse.data.data.yearlyExpenses) {
        yearlyData = yearlyResponse.data.data.yearlyExpenses.map((item: any) => ({
          year: item.year.toString(),
          amount: item.totalAmount,
          'Yearly Expenses': item.totalAmount
        }));
      }
      console.log('Transformed Yearly Data:', yearlyData);
      setYearlyExpenses(yearlyData);

      // Fetch category expenses
      const categoryResponse = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.COSTS + '/by-category'));
      console.log('Category Response:', categoryResponse.data);
      
      let categoryData: CategoryData[] = [];
      if (categoryResponse.data.status === 'success' && categoryResponse.data.data.categories) {
        categoryData = categoryResponse.data.data.categories.map((item: any) => ({
          category: capitalizeFirstLetter(item.category),
          amount: item.totalAmount,
          value: item.totalAmount, // Required for Nivo Pie chart
          id: item.category, // Required for Nivo Pie chart
          label: capitalizeFirstLetter(item.category), // Required for Nivo Pie chart
          percentage: item.percentage
        }));
      }
      console.log('Transformed Category Data:', categoryData);
      setCategoryExpenses(categoryData);
    } catch (error) {
      console.error('Failed to fetch expense data:', error);
      showSnackbar('Failed to fetch expense data. Please try again later.', 'error', 6000);
      // Set empty arrays on error
      setMonthlyExpenses([]);
      setYearlyExpenses([]);
      setCategoryExpenses([]);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchCosts();
    fetchCostSummary();
    fetchVehicles();
    fetchExpenseData();
  }, [fetchCosts, fetchCostSummary, fetchVehicles, fetchExpenseData]);

  // Show snackbar message with different severities
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning', duration?: number) => {
    setSnackbar({
      open: true,
      message,
      severity,
      duration: duration || 5000
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Open modal for adding new cost
  const handleAdd = () => {
    setEditingCost(null);
    setFormValues({
      vehicleId: '',
      driverId: '',
      expenseType: 'fuel',
      amount: 0,
      date: moment(),
      description: '',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal for editing cost
  const handleEdit = (cost: Cost) => {
    setEditingCost(cost);
    setFormValues({
      vehicleId: cost.vehicleId || '',
      driverId: cost.driverId || '',
      expenseType: cost.expenseType,
      amount: cost.amount,
      date: moment(cost.date),
      description: cost.description,
      invoiceNumber: cost.invoiceNumber || '',
      vendor: cost.vendor || '',
      paymentStatus: cost.paymentStatus,
      paymentMethod: cost.paymentMethod || 'cash',
      notes: cost.notes || '',
      attachments: cost.attachments || [],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Update handleDelete to show confirmation first
  const handleDelete = (id: string) => {
    setDeleteConfirmation({
      open: true,
      costId: id,
    });
  };

  // Add new function to handle actual deletion
  const confirmDelete = async () => {
    if (!deleteConfirmation.costId) return;

    try {
      await costService.deleteCost(deleteConfirmation.costId);
      setCosts(costs.filter(cost => cost._id !== deleteConfirmation.costId));
      showSnackbar('Cost deleted successfully', 'success', 3000);
      fetchCostSummary();
    } catch (error) {
      console.error('Failed to delete cost:', error);
      showSnackbar('Failed to delete cost. Please try again later.', 'error', 6000);
    } finally {
      setDeleteConfirmation({ open: false, costId: null });
    }
  };

  // Add function to cancel deletion
  const cancelDelete = () => {
    setDeleteConfirmation({ open: false, costId: null });
  };

  // Handle form input changes
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
    if (formErrors[name as keyof CostFormValues]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  // Handle select input changes - updated to use SelectChangeEvent with generic type
  const handleExpenseTypeChange = (event: SelectChangeEvent<ExpenseType>) => {
    const name = event.target.name as string;
    const value = event.target.value as ExpenseType;
    setFormValues({ ...formValues, [name]: value });
    if (formErrors[name as keyof CostFormValues]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const handlePaymentStatusChange = (event: SelectChangeEvent<PaymentStatus>) => {
    const name = event.target.name as string;
    const value = event.target.value as PaymentStatus;
    setFormValues({ ...formValues, [name]: value });
    if (formErrors[name as keyof CostFormValues]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const handlePaymentMethodChange = (event: SelectChangeEvent<PaymentMethod>) => {
    const name = event.target.name as string;
    const value = event.target.value as PaymentMethod;
    setFormValues({ ...formValues, [name]: value });
    if (formErrors[name as keyof CostFormValues]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const handleVehicleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setFormValues({ ...formValues, vehicleId: value });
    if (formErrors.vehicleId) {
      setFormErrors({ ...formErrors, vehicleId: '' });
    }
  };

  // Handle date change
  const handleDateChange = (date: moment.Moment | null) => {
    setFormValues({ ...formValues, date });
    if (formErrors.date) {
      setFormErrors({ ...formErrors, date: '' });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: Partial<Record<keyof CostFormValues, string>> = {};
    if (!formValues.expenseType) errors.expenseType = 'Expense type is required';
    if (!formValues.amount || formValues.amount <= 0) errors.amount = 'Amount must be greater than 0';
    if (!formValues.date) errors.date = 'Date is required';
    if (!formValues.description) errors.description = 'Description is required';
    if (!formValues.paymentStatus) errors.paymentStatus = 'Payment status is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      showSnackbar('Please fill in all required fields correctly.', 'warning', 4000);
      return;
    }

    try {
      const costData = {
        ...formValues,
        date: formValues.date ? formValues.date.format('YYYY-MM-DD') : '',
      };

      if (editingCost) {
        await costService.updateCost(editingCost._id, costData);
        setCosts(costs.map(cost => (cost._id === editingCost._id ? { ...cost, ...costData } : cost)));
        showSnackbar('Cost updated successfully', 'success', 3000);
      } else {
        const response = await costService.createCost(costData);
        // Handle the response structure correctly
        const newCost = response.expense || response;
        setCosts(prevCosts => [...prevCosts, newCost]);
        showSnackbar(response.message || 'Cost added successfully', 'success', 3000);
      }

      setIsModalOpen(false);
      fetchCostSummary();
    } catch (error) {
      console.error('Failed to save cost:', error);
      showSnackbar('Failed to save cost. Please try again later.', 'error', 6000);
    }
  };

  // Close modal
  const handleClose = () => {
    setIsModalOpen(false);
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Toggle filters
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Apply filters
  const applyFilters = async () => {
    setIsLoading(true);
    try {
      const startDate = filters.startDate.format('YYYY-MM-DD');
      const endDate = filters.endDate.format('YYYY-MM-DD');
      const response = await costService.getCostsByDateRange(startDate, endDate);
      
      let filteredCosts = response;
      
      if (filters.expenseType) {
        filteredCosts = filteredCosts.filter((cost: Cost) => cost.expenseType === filters.expenseType);
      }
      
      if (filters.paymentStatus) {
        filteredCosts = filteredCosts.filter((cost: Cost) => cost.paymentStatus === filters.paymentStatus);
      }
      
      setCosts(filteredCosts);
      if (filteredCosts.length === 0) {
        showSnackbar('No costs found for the selected filters.', 'warning', 4000);
      }
    } catch (error) {
      console.error('Failed to apply filters:', error);
      showSnackbar('Failed to apply filters. Please try again later.', 'error', 6000);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      expenseType: '',
      startDate: moment().subtract(30, 'days'),
      endDate: moment(),
      paymentStatus: '',
    });
    fetchCosts();
  };

  // Prepare data for pie chart
  const getPieChartData = () => {
    // Check if costSummary is an array and not empty
    if (!Array.isArray(costSummary)) {
      console.error('Cost summary is not an array:', costSummary);
      return [];
    }
    
    return costSummary.map(item => ({
      id: item.expenseType || 'unknown',
      label: item.expenseType 
        ? item.expenseType.charAt(0).toUpperCase() + item.expenseType.slice(1) 
        : 'Unknown',
      value: item.total,
    }));
  };

  // Get total costs
  const getTotalCosts = () => {
    return formatAmount(costs.reduce((total, cost) => total + Number(cost.amount), 0));
  };

  // Filter costs by expense type
  const getCostsByType = (type: string) => {
    return formatAmount(costs.filter(cost => cost.expenseType === type)
      .reduce((total, cost) => total + Number(cost.amount), 0));
  };

  // Get expense type icon
  const getExpenseTypeIcon = (type: string) => {
    switch (type) {
      case 'fuel':
        return <FuelIcon />;
      case 'maintenance':
        return <MaintenanceIcon />;
      case 'insurance':
      case 'registration':
      case 'tax':
        return <VehicleIcon />;
      default:
        return <MoneyIcon />;
    }
  };

  // Capitalize first letter helper function
  const capitalizeFirstLetter = (text: string | undefined): string => {
    if (!text) return 'Unknown';
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  // Format currency amount helper function
  const formatAmount = (amount: any): string => {
    if (typeof amount === 'number') {
      return amount.toFixed(2);
    }
    // Try to convert to a number
    const num = Number(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Update the Charts tab content
  const renderChartsTab = () => (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Monthly Expenses
          </Typography>
          {monthlyExpenses.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>No monthly expense data available</Typography>
            </Box>
          ) : (
            <Box sx={{ height: '90%' }}>
              <ResponsiveBar
                data={monthlyExpenses}
                keys={['Monthly Expenses']}
                indexBy="month"
                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                colors={{ scheme: 'nivo' }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Month',
                  legendPosition: 'middle',
                  legendOffset: 32,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Amount (AED)',
                  legendPosition: 'middle',
                  legendOffset: -40,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                animate={true}
                tooltip={({ id, value }) => (
                  <Box sx={{ bgcolor: 'white', p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                    <Typography variant="body2">
                      {id}: AED {value.toFixed(2)}
                    </Typography>
                  </Box>
                )}
              />
            </Box>
          )}
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Yearly Expenses
          </Typography>
          {yearlyExpenses.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>No yearly expense data available</Typography>
            </Box>
          ) : (
            <Box sx={{ height: '90%' }}>
              <ResponsiveBar
                data={yearlyExpenses}
                keys={['Yearly Expenses']}
                indexBy="year"
                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                colors={{ scheme: 'nivo' }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Year',
                  legendPosition: 'middle',
                  legendOffset: 32,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Amount (AED)',
                  legendPosition: 'middle',
                  legendOffset: -40,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                animate={true}
                tooltip={({ id, value }) => (
                  <Box sx={{ bgcolor: 'white', p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                    <Typography variant="body2">
                      {id}: AED {value.toFixed(2)}
                    </Typography>
                  </Box>
                )}
              />
            </Box>
          )}
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Expenses by Category
          </Typography>
          {categoryExpenses.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>No category expense data available</Typography>
            </Box>
          ) : (
            <Box sx={{ height: '90%' }}>
              <ResponsivePie
                data={categoryExpenses.map(item => {
                  const pieData = {
                    id: item.category || 'Unknown',
                    label: item.category ? capitalizeFirstLetter(item.category) : 'Unknown',
                    value: typeof item.amount === 'number' ? item.amount : Number(item.amount) || 0
                  };
                  console.log('Pie Chart Item:', pieData); // Debug log
                  return pieData;
                })}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
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
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  // Update renderTabContent to use the new charts tab
  const renderTabContent = () => {
    switch (tabValue) {
      case 0: // List View
        return (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Expense Type</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : costs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No costs found
                    </TableCell>
                  </TableRow>
                ) : (
                  costs.map(cost => (
                    <TableRow key={cost._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getExpenseTypeIcon(cost.expenseType)}
                          {capitalizeFirstLetter(cost.expenseType)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {cost.vehicleId ? (
                          vehicles.find(v => v._id === cost.vehicleId) ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <VehicleIcon fontSize="small" />
                              {`${vehicles.find(v => v._id === cost.vehicleId)?.make} ${vehicles.find(v => v._id === cost.vehicleId)?.model} (${vehicles.find(v => v._id === cost.vehicleId)?.licensePlate})`}
                            </Box>
                          ) : (
                            'Vehicle not found'
                          )
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="bold">AED {formatAmount(cost.amount)}</Typography>
                      </TableCell>
                      <TableCell>{moment(cost.date).format('MMM DD, YYYY')}</TableCell>
                      <TableCell>{cost.description}</TableCell>
                      <TableCell>{cost.vendor || '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={capitalizeFirstLetter(cost.paymentStatus)} 
                          color={
                            cost.paymentStatus === 'paid' ? 'success' : 
                            cost.paymentStatus === 'pending' ? 'warning' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEdit(cost)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(cost._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 1: // Charts
        return renderChartsTab();
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyIcon fontSize="large" />
          Cost Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={toggleFilters}
            sx={{ mr: 1 }}
          >
            Filters
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Cost
          </Button>
        </Box>
      </Box>

      {/* Filters Section */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Expense Type</InputLabel>
                <Select
                  value={filters.expenseType}
                  label="Expense Type"
                  name="expenseType"
                  onChange={(e) => setFilters({ ...filters, expenseType: e.target.value as string })}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="fuel">Fuel</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="insurance">Insurance</MenuItem>
                  <MenuItem value="registration">Registration</MenuItem>
                  <MenuItem value="lease">Lease</MenuItem>
                  <MenuItem value="toll">Toll</MenuItem>
                  <MenuItem value="tax">Tax</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => setFilters({ ...filters, startDate: date || moment() })}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => setFilters({ ...filters, endDate: date || moment() })}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={filters.paymentStatus}
                  label="Payment Status"
                  name="paymentStatus"
                  onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value as string })}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button variant="outlined" onClick={resetFilters}>
                  Reset
                </Button>
                <Button variant="contained" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="cost management tabs">
          <Tab label="List View" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Cost Form Dialog */}
      <Dialog open={isModalOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCost ? 'Edit Cost' : 'Add New Cost'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.expenseType} margin="normal">
                <InputLabel>Expense Type *</InputLabel>
                <Select
                  name="expenseType"
                  value={formValues.expenseType}
                  label="Expense Type *"
                  onChange={handleExpenseTypeChange}
                >
                  <MenuItem value="fuel">Fuel</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="insurance">Insurance</MenuItem>
                  <MenuItem value="registration">Registration</MenuItem>
                  <MenuItem value="lease">Lease</MenuItem>
                  <MenuItem value="toll">Toll</MenuItem>
                  <MenuItem value="tax">Tax</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {formErrors.expenseType && <FormHelperText>{formErrors.expenseType}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="amount"
                label="Amount (AED) *"
                type="number"
                value={formValues.amount}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">AED</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Date *"
                value={formValues.date}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal',
                    error: !!formErrors.date,
                    helperText: formErrors.date
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.vehicleId}>
                <InputLabel>Vehicle</InputLabel>
                <Select
                  name="vehicleId"
                  value={formValues.vehicleId}
                  onChange={handleVehicleChange}
                  label="Vehicle"
                >
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle._id} value={vehicle._id}>
                      {`${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.vehicleId && (
                  <FormHelperText>{formErrors.vehicleId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description *"
                value={formValues.description}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={!!formErrors.description}
                helperText={formErrors.description}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="vendor"
                label="Vendor"
                value={formValues.vendor || ''}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="invoiceNumber"
                label="Invoice Number"
                value={formValues.invoiceNumber || ''}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.paymentStatus} margin="normal">
                <InputLabel>Payment Status *</InputLabel>
                <Select
                  name="paymentStatus"
                  value={formValues.paymentStatus}
                  label="Payment Status *"
                  onChange={handlePaymentStatusChange}
                >
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
                {formErrors.paymentStatus && <FormHelperText>{formErrors.paymentStatus}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="paymentMethod"
                  value={formValues.paymentMethod || 'cash'}
                  label="Payment Method"
                  onChange={handlePaymentMethodChange}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="credit">Credit Card</MenuItem>
                  <MenuItem value="debit">Debit Card</MenuItem>
                  <MenuItem value="bank transfer">Bank Transfer</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={formValues.notes || ''}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingCost ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.open}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete this cost? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={snackbar.duration} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CostManagement; 