import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import moment from 'moment';
import { API_CONFIG, getApiUrl } from '../../config/api';
import axios from 'axios';

// Interfaces for API responses
interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  status: 'active' | 'inactive';
}

interface PayrollEntry {
  _id: string;
  driverId: string;
  driverName: string;
  month: string;
  year: number;
  baseSalary: number;
  overtimeHours: number;
  overtimeRate: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'approved' | 'paid';
  paymentDate?: string;
  paymentMethod: 'bank_transfer' | 'cash' | 'check';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PayrollSummary {
  totalPayroll: number;
  pendingPayments: number;
  paidPayments: number;
  averageSalary: number;
  totalDrivers: number;
  monthlyBreakdown: {
    month: string;
    total: number;
    count: number;
  }[];
}

const DriverPayroll: React.FC = () => {
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [formValues, setFormValues] = useState({
    driverId: '',
    driverName: '',
    month: moment().format('YYYY-MM'),
    baseSalary: 0,
    overtimeHours: 0,
    overtimeRate: 0,
    bonuses: 0,
    deductions: 0,
    paymentMethod: 'bank_transfer',
    status: 'pending' as 'pending' | 'approved' | 'paid',
    paymentDate: '',
    notes: '',
  });

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const [payrollResponse, driversResponse] = await Promise.all([
        axios.get(getApiUrl(API_CONFIG.ENDPOINTS.PAYROLL.LIST)),
        axios.get(getApiUrl(API_CONFIG.ENDPOINTS.DRIVERS.LIST)),
      ]);

      // Handle the API response structure
      const entries = payrollResponse.data.data || [];
      console.log('Fetched payroll entries:', entries); // Debug log
      setPayrollEntries(entries);
      
      // Calculate summary statistics from entries using baseSalary
      const totalPayroll = entries.reduce((sum: number, entry: PayrollEntry) => {
        const baseSalary = Number(entry.baseSalary) || 0;
        console.log(`Entry ${entry._id} base salary:`, baseSalary); // Debug log
        return sum + baseSalary;
      }, 0);

      const pendingPayments = entries
        .filter((entry: PayrollEntry) => entry.status === 'pending')
        .reduce((sum: number, entry: PayrollEntry) => sum + (Number(entry.baseSalary) || 0), 0);

      const paidPayments = entries
        .filter((entry: PayrollEntry) => entry.status === 'paid')
        .reduce((sum: number, entry: PayrollEntry) => sum + (Number(entry.baseSalary) || 0), 0);

      const averageSalary = entries.length > 0 ? totalPayroll / entries.length : 0;
      const uniqueDrivers = new Set(entries.map((entry: PayrollEntry) => entry.driverId)).size;

      // Calculate monthly breakdown using baseSalary
      const monthlyBreakdown = entries.reduce((acc: any[], entry: PayrollEntry) => {
        const month = entry.month;
        const existingMonth = acc.find(m => m.month === month);
        
        if (existingMonth) {
          existingMonth.total += Number(entry.baseSalary) || 0;
          existingMonth.count += 1;
        } else {
          acc.push({
            month,
            total: Number(entry.baseSalary) || 0,
            count: 1
          });
        }
        return acc;
      }, []).sort((a: { month: string }, b: { month: string }) => b.month.localeCompare(a.month));

      // Log calculated summary for debugging
      console.log('Calculated summary:', {
        totalPayroll,
        pendingPayments,
        paidPayments,
        averageSalary,
        totalDrivers: uniqueDrivers,
        monthlyBreakdown
      });

      // Set the calculated summary
      setSummary({
        totalPayroll,
        pendingPayments,
        paidPayments,
        averageSalary,
        totalDrivers: uniqueDrivers,
        monthlyBreakdown
      });
      
      // Handle drivers data
      const driversData = driversResponse.data.data || driversResponse.data;
      if (driversData && Array.isArray(driversData)) {
        setDrivers(driversData);
      } else {
        console.error('Invalid drivers data:', driversData);
        setDrivers([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSummary({
        totalPayroll: 0,
        pendingPayments: 0,
        paidPayments: 0,
        averageSalary: 0,
        totalDrivers: 0,
        monthlyBreakdown: []
      });
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const handleOpenDialog = (entry?: PayrollEntry) => {
    if (entry) {
      setSelectedEntry(entry);
      setFormValues({
        driverId: entry.driverId,
        driverName: entry.driverName,
        month: entry.month,
        baseSalary: entry.baseSalary,
        overtimeHours: entry.overtimeHours,
        overtimeRate: entry.overtimeRate,
        bonuses: entry.bonuses,
        deductions: entry.deductions,
        paymentMethod: entry.paymentMethod,
        status: entry.status,
        paymentDate: entry.paymentDate || '',
        notes: entry.notes || '',
      });
    } else {
      setSelectedEntry(null);
      setFormValues({
        driverId: '',
        driverName: '',
        month: moment().format('YYYY-MM'),
        baseSalary: 0,
        overtimeHours: 0,
        overtimeRate: 0,
        bonuses: 0,
        deductions: 0,
        paymentMethod: 'bank_transfer',
        status: 'pending',
        paymentDate: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEntry(null);
  };

  const handleSubmit = async () => {
    try {
      const url = selectedEntry
        ? getApiUrl(API_CONFIG.ENDPOINTS.PAYROLL.UPDATE(selectedEntry._id))
        : getApiUrl(API_CONFIG.ENDPOINTS.PAYROLL.CREATE);
      
      // Find the selected driver to get their name
      const selectedDriver = drivers.find(driver => driver._id === formValues.driverId);
      const driverName = selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : '';

      console.log('Submitting payroll entry:', {
        driverId: formValues.driverId,
        driverName: driverName,
        month: formValues.month,
        baseSalary: Number(formValues.baseSalary),
        overtimeHours: Number(formValues.overtimeHours),
        overtimeRate: Number(formValues.overtimeRate),
        bonuses: Number(formValues.bonuses),
        deductions: Number(formValues.deductions),
        paymentMethod: formValues.paymentMethod,
        status: formValues.status,
        paymentDate: formValues.paymentDate,
        notes: formValues.notes,
      });

      const response = await axios({
        method: selectedEntry ? 'PUT' : 'POST',
        url,
        data: {
          driverId: formValues.driverId,
          driverName: driverName,
          month: formValues.month,
          baseSalary: Number(formValues.baseSalary),
          overtimeHours: Number(formValues.overtimeHours),
          overtimeRate: Number(formValues.overtimeRate),
          bonuses: Number(formValues.bonuses),
          deductions: Number(formValues.deductions),
          paymentMethod: formValues.paymentMethod,
          status: formValues.status,
          paymentDate: formValues.paymentDate,
          notes: formValues.notes,
        },
      });

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Failed to save payroll entry');
      }

      handleCloseDialog();
      fetchPayrollData();
    } catch (err) {
      console.error('Error saving payroll entry:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      const response = await axios.delete(getApiUrl(API_CONFIG.ENDPOINTS.PAYROLL.DELETE(id)));

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Failed to delete payroll entry');
      }

      fetchPayrollData();
    } catch (err) {
      console.error('Error deleting payroll entry:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getStatusColor = (status: PayrollEntry['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'info';
      case 'paid':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Driver Payroll</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ mr: 1 }}
            onClick={() => window.location.href = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYROLL.EXPORT}`}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            sx={{ mr: 1 }}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Entry
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Total Payroll
            </Typography>
            <Typography variant="h4">
              AED {(summary?.totalPayroll || 0).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Pending Payments
            </Typography>
            <Typography variant="h4">
              AED {(summary?.pendingPayments || 0).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Paid Payments
            </Typography>
            <Typography variant="h4">
              AED {(summary?.paidPayments || 0).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Average Salary
            </Typography>
            <Typography variant="h4">
              AED {(summary?.averageSalary || 0).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Payroll Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Driver</TableCell>
              <TableCell>Month</TableCell>
              <TableCell align="right">Base Salary</TableCell>
              <TableCell align="right">Overtime</TableCell>
              <TableCell align="right">Bonuses</TableCell>
              <TableCell align="right">Deductions</TableCell>
              <TableCell align="right">Net Salary</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payrollEntries.length > 0 ? (
              payrollEntries.map((entry) => (
                <TableRow key={entry._id}>
                  <TableCell>
                    {entry.driverName}
                  </TableCell>
                  <TableCell>{moment(entry.month).format('MMMM YYYY')}</TableCell>
                  <TableCell align="right">AED {(entry.baseSalary || 0).toLocaleString()}</TableCell>
                  <TableCell align="right">AED {((entry.overtimeHours || 0) * (entry.overtimeRate || 0)).toLocaleString()}</TableCell>
                  <TableCell align="right">AED {(entry.bonuses || 0).toLocaleString()}</TableCell>
                  <TableCell align="right">AED {(entry.deductions || 0).toLocaleString()}</TableCell>
                  <TableCell align="right">AED {(entry.netSalary || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={entry.status || 'pending'}
                      color={getStatusColor(entry.status || 'pending')}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {entry.paymentDate ? moment(entry.paymentDate).format('DD/MM/YYYY') : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(entry)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(entry._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No payroll entries found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEntry ? 'Edit Payroll Entry' : 'Add Payroll Entry'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Driver"
                value={formValues.driverId}
                onChange={(e) => setFormValues({ ...formValues, driverId: e.target.value })}
                required
              >
                {drivers && drivers.length > 0 ? (
                  drivers.map((driver: Driver) => (
                    <MenuItem key={driver._id} value={driver._id}>
                      {driver.firstName} {driver.lastName}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No drivers available</MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="month"
                label="Month"
                value={formValues.month}
                onChange={(e) => setFormValues({ ...formValues, month: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Base Salary"
                value={formValues.baseSalary}
                onChange={(e) => setFormValues({ ...formValues, baseSalary: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Overtime Hours"
                value={formValues.overtimeHours}
                onChange={(e) => setFormValues({ ...formValues, overtimeHours: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Overtime Rate"
                value={formValues.overtimeRate}
                onChange={(e) => setFormValues({ ...formValues, overtimeRate: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Bonuses"
                value={formValues.bonuses}
                onChange={(e) => setFormValues({ ...formValues, bonuses: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Deductions"
                value={formValues.deductions}
                onChange={(e) => setFormValues({ ...formValues, deductions: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Payment Method"
                value={formValues.paymentMethod}
                onChange={(e) => setFormValues({ ...formValues, paymentMethod: e.target.value })}
                required
              >
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="check">Check</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Status"
                value={formValues.status}
                onChange={(e) => setFormValues({ ...formValues, status: e.target.value as 'pending' | 'approved' | 'paid' })}
                required
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Payment Date"
                value={formValues.paymentDate}
                onChange={(e) => setFormValues({ ...formValues, paymentDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formValues.notes}
                onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedEntry ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverPayroll; 