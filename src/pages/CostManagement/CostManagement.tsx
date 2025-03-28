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
  const [open, setOpen] = useState(false);

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
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
            disabled={row.details.length === 0}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.vehicleName}
        </TableCell>
        <TableCell align="right">AED {row.expenses.toLocaleString()}</TableCell>
        <TableCell align="right">{row.details.length}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Expense Details
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.details.map((detail) => (
                    <TableRow key={detail._id}>
                      <TableCell>{formatDate(detail.date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={detail.expenseType}
                          color={getExpenseTypeColor(detail.expenseType)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{detail.description}</TableCell>
                      <TableCell align="right">
                        AED {detail.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{detail.paymentMethod}</TableCell>
                      <TableCell>
                        <Chip
                          label={detail.paymentStatus}
                          color={getPaymentStatusColor(detail.paymentStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => onEdit(detail)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onDelete(detail._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
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
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Expenses
            </Typography>
            <Typography variant="h4" color="primary">
              AED {filteredData?.total.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Period
            </Typography>
            <Typography>
              {new Date(filteredData?.period.start || '').toLocaleDateString()} - {new Date(filteredData?.period.end || '').toLocaleDateString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Number of Vehicles
            </Typography>
            <Typography variant="h4" color="primary">
              {filteredData?.vehicles.length}
            </Typography>
          </Paper>
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
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Vehicle</TableCell>
                    <TableCell align="right">Total Expenses</TableCell>
                    <TableCell align="right">Number of Expenses</TableCell>
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