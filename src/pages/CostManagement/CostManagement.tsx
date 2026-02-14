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

// Omit date from Cost type and create our own version with Moment
interface CostFormValues {
  vehicleId: string;
  driverId: string;
  expenseType: string;
  amount: string;
  date: moment.Moment | null;
  description: string;
  paymentStatus: string;
  paymentMethod: string;
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
  const [selectedExpenseType, setSelectedExpenseType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [activeTab, setActiveTab] = useState(0);
  const [formValues, setFormValues] = useState<CostFormValues>({
    vehicleId: '',
    driverId: '',
    expenseType: 'maintenance',
    amount: '0',
    date: moment(),
    description: '',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDetail | null>(null);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      const response = await api.getCurrentMonthCosts();
      setCostData(response);
    } catch (err) {
      setError('Failed to fetch cost data');
      console.error('Error fetching cost data:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const getChartData = () => {
    if (!costData) return null;

    const expenseTypeData = costData.vehicles.reduce((acc: any[], vehicle) => {
      vehicle.details.forEach(detail => {
        const existing = acc.find(item => item.id === detail.expenseType);
        if (existing) {
          existing.value += detail.amount;
        } else {
          acc.push({
            id: detail.expenseType,
            label: detail.expenseType,
            value: detail.amount
          });
        }
      });
      return acc;
    }, []);

    const vehicleData = costData.vehicles.map(vehicle => ({
      vehicle: vehicle.vehicleName,
      total: vehicle.expenses
    }));

    return {
      expenseTypeData,
      vehicleData
    };
  };

  const handleAddExpense = async () => {
    try {
      await api.createCost({
        ...formValues,
        amount: formValues.amount.toString(),
        date: formValues.date?.format('YYYY-MM-DD') || moment().format('YYYY-MM-DD'),
      });
      setAddDialogOpen(false);
      fetchCostData();
      // Reset form values
      setFormValues({
        vehicleId: '',
        driverId: '',
        expenseType: 'maintenance',
        amount: '0',
        date: moment(),
        description: '',
        paymentStatus: 'paid',
        paymentMethod: 'cash',
      });
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleEditClick = (expense: ExpenseDetail) => {
    setSelectedExpense(expense);
    setFormValues({
      vehicleId: expense.vehicleId,
      driverId: expense.driverId,
      expenseType: expense.expenseType,
      amount: expense.amount.toString(),
      date: moment(expense.date),
      description: expense.description,
      paymentStatus: expense.paymentStatus,
      paymentMethod: expense.paymentMethod,
    });
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
    try {
      await api.updateCost(selectedExpense._id, {
        ...formValues,
        date: formValues.date?.format('YYYY-MM-DD') || moment().format('YYYY-MM-DD'),
      });
      setEditDialogOpen(false);
      setSelectedExpense(null);
      fetchCostData();
      // Reset form values
      setFormValues({
        vehicleId: '',
        driverId: '',
        expenseType: 'maintenance',
        amount: '0',
        date: moment(),
        description: '',
        paymentStatus: 'paid',
        paymentMethod: 'cash',
      });
    } catch (error) {
      console.error('Error updating expense:', error);
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
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const filteredData = getFilteredData();
  const chartData = getChartData();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Cost Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Add Expense
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filters
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              overflow: 'hidden',
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.25)}`,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
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
                    Total Expenses
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: theme.palette.primary.main,
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 0.5,
                    }}
                  >
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
                    {filteredData?.total.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    width: 44, 
                    height: 44,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                  }}
                >
                  <MoneyIcon sx={{ fontSize: 22, color: 'white' }} />
                </Avatar>
              </Box>
              <Box 
                sx={{ 
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  overflow: 'hidden',
                }}
              >
                <Box 
                  sx={{ 
                    height: '100%',
                    width: '100%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: `0 4px 20px ${alpha(theme.palette.info.main, 0.15)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              overflow: 'hidden',
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: `0 12px 28px ${alpha(theme.palette.info.main, 0.25)}`,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
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
                    Period
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      fontWeight: 600,
                      color: theme.palette.info.main,
                    }}
                  >
                    {new Date(filteredData?.period.start || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(filteredData?.period.end || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    width: 44, 
                    height: 44,
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.info.main, 0.4)}`,
                  }}
                >
                  <CalendarIcon sx={{ fontSize: 22, color: 'white' }} />
                </Avatar>
              </Box>
              <Box 
                sx={{ 
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  overflow: 'hidden',
                }}
              >
                <Box 
                  sx={{ 
                    height: '100%',
                    width: '100%',
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.15)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
              overflow: 'hidden',
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: `0 12px 28px ${alpha(theme.palette.secondary.main, 0.25)}`,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
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
                    Number of Vehicles
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: theme.palette.secondary.main,
                    }}
                  >
                    {filteredData?.vehicles.length}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    width: 44, 
                    height: 44,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.secondary.main, 0.4)}`,
                  }}
                >
                  <VehicleIcon sx={{ fontSize: 22, color: 'white' }} />
                </Avatar>
              </Box>
              <Box 
                sx={{ 
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  overflow: 'hidden',
                }}
              >
                <Box 
                  sx={{ 
                    height: '100%',
                    width: '100%',
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Detailed List" />
        <Tab label="Expense Distribution" />
          <Tab label="Vehicle Comparison" />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {activeTab === 1 && chartData && (
            <Box height={400}>
              <ResponsivePie
                data={chartData.expenseTypeData}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
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
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    translateY: 56,
                    itemWidth: 100,
                    itemHeight: 18,
                    itemTextColor: '#999',
                    symbolSize: 18,
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
          )}
          {activeTab === 2 && chartData && (
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
          {activeTab === 0 && (
            <TableContainer sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
            }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)` }}>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }} />
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Vehicle</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Total Expenses</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Number of Expenses</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData?.vehicles.map((row) => (
                    <Row 
                      key={row.vehicleId} 
                      row={row} 
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)}>
        <DialogTitle>Filter Expenses</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
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
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            setFilterDialogOpen(false);
            fetchCostData();
          }} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Vehicle</InputLabel>
              <Select
                value={formValues.vehicleId}
                label="Vehicle"
                onChange={(e) => setFormValues({ ...formValues, vehicleId: e.target.value })}
              >
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
                value={formValues.expenseType}
                label="Expense Type"
                onChange={(e) => setFormValues({ ...formValues, expenseType: e.target.value })}
              >
                <MenuItem value="fuel">Fuel</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="insurance">Insurance</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Amount"
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
              label="Description"
              value={formValues.description}
              onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={formValues.paymentStatus}
                label="Payment Status"
                onChange={(e) => setFormValues({ ...formValues, paymentStatus: e.target.value })}
              >
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={formValues.paymentMethod}
                label="Payment Method"
                onChange={(e) => setFormValues({ ...formValues, paymentMethod: e.target.value })}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="credit">Credit Card</MenuItem>
                <MenuItem value="debit">Debit Card</MenuItem>
                <MenuItem value="bank transfer">Bank Transfer</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddExpense} variant="contained">
            Add Expense
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Expense</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Vehicle</InputLabel>
              <Select
                value={formValues.vehicleId}
                label="Vehicle"
                onChange={(e) => setFormValues({ ...formValues, vehicleId: e.target.value })}
              >
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
                value={formValues.expenseType}
                label="Expense Type"
                onChange={(e) => setFormValues({ ...formValues, expenseType: e.target.value })}
              >
                <MenuItem value="fuel">Fuel</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="insurance">Insurance</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Amount"
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
              label="Description"
              value={formValues.description}
              onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={formValues.paymentStatus}
                label="Payment Status"
                onChange={(e) => setFormValues({ ...formValues, paymentStatus: e.target.value })}
              >
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={formValues.paymentMethod}
                label="Payment Method"
                onChange={(e) => setFormValues({ ...formValues, paymentMethod: e.target.value })}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="credit">Credit Card</MenuItem>
                <MenuItem value="debit">Debit Card</MenuItem>
                <MenuItem value="bank transfer">Bank Transfer</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateExpense} variant="contained">
            Update Expense
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CostManagement; 