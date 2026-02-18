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
  Collapse,
  Avatar,
  Stack,
  Tooltip,
  useTheme,
  alpha,
  Card,
  CardContent,
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
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  AttachFile as AttachFileIcon,
  OpenInNew as OpenInNewIcon,
  InsertDriveFile as FileIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { BarDatum } from '@nivo/bar';
import costService from '../../services/costService';
import { Cost } from '../../types';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/environment';
import { api } from '../../services/api';

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

// Simplified Cost form - only essential fields
interface CostFormValues {
  vehicleId: string;
  amount: string;
  date: moment.Moment | null;
  notes?: string;
  receipt?: File | null;
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

interface ExpenseDetail {
  _id: string;
  vehicleId: string;
  driverId: string;
  expenseType: string;
  amount: number;
  date: string;
  description: string;
  paymentStatus: string;
  paymentMethod: string;
  receipts?: Array<{ url: string; fileName: string; uploadedAt: string }>;
  createdAt: string;
  updatedAt: string;
}

interface VehicleExpense {
  vehicleId: string;
  vehicleName: string;
  expenses: number;
  details: ExpenseDetail[];
}

interface CostData {
  vehicles: VehicleExpense[];
  total: number;
  period: {
    start: string;
    end: string;
  };
}

const Row: React.FC<{
  row: VehicleExpense;
  onEdit: (expense: ExpenseDetail) => void;
  onDelete: (expenseId: string) => void;
}> = ({ row, onEdit, onDelete }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getExpenseTypeColor = (type: string) => {
    switch (type) {
      case 'fuel':
        return 'primary';
      case 'maintenance':
        return 'secondary';
      case 'other':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <>
      <TableRow 
        sx={{ 
          '& > *': { borderBottom: 'unset' },
          backgroundColor: open ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderLeft: open ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
        }}
      >
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
            disabled={row.details.length === 0}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <VehicleIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Typography variant="body2" fontWeight={700}>
              {row.vehicleName}
            </Typography>
          </Box>
        </TableCell>
        <TableCell align="right">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
            <MoneyIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
            <Typography variant="body2" fontWeight={700} color="success.main">
              AED {row.expenses.toLocaleString()}
            </Typography>
          </Box>
        </TableCell>
        <TableCell align="right">
          <Chip 
            label={row.details.length} 
            size="small" 
            color="primary"
            sx={{ fontWeight: 700 }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, backgroundColor: alpha(theme.palette.background.default, 0.5), borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom component="div" sx={{ mb: 2, fontWeight: 700 }}>
                Expense Details
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)` }}>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Payment</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.details.map((detail) => (
                    <TableRow 
                      key={detail._id}
                      onMouseEnter={() => setHoveredRow(detail._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      sx={{
                        backgroundColor: hoveredRow === detail._id 
                          ? alpha(theme.palette.primary.main, 0.04)
                          : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                          <Typography variant="body2">{formatDate(detail.date)}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={detail.expenseType}
                          color={getExpenseTypeColor(detail.expenseType)}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {detail.description}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          AED {detail.amount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PaymentIcon sx={{ fontSize: 14, color: theme.palette.info.main }} />
                          <Typography variant="caption">{detail.paymentMethod}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={detail.paymentStatus}
                          color={getPaymentStatusColor(detail.paymentStatus)}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Edit Expense">
                            <IconButton
                              size="small"
                              onClick={() => onEdit(detail)}
                              sx={{
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.info.main, 0.2),
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.2s',
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Expense">
                            <IconButton
                              size="small"
                              onClick={() => onDelete(detail._id)}
                              sx={{
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.2s',
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const CostManagement: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedExpenseType, setSelectedExpenseType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[moment.Moment | null, moment.Moment | null]>([
    moment().startOf('month'), // Start of current month
    moment().endOf('month')    // End of current month
  ]);
  const [activeTab, setActiveTab] = useState(0);
  const [formValues, setFormValues] = useState<CostFormValues>({
    vehicleId: '',
    amount: '',
    date: moment(),
    notes: '',
    receipt: null,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'vehicle'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [contractIncome, setContractIncome] = useState<number>(0);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getAllCosts(); // Changed from getCurrentMonthCosts to getAllCosts
      console.log('=== Cost Data Structure ===');
      console.log('Total vehicles:', response.vehicles?.length || 0);
      console.log('Total expenses:', response.total);
      if (response.vehicles) {
        response.vehicles.forEach((v: VehicleExpense, index: number) => {
          console.log(`Vehicle ${index + 1}: ${v.vehicleName} - ${v.details?.length || 0} expenses, Total: AED ${v.expenses}`);
        });
      }
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('==========================');
      setCostData(response);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch cost data';
      setError(errorMessage);
      console.error('Error fetching cost data:', err);
      alert(`Error loading cost data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch vehicles list
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

  // Fetch contract income for selected vehicles
  useEffect(() => {
    const fetchContractIncome = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(API_ENDPOINTS.contracts, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data) {
          let contracts = response.data;
          
          // Filter by selected vehicles if any
          if (selectedVehicles.length > 0) {
            contracts = contracts.filter((contract: any) => 
              selectedVehicles.includes(contract.vehicleId)
            );
          }
          
          // Calculate total income from active contracts
          const totalIncome = contracts
            .filter((contract: any) => contract.status === 'Active')
            .reduce((sum: number, contract: any) => sum + Number(contract.value || 0), 0);
          
          setContractIncome(totalIncome);
        }
      } catch (error) {
        console.error('Error fetching contract income:', error);
        setContractIncome(0);
      }
    };
    
    fetchContractIncome();
  }, [selectedVehicles]);

  useEffect(() => {
    fetchCostData();
  }, []);

  const handleFilterChange = (event: SelectChangeEvent) => {
    setSelectedVehicle(event.target.value);
  };

  const handleExpenseTypeChange = (event: SelectChangeEvent) => {
    setSelectedExpenseType(event.target.value);
  };

  const handleDateRangeChange = (dates: [moment.Moment | null, moment.Moment | null]) => {
    setDateRange(dates);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getFilteredData = () => {
    if (!costData) return null;

    let filteredVehicles = [...costData.vehicles];

    if (selectedVehicle !== 'all') {
      filteredVehicles = filteredVehicles.filter(v => v.vehicleId === selectedVehicle);
    }

    // Filter by multiple vehicles if any selected
    if (selectedVehicles.length > 0) {
      filteredVehicles = filteredVehicles.filter(v => selectedVehicles.includes(v.vehicleId));
    }

    if (selectedExpenseType !== 'all') {
      filteredVehicles = filteredVehicles.map(v => ({
        ...v,
        details: v.details.filter(d => d.expenseType === selectedExpenseType)
      }));
    }

    if (dateRange[0] && dateRange[1]) {
      filteredVehicles = filteredVehicles.map(v => ({
        ...v,
        details: v.details.filter(d => {
          const date = moment(d.date);
          return date.isBetween(dateRange[0], dateRange[1], 'day', '[]');
        })
      }));
    }

    return {
      ...costData,
      vehicles: filteredVehicles
    };
  };

  // Get all expenses as a flat list sorted by date (newest first)
  const getAllExpenses = () => {
    const filteredData = getFilteredData();
    if (!filteredData) return [];
    
    let allExpenses: (ExpenseDetail & { vehicleName: string })[] = [];
    
    filteredData.vehicles.forEach(vehicle => {
      if (vehicle.details && Array.isArray(vehicle.details)) {
        vehicle.details.forEach(expense => {
          allExpenses.push({
            ...expense,
            vehicleName: vehicle.vehicleName
          });
        });
      }
    });
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      allExpenses = allExpenses.filter(expense =>
        expense.vehicleName.toLowerCase().includes(query) ||
        expense.description?.toLowerCase().includes(query) ||
        expense.expenseType.toLowerCase().includes(query) ||
        expense.amount.toString().includes(query) ||
        expense.paymentMethod?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    allExpenses.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'vehicle':
          comparison = a.vehicleName.localeCompare(b.vehicleName);
          break;
        default:
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    console.log('All expenses count:', allExpenses.length);
    
    return allExpenses;
  };

  const getChartData = () => {
    const filteredExpenses = getAllExpenses();
    if (filteredExpenses.length === 0) return null;

    // Group by expense type
    const expenseTypeData = filteredExpenses.reduce((acc: any[], expense) => {
      const existing = acc.find(item => item.id === expense.expenseType);
      if (existing) {
        existing.value += expense.amount;
      } else {
        acc.push({
          id: expense.expenseType,
          label: expense.expenseType,
          value: expense.amount
        });
      }
      return acc;
    }, []);

    // Group by vehicle
    const vehicleMap = new Map<string, number>();
    filteredExpenses.forEach(expense => {
      const current = vehicleMap.get(expense.vehicleName) || 0;
      vehicleMap.set(expense.vehicleName, current + expense.amount);
    });

    const vehicleData = Array.from(vehicleMap.entries()).map(([vehicleName, total]) => ({
      vehicle: vehicleName,
      total: total
    }));

    return {
      expenseTypeData,
      vehicleData
    };
  };

  const handleAddExpense = async () => {
    if (!formValues.vehicleId || !formValues.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('vehicleId', formValues.vehicleId);
      formData.append('amount', formValues.amount);
      formData.append('date', formValues.date?.format('YYYY-MM-DD') || moment().format('YYYY-MM-DD'));
      formData.append('expenseType', 'other');
      formData.append('description', formValues.notes || 'Expense receipt');
      if (formValues.notes) {
        formData.append('notes', formValues.notes);
      }
      
      // Append multiple files
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append('receipts', file);
        });
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.costs.create, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Expense created successfully:', response.data);
      
      setAddDialogOpen(false);
      await fetchCostData(); // Wait for data to refresh
      
      alert('Expense added successfully!');
      
      // Reset form values
      setFormValues({
        vehicleId: '',
        amount: '',
        date: moment(),
        notes: '',
        receipt: null,
      });
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Error adding expense:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.join(', ') || 'Failed to add expense. Please try again.';
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (expense: ExpenseDetail) => {
    setSelectedExpense(expense);
    setFormValues({
      vehicleId: expense.vehicleId,
      amount: expense.amount.toString(),
      date: moment(expense.date),
      notes: expense.description || '',
      receipt: null,
    });
    setSelectedFiles([]);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.deleteCost(expenseId);
        fetchCostData();
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const handleUpdateExpense = async () => {
    if (!selectedExpense) return;
    if (!formValues.vehicleId || !formValues.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('vehicleId', formValues.vehicleId);
      formData.append('amount', formValues.amount);
      formData.append('date', formValues.date?.format('YYYY-MM-DD') || moment().format('YYYY-MM-DD'));
      formData.append('description', formValues.notes || 'Expense receipt');
      if (formValues.notes) {
        formData.append('notes', formValues.notes);
      }
      
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append('receipts', file);
        });
      }

      const token = localStorage.getItem('token');
      await axios.put(
        API_ENDPOINTS.costs.update(selectedExpense._id),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEditDialogOpen(false);
      setSelectedExpense(null);
      fetchCostData();
      // Reset form values
      setFormValues({
        vehicleId: '',
        amount: '',
        date: moment(),
        notes: '',
        receipt: null,
      });
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Error updating expense:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.join(', ') || 'Failed to update expense. Please try again.';
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">
          {error}
          <Button onClick={fetchCostData} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  if (!costData) {
    return (
      <Box m={2}>
        <Alert severity="info">No cost data available.</Alert>
      </Box>
    );
  }

  const filteredData = getFilteredData();
  const chartData = getChartData();
  const filteredExpenses = getAllExpenses();
  const filteredTotal = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Expense Management
          </Typography>
          {/* Active Filters Display */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            {dateRange[0] && dateRange[1] && (
              <Chip
                size="small"
                label={`${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')}`}
                icon={<CalendarIcon fontSize="small" />}
                variant="outlined"
                color="primary"
              />
            )}
            {selectedVehicle !== 'all' && (
              <Chip
                size="small"
                label={`Vehicle: ${costData?.vehicles.find(v => v.vehicleId === selectedVehicle)?.vehicleName}`}
                onDelete={() => setSelectedVehicle('all')}
                variant="outlined"
                color="secondary"
              />
            )}
            {selectedVehicles.length > 0 && (
              <Chip
                size="small"
                label={`${selectedVehicles.length} vehicle${selectedVehicles.length > 1 ? 's' : ''} selected`}
                onDelete={() => setSelectedVehicles([])}
                variant="outlined"
                color="primary"
              />
            )}
            {selectedExpenseType !== 'all' && (
              <Chip
                size="small"
                label={`Type: ${selectedExpenseType}`}
                onDelete={() => setSelectedExpenseType('all')}
                variant="outlined"
                color="secondary"
              />
            )}
            {searchQuery && (
              <Chip
                size="small"
                label={`Search: "${searchQuery}"`}
                onDelete={() => setSearchQuery('')}
                variant="outlined"
                color="secondary"
              />
            )}
          </Box>
        </Box>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '8px',
              padding: '10px 20px',
              textTransform: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              mr: 2,
              '&:hover': {
                backgroundColor: '#1D4ED8',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            Add Expense
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
            sx={{
              borderColor: '#E5E7EB',
              color: '#374151',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '8px',
              padding: '10px 20px',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#2563EB',
                backgroundColor: '#EFF6FF',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Filters
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        {/* Card 1: Total Expenses */}
        <Grid item xs={12} md={3}>
          <Box
            sx={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #E5E7EB',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                }}
              >
                <MoneyIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 0.5,
                  }}
                >
                  Total Expenses
                </Typography>
                <Typography
                  sx={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#1F2937',
                    lineHeight: 1,
                  }}
                >
                  {filteredTotal.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Card 2: Contract Income */}
        <Grid item xs={12} md={3}>
          <Box
            sx={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #E5E7EB',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                }}
              >
                <MoneyIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 0.5,
                  }}
                >
                  Contract Income
                </Typography>
                <Typography
                  sx={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#1F2937',
                    lineHeight: 1,
                  }}
                >
                  {contractIncome.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Card 3: Total Profit */}
        <Grid item xs={12} md={3}>
          <Box
            sx={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #E5E7EB',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: contractIncome - filteredTotal >= 0 
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                    : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: contractIncome - filteredTotal >= 0
                    ? '0 4px 14px rgba(16, 185, 129, 0.3)'
                    : '0 4px 14px rgba(239, 68, 68, 0.3)',
                }}
              >
                <MoneyIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 0.5,
                  }}
                >
                  Total Profit
                </Typography>
                <Typography
                  sx={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: contractIncome - filteredTotal >= 0 ? '#059669' : '#DC2626',
                    lineHeight: 1,
                  }}
                >
                  {(contractIncome - filteredTotal).toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Card 4: Vehicles */}
        <Grid item xs={12} md={3}>
          <Box
            sx={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #E5E7EB',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                }}
              >
                <VehicleIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 0.5,
                  }}
                >
                  Vehicles
                </Typography>
                <Typography
                  sx={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#1F2937',
                    lineHeight: 1,
                  }}
                >
                  {filteredData?.vehicles.length || 0}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Expenses Table */}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Detailed List & Distribution" />
          <Tab label="Vehicle Comparison" />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {activeTab === 0 && (
            <>
              {/* Search and Sort Controls */}
              <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1, minWidth: 250 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearchQuery('')}
                          edge="end"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'vehicle')}
                    startAdornment={
                      <InputAdornment position="start">
                        <SortIcon fontSize="small" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="amount">Amount</MenuItem>
                    <MenuItem value="vehicle">Vehicle</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Order</InputLabel>
                  <Select
                    value={sortOrder}
                    label="Order"
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  >
                    <MenuItem value="desc">Descending</MenuItem>
                    <MenuItem value="asc">Ascending</MenuItem>
                  </Select>
                </FormControl>

                {/* Vehicle Filter Dropdown - Multiple Select */}
                <FormControl size="small" sx={{ minWidth: 250, maxWidth: 400 }}>
                  <InputLabel>Vehicle Filter</InputLabel>
                  <Select
                    multiple
                    value={selectedVehicles}
                    label="Vehicle Filter"
                    onChange={(e) => setSelectedVehicles(e.target.value as string[])}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">All Vehicles</Typography>
                        ) : (
                          selected.map((value) => {
                            const vehicle = vehicles.find(v => v._id === value);
                            return vehicle ? (
                              <Chip
                                key={value}
                                label={`${vehicle.make} ${vehicle.model}`}
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            ) : null;
                          })
                        )}
                      </Box>
                    )}
                  >
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle._id} value={vehicle._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VehicleIcon fontSize="small" />
                          <Typography>
                            {vehicle.make} {vehicle.model} - {vehicle.licensePlate}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Chip 
                  label={`${filteredExpenses.length} expense${filteredExpenses.length !== 1 ? 's' : ''}`}
                  color="primary"
                  variant="outlined"
                />
              </Box>

              {/* Two Column Layout: Table (75%) and Chart (25%) */}
              <Grid container spacing={2}>
                <Grid item xs={12} lg={9}>
                  <TableContainer sx={{ 
                    borderRadius: 3,
                    overflowX: 'auto',
                    boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
                  }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)` }}>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Vehicle</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getAllExpenses().map((expense) => (
                    <TableRow
                      key={expense._id}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        },
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                          <Typography variant="body2">{new Date(expense.date).toLocaleDateString()}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {expense.vehicleName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expense.expenseType}
                          color={(expense.expenseType === 'fuel' ? 'primary' : expense.expenseType === 'maintenance' ? 'secondary' : 'default') as any}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {expense.description}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          AED {expense.amount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expense.paymentStatus}
                          color={(expense.paymentStatus === 'paid' ? 'success' : expense.paymentStatus === 'pending' ? 'warning' : 'error') as any}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Edit Expense">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(expense)}
                              sx={{
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.info.main, 0.2),
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.2s',
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Expense">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(expense._id)}
                              sx={{
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.2s',
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {getAllExpenses().length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No expenses found. Click "Add Expense" to create your first expense.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
                </Grid>
                
                {/* Donut Chart Column (25%) */}
                <Grid item xs={12} lg={3}>
                  {chartData && (
                    <Paper sx={{ 
                      p: 2, 
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
                    }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Vehicle Distribution
                      </Typography>
                      <Box height={400}>
                        <ResponsivePie
                          data={chartData.vehicleData.map(v => ({
                            id: v.vehicle,
                            label: v.vehicle,
                            value: v.total
                          }))}
                          margin={{ top: 20, right: 20, bottom: 80, left: 20 }}
                          innerRadius={0.5}
                          padAngle={0.7}
                          cornerRadius={3}
                          activeOuterRadiusOffset={8}
                          borderWidth={1}
                          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                          arcLinkLabelsSkipAngle={10}
                          arcLinkLabelsTextColor="#333333"
                          arcLinkLabelsThickness={1}
                          arcLinkLabelsColor={{ from: 'color' }}
                          arcLabelsSkipAngle={10}
                          arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 1.4]] }}
                          valueFormat={value => `AED ${value.toLocaleString()}`}
                          enableArcLinkLabels={false}
                          legends={[
                            {
                              anchor: 'bottom',
                              direction: 'column',
                              translateY: 56,
                              itemWidth: 80,
                              itemHeight: 18,
                              itemTextColor: '#999',
                              symbolSize: 12,
                              symbolShape: 'circle',
                              effects: [
                                {
                                  on: 'hover',
                                  style: {
                                    itemTextColor: '#000',
                                  },
                                },
                              ],
                            },
                          ]}
                        />
                      </Box>
                    </Paper>
                  )}
                </Grid>
              </Grid>
            </>
          )}
          {activeTab === 1 && chartData && (
            <Box height={400}>
              <ResponsiveBar
                data={chartData.vehicleData}
                keys={['total']}
                indexBy="vehicle"
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
                  legend: 'Vehicle',
                  legendPosition: 'middle',
                  legendOffset: 32,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Total Expenses',
                  legendPosition: 'middle',
                  legendOffset: -40,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                animate={true}
                motionConfig="gentle"
              />
            </Box>
          )}
        </Box>
      </Paper>

      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Expenses</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Quick Date Filters */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                Quick Filters
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant={dateRange[0]?.isSame(moment().startOf('month'), 'day') && dateRange[1]?.isSame(moment().endOf('month'), 'day') ? 'contained' : 'outlined'}
                  onClick={() => setDateRange([moment().startOf('month'), moment().endOf('month')])}
                >
                  This Month
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setDateRange([moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')])}
                >
                  Last Month
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setDateRange([moment().startOf('year'), moment().endOf('year')])}
                >
                  This Year
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setDateRange([moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')])}
                >
                  Last Year
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setDateRange([moment().subtract(90, 'days'), moment()])}
                >
                  Last 90 Days
                </Button>
              </Box>
            </Box>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Vehicle</InputLabel>
              <Select
                value={selectedVehicle}
                label="Vehicle"
                onChange={handleFilterChange}
              >
                <MenuItem value="all">All Vehicles</MenuItem>
                {costData?.vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.vehicleId} value={vehicle.vehicleId}>
                    {vehicle.vehicleName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Expense Type</InputLabel>
              <Select
                value={selectedExpenseType}
                label="Expense Type"
                onChange={handleExpenseTypeChange}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="fuel">Fuel</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="insurance">Insurance</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Date Range
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DatePicker
                    label="Start Date"
                    value={dateRange[0]}
                    onChange={(date) => handleDateRangeChange([date, dateRange[1]])}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DatePicker
                    label="End Date"
                    value={dateRange[1]}
                    onChange={(date) => handleDateRangeChange([dateRange[0], date])}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setSelectedVehicle('all');
              setSelectedExpenseType('all');
              setDateRange([moment().startOf('month'), moment().endOf('month')]);
              setSearchQuery('');
            }}
            color="warning"
          >
            Clear All
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setFilterDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Vehicle *</InputLabel>
              <Select
                value={formValues.vehicleId}
                label="Vehicle *"
                onChange={(e) => setFormValues({ ...formValues, vehicleId: e.target.value })}
              >
                {costData?.vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.vehicleId} value={vehicle.vehicleId}>
                    {vehicle.vehicleName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Amount *"
              type="number"
              value={formValues.amount}
              onChange={(e) => setFormValues({ ...formValues, amount: e.target.value })}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">AED</InputAdornment>,
              }}
            />

            <DatePicker
              label="Date"
              value={formValues.date}
              onChange={(date) => setFormValues({ ...formValues, date: date || moment() })}
              slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
            />

            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formValues.notes}
              onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
              placeholder="Add any notes or comments about this expense..."
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<AttachFileIcon />}
                sx={{ mb: 1 }}
              >
                Upload Receipts/Invoices (Multiple)
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setSelectedFiles([...selectedFiles, ...files]);
                    }
                  }}
                />
              </Button>
              {selectedFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    New Files to Upload ({selectedFiles.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedFiles.map((file, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          p: 1,
                          border: '1px solid',
                          borderColor: 'primary.main',
                          borderRadius: 1,
                          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05)
                        }}
                      >
                        <FileIcon fontSize="small" color="primary" />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(file.size / 1024).toFixed(1)} KB
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddExpense} 
            variant="contained" 
            disabled={uploading || !formValues.vehicleId || !formValues.amount}
          >
            {uploading ? <CircularProgress size={24} /> : 'Add Expense'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Expense</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Vehicle *</InputLabel>
              <Select
                value={formValues.vehicleId}
                label="Vehicle *"
                onChange={(e) => setFormValues({ ...formValues, vehicleId: e.target.value })}
              >
                {costData?.vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.vehicleId} value={vehicle.vehicleId}>
                    {vehicle.vehicleName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Amount *"
              type="number"
              value={formValues.amount}
              onChange={(e) => setFormValues({ ...formValues, amount: e.target.value })}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">AED</InputAdornment>,
              }}
            />

            <DatePicker
              label="Date"
              value={formValues.date}
              onChange={(date) => setFormValues({ ...formValues, date: date || moment() })}
              slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
            />

            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formValues.notes}
              onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
              placeholder="Add any notes or comments about this expense..."
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              {/* Display existing receipts */}
              {selectedExpense?.receipts && selectedExpense.receipts.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Existing Receipts/Invoices
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedExpense.receipts.map((receipt, index) => {
                      const isImage = receipt.fileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) || 
                                      receipt.url?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
                      
                      return (
                        <Box 
                          key={index} 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            backgroundColor: 'action.hover'
                          }}
                        >
                          {isImage ? (
                            <Box
                              component="img"
                              src={receipt.url}
                              alt={receipt.fileName}
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                cursor: 'pointer'
                              }}
                              onClick={() => window.open(receipt.url, '_blank')}
                            />
                          ) : (
                            <FileIcon fontSize="large" color="primary" />
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap>
                              {receipt.fileName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {moment(receipt.uploadedAt).format('MMM DD, YYYY')}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => window.open(receipt.url, '_blank')}
                            color="primary"
                            title="View attachment"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this attachment?')) {
                                try {
                                  // Remove from local state
                                  const updatedReceipts = selectedExpense.receipts?.filter((_, i) => i !== index) || [];
                                  setSelectedExpense({
                                    ...selectedExpense,
                                    receipts: updatedReceipts
                                  });
                                  
                                  // TODO: Add API call to delete from server
                                  // For now, it will be removed when the expense is saved
                                } catch (error) {
                                  console.error('Error deleting attachment:', error);
                                  alert('Failed to delete attachment');
                                }
                              }
                            }}
                            color="error"
                            title="Delete attachment"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                </Box>
              )}

              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<AttachFileIcon />}
                sx={{ mb: 1 }}
              >
                Upload New Receipts/Invoices (Multiple)
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setSelectedFiles([...selectedFiles, ...files]);
                    }
                  }}
                />
              </Button>
              {selectedFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    New Files to Upload ({selectedFiles.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedFiles.map((file, index) => {
                      const isImage = file.type.startsWith('image/');
                      const imageUrl = isImage ? URL.createObjectURL(file) : null;
                      
                      return (
                        <Box 
                          key={index} 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 1,
                            border: '1px solid',
                            borderColor: 'primary.main',
                            borderRadius: 1,
                            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05)
                          }}
                        >
                          {isImage && imageUrl ? (
                            <Box
                              component="img"
                              src={imageUrl}
                              alt={file.name}
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'primary.main',
                              }}
                            />
                          ) : (
                            <FileIcon fontSize="large" color="primary" />
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap>
                              {file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(file.size / 1024).toFixed(1)} KB
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => {
                              // Revoke object URL to prevent memory leaks
                              if (imageUrl) URL.revokeObjectURL(imageUrl);
                              setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                            }}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateExpense} 
            variant="contained" 
            disabled={uploading || !formValues.vehicleId || !formValues.amount}
          >
            {uploading ? <CircularProgress size={24} /> : 'Update Expense'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CostManagement; 