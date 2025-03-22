import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { 
  LocalGasStation, 
  TrendingUp, 
  Speed, 
  Warning,
  Add,
  Edit,
  Delete,
  Close,
} from '@mui/icons-material';
import { ResponsiveLine } from '@nivo/line';
import { DatePicker } from '@mui/x-date-pickers';
import moment from 'moment';
import axios, { AxiosError } from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/api';
import { Vehicle } from '../../types';

// Define FuelRecord interface
interface FuelRecord {
  _id: string;
  vehicleId: string;
  date: string;
  amount: number;
  cost: number;
  odometer: number;
  fuelType: string;
  fuelEfficiency: number;
  notes: string;
  location: string;
}

// Mock data for fuel consumption
const fuelData = [
  {
    id: 'Truck 001',
    data: [
      { x: 'Jan', y: 120 },
      { x: 'Feb', y: 115 },
      { x: 'Mar', y: 125 },
      { x: 'Apr', y: 118 },
      { x: 'May', y: 122 },
      { x: 'Jun', y: 128 }
    ]
  }
];

// Mock data for fuel records
const initialFuelRecords: FuelRecord[] = [
  {
    _id: '1',
    vehicleId: 'Truck 001',
    date: '2024-03-19',
    amount: 50,
    cost: 150,
    odometer: 15000,
    fuelType: 'gasoline',
    fuelEfficiency: 8.5,
    notes: '',
    location: 'Gas Station A'
  },
  {
    _id: '2',
    vehicleId: 'Van 002',
    date: '2024-03-19',
    amount: 30,
    cost: 90,
    odometer: 22000,
    fuelType: 'gasoline',
    fuelEfficiency: 7.8,
    notes: '',
    location: 'Gas Station B'
  },
  {
    _id: '3',
    vehicleId: 'Truck 003',
    date: '2024-03-18',
    amount: 45,
    cost: 135,
    odometer: 18500,
    fuelType: 'gasoline',
    fuelEfficiency: 8.2,
    notes: '',
    location: 'Gas Station A'
  }
];

// Empty fuel record template with default _id
const emptyFuelRecord: FuelRecord = {
  _id: '',  // Add empty string as default
  vehicleId: '',
  date: moment().format('YYYY-MM-DD'),
  amount: 0,
  cost: 0,
  odometer: 0,
  fuelType: 'gasoline',
  fuelEfficiency: 0,
  notes: '',
  location: ''
};

interface ErrorResponse {
  message: string;
}

// Calculate stats from fuel records
const calculateStats = (records: FuelRecord[]) => {
  const currentMonth = moment().format('YYYY-MM');
  
  // Filter records for current month
  const currentMonthRecords = records.filter(record => 
    moment(record.date).format('YYYY-MM') === currentMonth
  );

  // Ensure we're working with numbers and handle potential NaN
  const totalFuelCost = Number(currentMonthRecords.reduce((sum, record) => sum + Number(record.cost), 0));
  const avgEfficiency = records.length > 0 ? records.reduce((sum, record) => sum + Number(record.fuelEfficiency), 0) / records.length : 0;
  const totalEfficiencyAlerts = records.filter(record => Number(record.fuelEfficiency) < 8).length;

  return {
    totalFuelCost,
    avgEfficiency,
    totalEfficiencyAlerts
  };
};

const FuelManagement: React.FC = () => {
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>(initialFuelRecords);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentRecord, setCurrentRecord] = useState<FuelRecord>(emptyFuelRecord);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFuelRecords();
    fetchVehicles();
  }, []);

  const fetchFuelRecords = async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.FUEL));

      debugger;
      setFuelRecords(response.data);
    } catch (error) {
      console.error('Error fetching fuel records:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch fuel records',
        severity: 'error'
      });
    }
  };

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<Vehicle[]>(getApiUrl(API_CONFIG.ENDPOINTS.VEHICLES));
      console.log('Fetched vehicles:', response.data); // Debug log
      setVehicles(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching vehicles:', axiosError);
      setSnackbar({
        open: true,
        message: 'Failed to fetch vehicles. Please try again later.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const { totalFuelCost, avgEfficiency, totalEfficiencyAlerts } = calculateStats(fuelRecords);

  const handleAddRecord = () => {
    setCurrentRecord(emptyFuelRecord);
    setFormErrors({});
    setOpenAddDialog(true);
  };

  const handleEditRecord = (record: FuelRecord) => {
    console.log('Editing record:', record); // Debug log
    setCurrentRecord({
      ...record,
      vehicleId: record.vehicleId || '', // Ensure vehicleId is not undefined
      date: record.date || moment().format('YYYY-MM-DD'),
      amount: record.amount || 0,
      cost: record.cost || 0,
      odometer: record.odometer || 0,
      fuelType: record.fuelType || 'gasoline',
      fuelEfficiency: record.fuelEfficiency || 0,
      notes: record.notes || '',
      location: record.location || ''
    });
    setFormErrors({});
    setOpenEditDialog(true);
  };

  const handleDeleteConfirm = (id: string) => {
    setRecordToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteRecord = async () => {
    try {
      console.log('Deleting record:', recordToDelete);
      await axios.delete(getApiUrl(`${API_CONFIG.ENDPOINTS.FUEL}/${recordToDelete}`));
      setSnackbar({
        open: true,
        message: 'Fuel record deleted successfully',
        severity: 'success'
      });
      await fetchFuelRecords(); // Refresh the records
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error('Error deleting fuel record:', axiosError);
      console.error('Error details:', axiosError.response?.data);
      setSnackbar({
        open: true,
        message: axiosError.response?.data?.message || 'Failed to delete fuel record',
        severity: 'error'
      });
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required field validations
    if (!currentRecord.vehicleId.trim()) errors.vehicleId = 'Vehicle is required';
    if (!currentRecord.location.trim()) errors.location = 'Location is required';
    if (!currentRecord.date) errors.date = 'Date is required';
    
    // Numeric validations
    if (currentRecord.amount <= 0) errors.amount = 'Amount must be greater than 0';
    if (currentRecord.cost <= 0) errors.cost = 'Cost must be greater than 0';
    if (currentRecord.odometer < 0) errors.odometer = 'Odometer cannot be negative';
    
    // Fuel type validation
    if (!['gasoline', 'diesel', 'electric', 'hybrid'].includes(currentRecord.fuelType)) {
      errors.fuelType = 'Invalid fuel type';
    }
    
    // Date validation
    if (moment(currentRecord.date).isAfter(moment())) {
      errors.date = 'Date cannot be in the future';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setCurrentRecord({
        ...currentRecord,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    console.log('Select change:', name, value); // Debug log
    setCurrentRecord(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date: moment.Moment | null) => {
    setCurrentRecord(prev => ({
      ...prev,
      date: date ? date.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
    }));
  };

  const handleSaveRecord = async () => {
    if (!validateForm()) {
      console.log('Form validation failed:', formErrors);
      return;
    }
    
    // Calculate fuel efficiency (miles per gallon)
    const fuelEfficiency = currentRecord.odometer > 0 && currentRecord.amount > 0 
      ? currentRecord.odometer / currentRecord.amount 
      : 0;

    try {
      if (openAddDialog) {
        // Add new record - remove _id field for new records
        const { _id, ...recordToSave } = {
          ...currentRecord,
          fuelEfficiency,
        };
        
        console.log('Adding new record to:', getApiUrl(API_CONFIG.ENDPOINTS.FUEL));
        const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.FUEL), recordToSave);
        console.log('Add response:', response.data);
        setSnackbar({
          open: true,
          message: 'Fuel record added successfully',
          severity: 'success'
        });
      } else {
        // Update existing record - remove _id field from update payload
        const { _id, ...recordToUpdate } = {
          ...currentRecord,
          fuelEfficiency,
        };
        
        console.log('Updating record:', recordToUpdate);
        console.log('Update URL:', getApiUrl(`${API_CONFIG.ENDPOINTS.FUEL}/${currentRecord._id}`));
        
        const response = await axios.put(
          getApiUrl(`${API_CONFIG.ENDPOINTS.FUEL}/${currentRecord._id}`),
          recordToUpdate
        );
        console.log('Update response:', response.data);
        setSnackbar({
          open: true,
          message: 'Fuel record updated successfully',
          severity: 'success'
        });
      }
      
      await fetchFuelRecords(); // Refresh the records
      handleCloseDialog();
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error('Error saving fuel record:', axiosError);
      console.error('Error details:', axiosError.response?.data);
      setSnackbar({
        open: true,
        message: axiosError.response?.data?.message || 'Failed to save fuel record',
        severity: 'error'
      });
    }
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderRecordForm = () => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!formErrors.vehicleId}>
            <InputLabel id="vehicle-select-label">Vehicle</InputLabel>
            <Select
              labelId="vehicle-select-label"
              label="Vehicle"
              name="vehicleId"
              value={currentRecord.vehicleId}
              onChange={handleSelectChange}
              required
              disabled={isLoading}
            >
              {vehicles.length === 0 && isLoading ? (
                <MenuItem disabled>Loading vehicles...</MenuItem>
              ) : vehicles.length === 0 ? (
                <MenuItem disabled>No vehicles available</MenuItem>
              ) : (
                vehicles.map((vehicle) => (
                  <MenuItem key={vehicle._id || vehicle.id} value={vehicle._id || vehicle.id}>
                    {vehicle.licensePlate} - {vehicle.make} {vehicle.model}
                  </MenuItem>
                ))
              )}
            </Select>
            {formErrors.vehicleId && (
              <Typography variant="caption" color="error">
                {formErrors.vehicleId}
              </Typography>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Date"
            value={moment(currentRecord.date)}
            onChange={handleDateChange}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Amount (L)"
            name="amount"
            type="number"
            value={currentRecord.amount}
            onChange={handleInputChange}
            error={!!formErrors.amount}
            helperText={formErrors.amount}
            required
            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Cost ($)"
            name="cost"
            type="number"
            value={currentRecord.cost}
            onChange={handleInputChange}
            error={!!formErrors.cost}
            helperText={formErrors.cost}
            required
            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Odometer"
            name="odometer"
            type="number"
            value={currentRecord.odometer}
            onChange={handleInputChange}
            error={!!formErrors.odometer}
            helperText={formErrors.odometer}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Fuel Type"
            name="fuelType"
            value={currentRecord.fuelType}
            onChange={handleInputChange}
            error={!!formErrors.fuelType}
            helperText={formErrors.fuelType}
            required
          >
            <MenuItem value="gasoline">Gasoline</MenuItem>
            <MenuItem value="diesel">Diesel</MenuItem>
            <MenuItem value="electric">Electric</MenuItem>
            <MenuItem value="hybrid">Hybrid</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={currentRecord.location}
            onChange={handleInputChange}
            error={!!formErrors.location}
            helperText={formErrors.location}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            name="notes"
            multiline
            rows={3}
            value={currentRecord.notes}
            onChange={handleInputChange}
          />
        </Grid>
      </Grid>
    </>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Fuel Management
      </Typography>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocalGasStation color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Fuel Cost</Typography>
            </Box>
            <Typography variant="h4">
              ${(totalFuelCost || 0).toFixed(2)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {moment().format('MMMM YYYY')}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUp color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Average Efficiency</Typography>
            </Box>
            <Typography variant="h4">{avgEfficiency.toFixed(1)} mpg</Typography>
            <Typography variant="body2" color="textSecondary">
              Fleet Average
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Speed color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Miles</Typography>
            </Box>
            <Typography variant="h4">1,250</Typography>
            <Typography variant="body2" color="textSecondary">
              This Month
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Warning color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Efficiency Alerts</Typography>
            </Box>
            <Typography variant="h4">{totalEfficiencyAlerts}</Typography>
            <Typography variant="body2" color="textSecondary">
              Vehicles Below Target
            </Typography>
          </Paper>
        </Grid>

        {/* Fuel Consumption Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Fuel Consumption Trend
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveLine
                data={fuelData}
                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Month',
                  legendOffset: 36,
                  legendPosition: 'middle'
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Gallons',
                  legendOffset: -40,
                  legendPosition: 'middle'
                }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Fuel Records Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Fuel Records
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={handleAddRecord}
              >
                Add Fuel Record
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount (L)</TableCell>
                    <TableCell>Cost ($)</TableCell>
                    <TableCell>Odometer</TableCell>
                    <TableCell>Fuel Type</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fuelRecords.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>
                        {vehicles.find(v => (v._id || v.id) === record.vehicleId)?.licensePlate || 'N/A'}
                      </TableCell>
                      <TableCell>{moment(record.date).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>{record.amount}</TableCell>
                      <TableCell>{record.cost}</TableCell>
                      <TableCell>{record.odometer}</TableCell>
                      <TableCell>{record.fuelType}</TableCell>
                      <TableCell>{record.location}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditRecord(record)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteConfirm(record._id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Fuel Record Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New Fuel Record</Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseDialog} aria-label="close">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderRecordForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveRecord} variant="contained" color="primary">
            Add Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Fuel Record Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Edit Fuel Record</Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseDialog} aria-label="close">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderRecordForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveRecord} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this fuel record? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteRecord} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FuelManagement; 