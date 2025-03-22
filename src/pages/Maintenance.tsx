import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Build,
  Warning,
  CheckCircle,
  Edit,
  Visibility,
  Schedule,
  Add,
  Delete,
  Close,
} from '@mui/icons-material';
import axios, { AxiosError } from 'axios';
import { API_CONFIG, getApiUrl } from '../config/api';
import { Vehicle } from '../types';

// Define MaintenanceRecord interface
interface MaintenanceRecord {
  _id?: string;
  vehicleId: string;
  serviceType: string;
  date: string;
  mileage: number;
  cost: number;
  technician: string;
  notes: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

interface CostStatistics {
  totalCost: number;
  averageCost: number;
  costByServiceType: Record<string, number>;
}

// Empty maintenance record template
const emptyMaintenanceRecord: MaintenanceRecord = {
  vehicleId: '',
  serviceType: '',
  date: new Date().toISOString().split('T')[0],
  mileage: 0,
  cost: 0,
  technician: '',
  notes: '',
  status: 'pending',
  priority: 'medium'
};

const MaintenanceCard: React.FC<{
  record: MaintenanceRecord;
  vehicles: Vehicle[];
  onEdit: (record: MaintenanceRecord) => void;
  onDelete: (id: string) => void;
}> = ({ record, vehicles, onEdit, onDelete }) => {
  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => (v._id || v.id) === vehicleId);
    return vehicle ? `${vehicle.licensePlate} - ${vehicle.make} ${vehicle.model}` : 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'warning';
      case 'pending':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const progress = (record.mileage / record.mileage) * 100;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            {getVehicleInfo(record.vehicleId)}
          </Typography>
          <Box>
            <IconButton size="small" onClick={() => onEdit(record)}>
              <Edit />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(record._id || '')}>
              <Delete />
            </IconButton>
          </Box>
        </Box>
        <Box>
          <Chip
            label={record.status}
            color={getStatusColor(record.status)}
            size="small"
            sx={{ mr: 1 }}
          />
          <Chip
            label={record.priority}
            color={getPriorityColor(record.priority)}
            size="small"
          />
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          {record.serviceType}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Date: {record.date}
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Mileage Progress
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ flexGrow: 1, mr: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Current: {record.mileage}
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => console.log('View details:', record._id)}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

const Maintenance: React.FC = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentRecord, setCurrentRecord] = useState<MaintenanceRecord>(emptyMaintenanceRecord);
  const [costStats, setCostStats] = useState<CostStatistics | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });
  
  useEffect(() => {
    fetchMaintenanceRecords();
    fetchCostStatistics();
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get<Vehicle[]>(getApiUrl(API_CONFIG.ENDPOINTS.VEHICLES));
      console.log('Fetched vehicles:', response.data);
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch vehicles',
        severity: 'error'
      });
    }
  };

  const fetchMaintenanceRecords = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.MAINTENANCE));
      console.log('Fetched maintenance records:', response.data);
      setMaintenanceRecords(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching maintenance records:', axiosError);
      setSnackbar({
        open: true,
        message: 'Failed to fetch maintenance records',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCostStatistics = async () => {
    try {
      const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.MAINTENANCE}/stats/cost`));
      console.log('Fetched cost statistics:', response.data);
      setCostStats(response.data);
    } catch (error) {
      console.error('Error fetching cost statistics:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch cost statistics',
        severity: 'error'
      });
    }
  };

  const handleAddRecord = () => {
    setCurrentRecord(emptyMaintenanceRecord);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleEditRecord = async (record: MaintenanceRecord) => {
    try {
      const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.MAINTENANCE}/${record._id}`));
      setCurrentRecord(response.data);
      setFormErrors({});
      setOpenDialog(true);
    } catch (error) {
      console.error('Error fetching record details:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch record details',
        severity: 'error'
      });
    }
  };

  const handleDeleteConfirm = (id: string) => {
    setRecordToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteRecord = async () => {
    try {
      await axios.delete(getApiUrl(`${API_CONFIG.ENDPOINTS.MAINTENANCE}/${recordToDelete}`));
      await fetchMaintenanceRecords();
      await fetchCostStatistics();
      setSnackbar({
        open: true,
        message: 'Maintenance record deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete maintenance record',
        severity: 'error'
      });
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (currentRecord._id) {
        // Update existing record
        const { _id, ...recordToUpdate } = currentRecord;
        await axios.put(
          getApiUrl(`${API_CONFIG.ENDPOINTS.MAINTENANCE}/${_id}`),
          recordToUpdate
        );
      } else {
        // Create new record
        const { _id, ...recordToCreate } = currentRecord;
        await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.MAINTENANCE), recordToCreate);
      }

      await fetchMaintenanceRecords();
      await fetchCostStatistics();
      setSnackbar({
        open: true,
        message: `Maintenance record ${currentRecord._id ? 'updated' : 'added'} successfully`,
        severity: 'success'
      });
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving record:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${currentRecord._id ? 'update' : 'add'} maintenance record`,
        severity: 'error'
      });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Form Validation & Handling
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!currentRecord.vehicleId.trim()) errors.vehicleId = 'Vehicle is required';
    if (!currentRecord.serviceType.trim()) errors.serviceType = 'Service is required';
    if (!currentRecord.technician.trim()) errors.technician = 'Technician is required';
    if (currentRecord.mileage < 0) errors.mileage = 'Mileage cannot be negative';
    if (currentRecord.cost < 0) errors.cost = 'Cost cannot be negative';
    
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
    setCurrentRecord({
      ...currentRecord,
      [name]: value,
    });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderRecordForm = () => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!formErrors.vehicleId}>
            <InputLabel>Vehicle</InputLabel>
            <Select
              name="vehicleId"
              value={currentRecord.vehicleId}
              onChange={handleSelectChange}
              label="Vehicle"
              required
            >
              {vehicles.length === 0 ? (
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
          <FormControl fullWidth required>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={currentRecord.status}
              onChange={handleSelectChange}
              label="Status"
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={currentRecord.priority}
              onChange={handleSelectChange}
              label="Priority"
            >
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Service Type"
            name="serviceType"
            value={currentRecord.serviceType}
            onChange={handleInputChange}
            error={!!formErrors.serviceType}
            helperText={formErrors.serviceType}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Date"
            name="date"
            type="date"
            value={currentRecord.date}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Mileage"
            name="mileage"
            type="number"
            value={currentRecord.mileage}
            onChange={handleInputChange}
            error={!!formErrors.mileage}
            helperText={formErrors.mileage}
            required
            InputProps={{ inputProps: { min: 0 } }}
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
            label="Technician"
            name="technician"
            value={currentRecord.technician}
            onChange={handleInputChange}
            error={!!formErrors.technician}
            helperText={formErrors.technician}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            name="notes"
            value={currentRecord.notes}
            onChange={handleInputChange}
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
    </>
  );

  const fetchRecordsByServiceType = async (serviceType: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.MAINTENANCE}/service/${serviceType}`));
      console.log('Fetched records by service type:', response.data);
      setMaintenanceRecords(response.data);
    } catch (error) {
      console.error('Error fetching records by service type:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch records by service type',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => (v._id || v.id) === vehicleId);
    return vehicle ? `${vehicle.licensePlate} - ${vehicle.make} ${vehicle.model}` : 'N/A';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Maintenance Management
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Upcoming Maintenance
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddRecord}
            >
              Add Record
            </Button>
          </Box>
          {isLoading ? (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {maintenanceRecords.map((record) => (
                <Grid item key={record._id} xs={12} sm={6} md={4}>
                  <MaintenanceCard
                    record={record}
                    vehicles={vehicles}
                    onEdit={handleEditRecord}
                    onDelete={handleDeleteConfirm}
                  />
                </Grid>
              ))}
              {maintenanceRecords.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body1" color="textSecondary" align="center">
                    No maintenance records found
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Service History
            </Typography>
            {costStats && (
              <Typography variant="body1">
                Total Cost: ${typeof costStats.totalCost === 'number' ? costStats.totalCost.toFixed(2) : Number(costStats.totalCost).toFixed(2)} | 
                Average Cost: ${typeof costStats.averageCost === 'number' ? costStats.averageCost.toFixed(2) : Number(costStats.averageCost).toFixed(2)}
              </Typography>
            )}
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Mileage</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Technician</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {maintenanceRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>{getVehicleInfo(record.vehicleId)}</TableCell>
                    <TableCell>{record.serviceType}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.mileage}</TableCell>
                    <TableCell>
                      ${typeof record.cost === 'number' ? record.cost.toFixed(2) : Number(record.cost).toFixed(2)}
                    </TableCell>
                    <TableCell>{record.technician}</TableCell>
                    <TableCell>{record.notes}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEditRecord(record)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteConfirm(record._id || '')}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {maintenanceRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No maintenance records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Add Record Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Maintenance Record</Typography>
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

      {/* Delete Record Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this maintenance record? This action cannot be undone.</Typography>
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

export default Maintenance; 