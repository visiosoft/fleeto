import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Rating,
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
  SelectChangeEvent,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Person,
  DirectionsCar,
  Star,
  Warning,
  CheckCircle,
  Edit,
  Visibility,
  Add,
  Delete,
  Close,
} from '@mui/icons-material';

// Define Driver interface
interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  status: string;
  assignedVehicle: string;
  performanceScore: number;
  safetyRating: number;
  totalTrips: number;
  violations: number;
  lastTripDate: string;
  nextLicenseRenewal: string;
}

// Mock data for drivers
const initialDrivers: Driver[] = [
  {
    id: 1,
    name: 'John Smith',
    licenseNumber: 'DL123456',
    status: 'active',
    assignedVehicle: 'Truck 101',
    performanceScore: 85,
    safetyRating: 4.5,
    totalTrips: 156,
    violations: 2,
    lastTripDate: '2024-03-15',
    nextLicenseRenewal: '2024-06-30',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    licenseNumber: 'DL789012',
    status: 'active',
    assignedVehicle: 'Truck 102',
    performanceScore: 92,
    safetyRating: 5,
    totalTrips: 203,
    violations: 0,
    lastTripDate: '2024-03-14',
    nextLicenseRenewal: '2024-08-15',
  },
  {
    id: 3,
    name: 'Michael Brown',
    licenseNumber: 'DL345678',
    status: 'inactive',
    assignedVehicle: 'Truck 103',
    performanceScore: 78,
    safetyRating: 3.5,
    totalTrips: 89,
    violations: 3,
    lastTripDate: '2024-03-10',
    nextLicenseRenewal: '2024-05-20',
  },
];

// Empty driver template
const emptyDriver: Driver = {
  id: 0,
  name: '',
  licenseNumber: '',
  status: 'active',
  assignedVehicle: '',
  performanceScore: 80,
  safetyRating: 3,
  totalTrips: 0,
  violations: 0,
  lastTripDate: new Date().toISOString().split('T')[0],
  nextLicenseRenewal: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
};

const DriverCard: React.FC<{
  driver: Driver;
  onEdit: (driver: Driver) => void;
  onDelete: (id: number) => void;
}> = ({ driver, onEdit, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            {driver.name}
          </Typography>
          <Box>
            <IconButton size="small" onClick={() => onEdit(driver)}>
              <Edit />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(driver.id)}>
              <Delete />
            </IconButton>
          </Box>
        </Box>
        
        <Chip
          label={driver.status}
          color={getStatusColor(driver.status)}
          size="small"
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Person sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            License: {driver.licenseNumber}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <DirectionsCar sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Vehicle: {driver.assignedVehicle}
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Performance Score
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={driver.performanceScore}
              sx={{ flexGrow: 1, mr: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {driver.performanceScore}%
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Safety Rating
          </Typography>
          <Rating
            value={driver.safetyRating}
            precision={0.5}
            readOnly
            size="small"
            emptyIcon={<Star style={{ opacity: 0.55 }} fontSize="inherit" />}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total Trips: {driver.totalTrips}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Violations: {driver.violations}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last Trip: {driver.lastTripDate}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            License Renewal: {driver.nextLicenseRenewal}
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => console.log('View details:', driver.id)}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

const DriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [currentDriver, setCurrentDriver] = useState<Driver>(emptyDriver);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<number>(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  const handleAddDriver = () => {
    setCurrentDriver({ ...emptyDriver });
    setFormErrors({});
    setOpenAddDialog(true);
  };

  const handleEditDriver = (driver: Driver) => {
    setCurrentDriver({ ...driver });
    setFormErrors({});
    setOpenEditDialog(true);
  };

  const handleDeleteConfirm = (id: number) => {
    setDriverToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteDriver = () => {
    setDrivers(drivers.filter(driver => driver.id !== driverToDelete));
    setDeleteConfirmOpen(false);
    setSnackbar({
      open: true,
      message: 'Driver deleted successfully',
      severity: 'success',
    });
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!currentDriver.name.trim()) errors.name = 'Name is required';
    if (!currentDriver.licenseNumber.trim()) errors.licenseNumber = 'License number is required';
    if (!currentDriver.assignedVehicle.trim()) errors.assignedVehicle = 'Assigned vehicle is required';
    if (currentDriver.performanceScore < 0 || currentDriver.performanceScore > 100) {
      errors.performanceScore = 'Performance score must be between 0 and 100';
    }
    if (currentDriver.safetyRating < 0 || currentDriver.safetyRating > 5) {
      errors.safetyRating = 'Safety rating must be between 0 and 5';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setCurrentDriver({
        ...currentDriver,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setCurrentDriver({
      ...currentDriver,
      [name]: value,
    });
  };

  const handleSaveDriver = () => {
    if (!validateForm()) return;
    
    if (openAddDialog) {
      // Add new driver
      const newDriver = {
        ...currentDriver,
        id: Math.max(...drivers.map(driver => driver.id), 0) + 1,
      };
      setDrivers([...drivers, newDriver]);
      setSnackbar({
        open: true,
        message: 'Driver added successfully',
        severity: 'success',
      });
    } else {
      // Update existing driver
      setDrivers(drivers.map(driver => 
        driver.id === currentDriver.id ? currentDriver : driver
      ));
      setSnackbar({
        open: true,
        message: 'Driver updated successfully',
        severity: 'success',
      });
    }
    
    handleCloseDialog();
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderDriverForm = () => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={currentDriver.name}
            onChange={handleInputChange}
            error={!!formErrors.name}
            helperText={formErrors.name}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="License Number"
            name="licenseNumber"
            value={currentDriver.licenseNumber}
            onChange={handleInputChange}
            error={!!formErrors.licenseNumber}
            helperText={formErrors.licenseNumber}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={currentDriver.status}
              onChange={handleSelectChange}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Assigned Vehicle"
            name="assignedVehicle"
            value={currentDriver.assignedVehicle}
            onChange={handleInputChange}
            error={!!formErrors.assignedVehicle}
            helperText={formErrors.assignedVehicle}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Performance Score"
            name="performanceScore"
            type="number"
            value={currentDriver.performanceScore}
            onChange={handleInputChange}
            error={!!formErrors.performanceScore}
            helperText={formErrors.performanceScore || "Score between 0-100"}
            required
            InputProps={{ inputProps: { min: 0, max: 100 } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Safety Rating"
            name="safetyRating"
            type="number"
            value={currentDriver.safetyRating}
            onChange={handleInputChange}
            error={!!formErrors.safetyRating}
            helperText={formErrors.safetyRating || "Rating between 0-5"}
            required
            InputProps={{ inputProps: { min: 0, max: 5, step: 0.5 } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Total Trips"
            name="totalTrips"
            type="number"
            value={currentDriver.totalTrips}
            onChange={handleInputChange}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Violations"
            name="violations"
            type="number"
            value={currentDriver.violations}
            onChange={handleInputChange}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Trip Date"
            name="lastTripDate"
            type="date"
            value={currentDriver.lastTripDate}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="License Renewal Date"
            name="nextLicenseRenewal"
            type="date"
            value={currentDriver.nextLicenseRenewal}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
      </Grid>
    </>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Driver Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleAddDriver}
        >
          Add Driver
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {drivers.map((driver) => (
          <Grid item key={driver.id} xs={12} sm={6} md={4}>
            <DriverCard 
              driver={driver} 
              onEdit={handleEditDriver} 
              onDelete={handleDeleteConfirm} 
            />
          </Grid>
        ))}
      </Grid>

      {/* Add Driver Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New Driver</Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseDialog} aria-label="close">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderDriverForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveDriver} variant="contained" color="primary">
            Add Driver
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Edit Driver</Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseDialog} aria-label="close">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderDriverForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveDriver} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this driver? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteDriver} color="error" variant="contained">
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

export default DriverManagement; 