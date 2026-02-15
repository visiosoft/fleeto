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
  Avatar,
  Stack,
  Tooltip,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  DirectionsCar as DirectionsCarIcon,
  Speed as SpeedIcon,
  Build as MaintenanceIcon,
  LocalGasStation as FuelIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
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
  expiryDate?: Moment;
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

interface VehicleFormValues extends Omit<Vehicle, '_id' | 'lastMaintenance' | 'nextMaintenance' | 'expiryDate' | 'insuranceInfo'> {
  lastMaintenance?: Moment | null;
  nextMaintenance?: Moment | null;
  expiryDate?: Moment | null;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: Moment | null;
}

const VehicleManagement: React.FC = () => {
  const theme = useTheme();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formValues, setFormValues] = useState<Partial<VehicleFormValues>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
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
        expiryDate: vehicleData.expiryDate ? moment(vehicleData.expiryDate) : null,
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
    setVehicleToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;
    
    try {
      await axios.delete(getApiUrl(`${API_CONFIG.ENDPOINTS.VEHICLES}/${vehicleToDelete}`));
      showSnackbar('Vehicle deleted successfully', 'success');
      fetchVehicles();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      showSnackbar('Failed to delete vehicle', 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setVehicleToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setVehicleToDelete(null);
  };

  const handleSubmit = async () => {
    if (!formValues.make || !formValues.model || !formValues.year || !formValues.licensePlate || !formValues.vin || !formValues.expiryDate) {
      showSnackbar('Please fill in all required fields (Make, Model, Year, License Plate, VIN, and Expiry Date)', 'error');
      return;
    }

    try {
      // Remove temporary form fields and system fields before sending
      const { 
        insuranceProvider, 
        insurancePolicyNumber, 
        insuranceExpiryDate,
        _id,
        companyId,
        maintenance,
        documents,
        createdAt,
        updatedAt,
        __v,
        ...cleanFormValues 
      } = formValues as any;
      
      const vehicleData = {
        ...cleanFormValues,
        mileage: formValues.mileage || 0,
        lastMaintenance: formValues.lastMaintenance?.format('YYYY-MM-DD'),
        nextMaintenance: formValues.nextMaintenance?.format('YYYY-MM-DD'),
        expiryDate: formValues.expiryDate?.format('YYYY-MM-DD'),
        insuranceInfo: insuranceProvider ? {
          provider: insuranceProvider,
          policyNumber: insurancePolicyNumber,
          expiryDate: insuranceExpiryDate?.format('YYYY-MM-DD'),
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

      <TableContainer component={Paper} sx={{ 
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.025em', borderBottom: '2px solid #E5E7EB', py: 2.5 }}>Vehicle Info</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.025em', borderBottom: '2px solid #E5E7EB', py: 2.5 }}>License Plate</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.025em', borderBottom: '2px solid #E5E7EB', py: 2.5 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.025em', borderBottom: '2px solid #E5E7EB', py: 2.5 }}>Expiry Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.025em', borderBottom: '2px solid #E5E7EB', py: 2.5 }}>Policy Expiry In</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#374151', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.025em', borderBottom: '2px solid #E5E7EB', py: 2.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle, index) => {
              const expiryDate = vehicle.expiryDate ? moment(vehicle.expiryDate).add(1, 'month') : null;
              const daysUntilExpiry = expiryDate ? expiryDate.diff(moment(), 'days') : null;
              const monthsUntilExpiry = expiryDate ? expiryDate.diff(moment(), 'months') : null;
              const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
              const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
              
              return (
              <TableRow 
                key={vehicle._id}
                onMouseEnter={() => setHoveredRow(vehicle._id)}
                onMouseLeave={() => setHoveredRow(null)}
                sx={{
                  backgroundColor: hoveredRow === vehicle._id 
                    ? '#F1F5F9'
                    : isExpiringSoon
                    ? '#FEF3C7'
                    : isExpired
                    ? '#FEE2E2'
                    : index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                  transition: 'background-color 0.2s ease',
                  '& td': {
                    borderBottom: '1px solid #E5E7EB',
                    py: 2.5,
                    fontSize: '14px',
                    color: '#111827',
                  },
                  '&:last-child td': {
                    borderBottom: 'none',
                  },
                  cursor: 'pointer',
                }}
              >
                <TableCell>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        sx={{ 
                          width: 40, 
                          height: 40,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                        }}
                      >
                        <DirectionsCarIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {`${vehicle.make} ${vehicle.model}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.year} • {vehicle.fuelType}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                    {vehicle.licensePlate}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={vehicle.status}
                    color={vehicle.status === 'Active' ? 'success' : vehicle.status === 'Maintenance' ? 'warning' : 'error'}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                    }}
                  />
                </TableCell>
                <TableCell>
                  {expiryDate ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : theme.palette.text.secondary }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: isExpiringSoon || isExpired ? 600 : 400,
                            color: isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : '#111827'
                          }}
                        >
                          {expiryDate.format('MM/DD/YYYY')}
                        </Typography>
                      </Box>
                      {isExpired ? (
                        <Chip
                          icon={<WarningIcon />}
                          label="EXPIRED"
                          size="small"
                          sx={{
                            mt: 0.5,
                            height: '20px',
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            '& .MuiChip-icon': { color: '#991B1B', fontSize: '14px' },
                          }}
                        />
                      ) : isExpiringSoon ? (
                        <Chip
                          icon={<WarningIcon />}
                          label={`Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`}
                          size="small"
                          sx={{
                            mt: 0.5,
                            height: '20px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            '& .MuiChip-icon': { color: '#92400E', fontSize: '14px' },
                          }}
                        />
                      ) : null}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not set
                    </Typography>
                  )}  
                </TableCell>
                <TableCell>
                  {expiryDate ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : '#10B981' }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : '#10B981'
                          }}
                        >
                          {isExpired 
                            ? `Expired ${Math.abs(monthsUntilExpiry!)} month${Math.abs(monthsUntilExpiry!) !== 1 ? 's' : ''} ago`
                            : monthsUntilExpiry === 0
                            ? `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
                            : `${monthsUntilExpiry} month${monthsUntilExpiry !== 1 ? 's' : ''}`
                          }
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not set
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="Edit Vehicle">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(vehicle)}
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
                    <Tooltip title="Delete Vehicle">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(vehicle._id)}
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
              );
            })}
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
            <Grid item xs={6}>
              <DatePicker
                label="Vehicle Expiry Date *"
                value={formValues.expiryDate || null}
                onChange={(date) => setFormValues(prev => ({ ...prev, expiryDate: date }))}
                slotProps={{ textField: { fullWidth: true, required: true } }}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete this vehicle? This action cannot be undone.
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
    </Box>
  );
};

export default VehicleManagement; 