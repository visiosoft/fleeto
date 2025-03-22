import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment';
import type { Moment } from 'moment';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../config/api';

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  status: 'Active' | 'Maintenance' | 'Out of Service';
  mileage: number;
  lastMaintenance?: Moment;
  nextMaintenance?: Moment;
  fuelType: string;
  assignedDriver?: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    expiryDate: Moment;
  };
  notes?: string;
}

interface VehicleFormValues extends Omit<Vehicle, '_id' | 'lastMaintenance' | 'nextMaintenance' | 'insuranceInfo'> {
  lastMaintenance?: Moment | null;
  nextMaintenance?: Moment | null;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: Moment | null;
}

const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formValues, setFormValues] = useState<Partial<VehicleFormValues>>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.VEHICLES));
      setVehicles(response.data);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      showSnackbar('Failed to fetch vehicles', 'error');
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleAdd = () => {
    setFormValues({
      status: 'Active',
      mileage: 0,
    });
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const handleEdit = async (vehicle: Vehicle) => {
    try {
      const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.VEHICLES}/${vehicle._id}`));
      const vehicleData = response.data;
      setFormValues({
        ...vehicleData,
        lastMaintenance: vehicleData.lastMaintenance ? moment(vehicleData.lastMaintenance) : null,
        nextMaintenance: vehicleData.nextMaintenance ? moment(vehicleData.nextMaintenance) : null,
        insuranceProvider: vehicleData.insuranceInfo?.provider,
        insurancePolicyNumber: vehicleData.insuranceInfo?.policyNumber,
        insuranceExpiryDate: vehicleData.insuranceInfo?.expiryDate ? moment(vehicleData.insuranceInfo.expiryDate) : null,
      });
      setEditingVehicle(vehicle);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch vehicle details:', error);
      showSnackbar('Failed to fetch vehicle details', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(getApiUrl(`${API_CONFIG.ENDPOINTS.VEHICLES}/${id}`));
      showSnackbar('Vehicle deleted successfully', 'success');
      fetchVehicles();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      showSnackbar('Failed to delete vehicle', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!formValues.make || !formValues.model || !formValues.year || !formValues.licensePlate || !formValues.vin) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    try {
      const vehicleData = {
        ...formValues,
        lastMaintenance: formValues.lastMaintenance?.format('YYYY-MM-DD'),
        nextMaintenance: formValues.nextMaintenance?.format('YYYY-MM-DD'),
        insuranceInfo: formValues.insuranceProvider ? {
          provider: formValues.insuranceProvider,
          policyNumber: formValues.insurancePolicyNumber,
          expiryDate: formValues.insuranceExpiryDate?.format('YYYY-MM-DD'),
        } : undefined,
      };

      if (editingVehicle) {
        await axios.put(getApiUrl(`${API_CONFIG.ENDPOINTS.VEHICLES}/${editingVehicle._id}`), vehicleData);
        showSnackbar('Vehicle updated successfully', 'success');
      } else {
        await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.VEHICLES), vehicleData);
        showSnackbar('Vehicle added successfully', 'success');
      }

      setIsModalOpen(false);
      fetchVehicles();
    } catch (error) {
      console.error('Failed to save vehicle:', error);
      showSnackbar('Failed to save vehicle', 'error');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setFormValues({});
    setEditingVehicle(null);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Vehicle Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Vehicle
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Make/Model</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>License Plate</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Mileage</TableCell>
              <TableCell>Next Maintenance</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle._id}>
                <TableCell>{`${vehicle.make} ${vehicle.model}`}</TableCell>
                <TableCell>{vehicle.year}</TableCell>
                <TableCell>{vehicle.licensePlate}</TableCell>
                <TableCell>{vehicle.status}</TableCell>
                <TableCell>{vehicle.mileage.toLocaleString()}</TableCell>
                <TableCell>
                  {vehicle.nextMaintenance ? moment(vehicle.nextMaintenance).format('MM/DD/YYYY') : 'Not scheduled'}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(vehicle)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(vehicle._id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isModalOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                label="Make"
                fullWidth
                required
                value={formValues.make || ''}
                onChange={(e) => setFormValues(prev => ({ ...prev, make: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Model"
                fullWidth
                required
                value={formValues.model || ''}
                onChange={(e) => setFormValues(prev => ({ ...prev, model: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Year"
                fullWidth
                required
                type="number"
                value={formValues.year || ''}
                onChange={(e) => setFormValues(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="License Plate"
                fullWidth
                required
                value={formValues.licensePlate || ''}
                onChange={(e) => setFormValues(prev => ({ ...prev, licensePlate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="VIN"
                fullWidth
                required
                value={formValues.vin || ''}
                onChange={(e) => setFormValues(prev => ({ ...prev, vin: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Status"
                fullWidth
                value={formValues.status || 'Active'}
                onChange={(e) => setFormValues(prev => ({ ...prev, status: e.target.value as Vehicle['status'] }))}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
                <MenuItem value="Out of Service">Out of Service</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Mileage"
                fullWidth
                type="number"
                value={formValues.mileage || 0}
                onChange={(e) => setFormValues(prev => ({ ...prev, mileage: parseInt(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Fuel Type"
                fullWidth
                value={formValues.fuelType || ''}
                onChange={(e) => setFormValues(prev => ({ ...prev, fuelType: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="Last Maintenance"
                value={formValues.lastMaintenance || null}
                onChange={(date) => setFormValues(prev => ({ ...prev, lastMaintenance: date }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="Next Maintenance"
                value={formValues.nextMaintenance || null}
                onChange={(date) => setFormValues(prev => ({ ...prev, nextMaintenance: date }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Insurance Information</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Insurance Provider"
                fullWidth
                value={formValues.insuranceProvider || ''}
                onChange={(e) => setFormValues(prev => ({ ...prev, insuranceProvider: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Policy Number"
                fullWidth
                value={formValues.insurancePolicyNumber || ''}
                onChange={(e) => setFormValues(prev => ({ ...prev, insurancePolicyNumber: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="Insurance Expiry Date"
                value={formValues.insuranceExpiryDate || null}
                onChange={(date) => setFormValues(prev => ({ ...prev, insuranceExpiryDate: date }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={4}
                value={formValues.notes || ''}
                onChange={(e) => setFormValues(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingVehicle ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VehicleManagement; 