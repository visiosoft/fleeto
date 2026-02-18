import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  SelectChangeEvent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  DirectionsCar,
  LocalGasStation,
  Build,
  History,
  Edit,
  Delete,
  Add,
  Close,
  Description,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Warning as WarningIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment';
import type { Moment } from 'moment';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/api';
import { Vehicle } from '../../types';
import FuelManagement from '../../components/FuelManagement/FuelManagement';
import Maintenance from '../../components/Maintenance/Maintenance';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vehicle-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Initialize empty vehicle object
const emptyVehicle: Vehicle = {
  id: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  vin: '',
  licensePlate: '',
  registrationExpiry: '',
  status: 'active',
  fuelType: '',
  currentMileage: 0,
  lastServiceDate: '',
  mileage: 0,
};

const VehicleManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formValues, setFormValues] = useState<Vehicle>(emptyVehicle);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [expiringVehicles, setExpiringVehicles] = useState<Array<{
    vehicle: Vehicle;
    daysLeft: number;
    expiryDate: string;
  }>>([]);

  console.log('VehicleManagement rendering, viewMode:', viewMode, 'tabValue:', tabValue);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Component for authenticated vehicle image loading
  const VehicleImage: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
      const loadImage = async () => {
        if (!vehicle.image) {
          setImageLoading(false);
          return;
        }

        try {
          // If it's a full URL (external image), use it directly
          if (vehicle.image.startsWith('http')) {
            setImageSrc(vehicle.image);
            setImageLoading(false);
            return;
          }

          // Otherwise, load from backend with auth
          const token = localStorage.getItem('token');
          const imageUrl = vehicle.image.replace('/vehicles/', '/vehicles/file/');
          const response = await axios.get(getApiUrl(imageUrl), {
            headers: {
              Authorization: `Bearer ${token}`
            },
            responseType: 'blob'
          });
          const url = window.URL.createObjectURL(response.data);
          setImageSrc(url);
        } catch (error) {
          console.error('Failed to load vehicle image:', error);
        } finally {
          setImageLoading(false);
        }
      };
      loadImage();
      
      // Cleanup
      return () => {
        if (imageSrc && !vehicle.image?.startsWith('http')) {
          window.URL.revokeObjectURL(imageSrc);
        }
      };
    }, [vehicle.image]);

    if (imageLoading) {
      return (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '200px',
            backgroundColor: '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (!vehicle.image || !imageSrc) {
      return (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '200px',
            backgroundColor: '#F3F4F6',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <DirectionsCar sx={{ fontSize: 80, color: 'white', opacity: 0.5 }} />
          </Box>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '200px',
          backgroundColor: '#F3F4F6',
          overflow: 'hidden',
        }}
      >
        <img
          src={imageSrc}
          alt={`${vehicle.make} ${vehicle.model}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>
    );
  };

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.VEHICLES));
      setVehicles(response.data);
      
      // Calculate expiring vehicles (within 30 days)
      const today = moment();
      const expiring = response.data
        .filter((vehicle: Vehicle) => vehicle.registrationExpiry)
        .map((vehicle: Vehicle) => {
          const expiryDate = moment(vehicle.registrationExpiry);
          const daysLeft = expiryDate.diff(today, 'days');
          return {
            vehicle,
            daysLeft,
            expiryDate: vehicle.registrationExpiry
          };
        })
        .filter((item: any) => item.daysLeft >= 0 && item.daysLeft <= 30)
        .sort((a: any, b: any) => a.daysLeft - b.daysLeft)
        .slice(0, 3); // Show top 3 expiring vehicles
      
      setExpiringVehicles(expiring);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch vehicles',
        severity: 'error',
      });
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleAdd = () => {
    setFormValues(emptyVehicle);
    setEditingVehicle(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = async (vehicle: Vehicle) => {
    try {
      setFormValues({
        ...vehicle,
        year: parseInt(vehicle.year.toString()),
        currentMileage: parseInt(vehicle.currentMileage.toString()),
        registrationExpiry: vehicle.registrationExpiry || moment().format('YYYY-MM-DD'),
        lastServiceDate: vehicle.lastServiceDate || moment().format('YYYY-MM-DD')
      });
      setEditingVehicle(vehicle);
      setFormErrors({});
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to load vehicle details:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load vehicle details',
        severity: 'error',
      });
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setFormValues(emptyVehicle);
    setEditingVehicle(null);
    setFormErrors({});
  };

  const handleDeleteConfirm = (id: string) => {
    setVehicleToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(getApiUrl(`${API_CONFIG.ENDPOINTS.VEHICLES}/${vehicleToDelete}`));
      setDeleteConfirmOpen(false);
      setSnackbar({
        open: true,
        message: 'Vehicle deleted successfully',
        severity: 'success',
      });
      fetchVehicles();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete vehicle',
        severity: 'error',
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formValues.make.trim()) errors.make = 'Make is required';
    if (!formValues.model.trim()) errors.model = 'Model is required';
    if (!formValues.vin.trim()) errors.vin = 'VIN is required';
    if (!formValues.licensePlate.trim()) errors.licensePlate = 'License plate is required';
    if (formValues.year < 1900 || formValues.year > new Date().getFullYear() + 1) {
      errors.year = 'Invalid year';
    }
    if (formValues.currentMileage < 0) errors.currentMileage = 'Mileage cannot be negative';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormValues(prev => ({
        ...prev,
        [name]: name === 'year' || name === 'currentMileage' ? parseInt(value as string) || 0 : value,
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (field: string) => (date: Moment | null) => {
    setFormValues(prev => ({
      ...prev,
      [field]: date ? date.format('YYYY-MM-DD') : null,
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const vehicleData = {
        ...formValues,
        year: parseInt(formValues.year.toString()),
        currentMileage: parseInt(formValues.currentMileage.toString()),
        registrationExpiry: moment(formValues.registrationExpiry).format('YYYY-MM-DD'),
        lastServiceDate: moment(formValues.lastServiceDate).format('YYYY-MM-DD'),
      };

      if (editingVehicle) {
        await axios.put(
          getApiUrl(`${API_CONFIG.ENDPOINTS.VEHICLES}/${editingVehicle.id}`),
          vehicleData
        );
        setSnackbar({
          open: true,
          message: 'Vehicle updated successfully',
          severity: 'success',
        });
      } else {
        const { id, ...newVehicleData } = vehicleData;
        await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.VEHICLES), newVehicleData);
        setSnackbar({
          open: true,
          message: 'Vehicle added successfully',
          severity: 'success',
        });
      }
      
      await fetchVehicles();
      handleClose();
    } catch (error) {
      console.error('Failed to save vehicle:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save vehicle',
        severity: 'error',
      });
    }
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const renderVehicleForm = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Make"
          name="make"
          fullWidth
          required
          value={formValues.make}
          onChange={handleInputChange}
          error={!!formErrors.make}
          helperText={formErrors.make}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Model"
          name="model"
          fullWidth
          required
          value={formValues.model}
          onChange={handleInputChange}
          error={!!formErrors.model}
          helperText={formErrors.model}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Year"
          name="year"
          type="number"
          fullWidth
          required
          value={formValues.year}
          onChange={handleInputChange}
          error={!!formErrors.year}
          helperText={formErrors.year}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="VIN"
          name="vin"
          fullWidth
          required
          value={formValues.vin}
          onChange={handleInputChange}
          error={!!formErrors.vin}
          helperText={formErrors.vin}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="License Plate"
          name="licensePlate"
          fullWidth
          required
          value={formValues.licensePlate}
          onChange={handleInputChange}
          error={!!formErrors.licensePlate}
          helperText={formErrors.licensePlate}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={formValues.status}
            onChange={handleSelectChange}
            label="Status"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Current Mileage"
          name="currentMileage"
          type="number"
          fullWidth
          value={formValues.currentMileage}
          onChange={handleInputChange}
          error={!!formErrors.currentMileage}
          helperText={formErrors.currentMileage}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Fuel Type</InputLabel>
          <Select
            name="fuelType"
            value={formValues.fuelType}
            onChange={handleSelectChange}
            label="Fuel Type"
          >
            <MenuItem value="gasoline">Gasoline</MenuItem>
            <MenuItem value="diesel">Diesel</MenuItem>
            <MenuItem value="electric">Electric</MenuItem>
            <MenuItem value="hybrid">Hybrid</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <DatePicker
          label="Registration Expiry"
          value={formValues.registrationExpiry ? moment(formValues.registrationExpiry) : null}
          onChange={handleDateChange('registrationExpiry')}
          slotProps={{ textField: { fullWidth: true } }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <DatePicker
          label="Last Service Date"
          value={formValues.lastServiceDate ? moment(formValues.lastServiceDate) : null}
          onChange={handleDateChange('lastServiceDate')}
          slotProps={{ textField: { fullWidth: true } }}
        />
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<DirectionsCar />} label="Vehicles" />
          <Tab icon={<LocalGasStation />} label="Fuel" />
          <Tab icon={<Build />} label="Maintenance" />
          <Tab icon={<History />} label="History" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Expiring Vehicles KPI Cards */}
        {expiringVehicles.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {expiringVehicles.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={item.vehicle.id}>
                <Card
                  sx={{
                    borderRadius: '16px',
                    background: item.daysLeft <= 7 
                      ? 'linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%)'
                      : item.daysLeft <= 15
                      ? 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)'
                      : 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
                    border: item.daysLeft <= 7 ? '2px solid #EF4444' : item.daysLeft <= 15 ? '2px solid #F59E0B' : '2px solid #3B82F6',
                    padding: '20px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: item.daysLeft <= 7 
                          ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                          : item.daysLeft <= 15
                          ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                          : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: item.daysLeft <= 7
                          ? '0 4px 14px rgba(239, 68, 68, 0.4)'
                          : item.daysLeft <= 15
                          ? '0 4px 14px rgba(245, 158, 11, 0.4)'
                          : '0 4px 14px rgba(59, 130, 246, 0.4)',
                      }}
                    >
                      <WarningIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Box>
                    <Box sx={{ ml: 2, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Registration Expiring
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography
                    sx={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#1F2937',
                      mb: 1,
                    }}
                  >
                    {item.vehicle.make} {item.vehicle.model}
                  </Typography>
                  
                  <Typography
                    sx={{
                      fontSize: '14px',
                      color: '#6B7280',
                      mb: 1,
                    }}
                  >
                    {item.vehicle.licensePlate}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EventIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#6B7280',
                      }}
                    >
                      Expires: {moment(item.expiryDate).format('MMM DD, YYYY')}
                    </Typography>
                  </Box>
                  
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: item.daysLeft <= 7 ? '#DC2626' : item.daysLeft <= 15 ? '#D97706' : '#2563EB',
                      }}
                    >
                      {item.daysLeft}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#6B7280',
                      }}
                    >
                      {item.daysLeft === 1 ? 'Day Left' : 'Days Left'}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f0f0', p: 2, borderRadius: '8px' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>Vehicle List</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newValue) => newValue && setViewMode(newValue)}
              size="small"
            >
              <ToggleButton value="card">
                <ViewModuleIcon sx={{ mr: 0.5 }} />
                Cards
              </ToggleButton>
              <ToggleButton value="table">
                <ViewListIcon sx={{ mr: 0.5 }} />
                Table
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
              sx={{
                backgroundColor: '#2563EB !important',
                color: '#FFFFFF !important',
                fontWeight: 600,
                fontSize: '14px',
                borderRadius: '8px',
                padding: '10px 20px',
                textTransform: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: '#1D4ED8 !important',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              Add Vehicle
            </Button>
          </Box>
        </Box>

        {viewMode === 'card' ? (
          <Grid container spacing={2}>
          {vehicles.map((vehicle) => (
            <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
              <Card 
                sx={{ 
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  {/* Vehicle Image */}
                  <VehicleImage vehicle={vehicle} />
                  
                  {/* Status Badge and Action Buttons Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      p: 1.5,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Status Badge */}
                    <Chip
                      label={vehicle.status}
                      color={getStatusColor(vehicle.status)}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(vehicle)}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          '&:hover': {
                            backgroundColor: 'white',
                          },
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteConfirm(vehicle.id || vehicle._id || '')}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          color: '#EF4444',
                          '&:hover': {
                            backgroundColor: 'white',
                          },
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Vehicle Details */}
                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          fontSize: '18px',
                          color: '#111827',
                        }}
                      >
                        {vehicle.make} {vehicle.model}
                      </Typography>
                      <Typography 
                        sx={{ 
                          fontSize: '14px',
                          color: '#6B7280',
                          fontWeight: 500,
                        }}
                      >
                        {vehicle.year}
                      </Typography>
                      {vehicle.documents && vehicle.documents.length > 0 && (
                        <Chip
                          icon={<Description />}
                          label={vehicle.documents.length}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ ml: 'auto' }}
                          title={`${vehicle.documents.length} document${vehicle.documents.length > 1 ? 's' : ''} attached`}
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography 
                          sx={{ 
                            fontSize: '13px',
                            color: '#6B7280',
                            fontWeight: 500,
                          }}
                        >
                          License:
                        </Typography>
                        <Typography 
                          sx={{ 
                            fontSize: '13px',
                            color: '#111827',
                            fontWeight: 600,
                          }}
                        >
                          {vehicle.licensePlate}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          sx={{ 
                            fontSize: '13px',
                            color: '#6B7280',
                            fontWeight: 500,
                          }}
                        >
                          VIN:
                        </Typography>
                        <Typography 
                          sx={{ 
                            fontSize: '13px',
                            color: '#111827',
                            fontWeight: 600,
                          }}
                        >
                          {vehicle.vin}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        icon={<LocalGasStation />}
                        label={`${vehicle.currentMileage.toLocaleString()} mi`}
                        size="small"
                        sx={{
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          fontWeight: 600,
                          '& .MuiChip-icon': {
                            color: '#2563EB',
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Image</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Vehicle</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>License Plate</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>VIN</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Mileage</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Documents</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '14px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.map((vehicle) => {
                  const TableVehicleImage = () => {
                    const [imageSrc, setImageSrc] = useState<string>('');
                    
                    useEffect(() => {
                      const loadImage = async () => {
                        if (!vehicle.image) return;
                        
                        try {
                          if (vehicle.image.startsWith('http')) {
                            setImageSrc(vehicle.image);
                            return;
                          }
                          
                          const token = localStorage.getItem('token');
                          const imageUrl = vehicle.image.replace('/vehicles/', '/vehicles/file/');
                          const response = await axios.get(getApiUrl(imageUrl), {
                            headers: { Authorization: `Bearer ${token}` },
                            responseType: 'blob'
                          });
                          const url = window.URL.createObjectURL(response.data);
                          setImageSrc(url);
                        } catch (error) {
                          console.error('Failed to load image:', error);
                        }
                      };
                      loadImage();
                    }, []);
                    
                    if (vehicle.image && imageSrc) {
                      return (
                        <img
                          src={imageSrc}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                        />
                      );
                    }
                    
                    return <DirectionsCar sx={{ fontSize: 30, color: 'white' }} />;
                  };
                  
                  return (
                    <TableRow key={vehicle.id} hover>
                      <TableCell>
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          <TableVehicleImage />
                        </Box>
                      </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                        {vehicle.make} {vehicle.model}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                        {vehicle.year}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '14px' }}>{vehicle.licensePlate}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>{vehicle.vin}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={vehicle.status}
                        color={getStatusColor(vehicle.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '14px' }}>
                        {vehicle.currentMileage.toLocaleString()} mi
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {vehicle.documents && vehicle.documents.length > 0 && (
                        <Chip
                          icon={<Description />}
                          label={vehicle.documents.length}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEdit(vehicle)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteConfirm(vehicle.id || vehicle._id || '')}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <FuelManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Maintenance />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography>Vehicle History (Coming Soon)</Typography>
      </TabPanel>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isModalOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {renderVehicleForm()}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClose}
            sx={{
              color: '#6B7280',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#F3F4F6',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              backgroundColor: '#2563EB !important',
              color: '#FFFFFF !important',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '8px',
              padding: '8px 16px',
              textTransform: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              '&:hover': {
                backgroundColor: '#1D4ED8 !important',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            {editingVehicle ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this vehicle?</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{
              color: '#6B7280',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#F3F4F6',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained"
            sx={{
              backgroundColor: '#EF4444 !important',
              color: '#FFFFFF !important',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '8px',
              padding: '8px 16px',
              textTransform: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              '&:hover': {
                backgroundColor: '#DC2626 !important',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
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
        <Alert onClose={closeSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VehicleManagement; 