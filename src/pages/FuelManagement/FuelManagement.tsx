import React, { useState } from 'react';
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

// Define FuelRecord interface
interface FuelRecord {
  id: number;
  vehicle: string;
  date: string;
  amount: number;
  cost: number;
  location: string;
  efficiency: number;
  status: 'Normal' | 'Warning';
  odometer?: number;
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
    id: 1,
    vehicle: 'Truck 001',
    date: '2024-03-19',
    amount: 50,
    cost: 150,
    location: 'Gas Station A',
    efficiency: 8.5,
    status: 'Normal',
    odometer: 15000
  },
  {
    id: 2,
    vehicle: 'Van 002',
    date: '2024-03-19',
    amount: 30,
    cost: 90,
    location: 'Gas Station B',
    efficiency: 7.8,
    status: 'Warning',
    odometer: 22000
  },
  {
    id: 3,
    vehicle: 'Truck 003',
    date: '2024-03-18',
    amount: 45,
    cost: 135,
    location: 'Gas Station A',
    efficiency: 8.2,
    status: 'Normal',
    odometer: 18500
  }
];

// Empty fuel record template
const emptyFuelRecord: FuelRecord = {
  id: 0,
  vehicle: '',
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  cost: 0,
  location: '',
  efficiency: 0,
  status: 'Normal',
  odometer: 0
};

const FuelManagement: React.FC = () => {
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>(initialFuelRecords);
  const [currentRecord, setCurrentRecord] = useState<FuelRecord>(emptyFuelRecord);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number>(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Calculate stats from fuel records
  const totalFuelCost = fuelRecords.reduce((sum, record) => sum + record.cost, 0);
  const avgEfficiency = fuelRecords.reduce((sum, record) => sum + record.efficiency, 0) / fuelRecords.length;
  const totalEfficiencyAlerts = fuelRecords.filter(record => record.status === 'Warning').length;
  
  const handleAddRecord = () => {
    setCurrentRecord({ ...emptyFuelRecord });
    setFormErrors({});
    setOpenAddDialog(true);
  };

  const handleEditRecord = (record: FuelRecord) => {
    setCurrentRecord({ ...record });
    setFormErrors({});
    setOpenEditDialog(true);
  };

  const handleDeleteConfirm = (id: number) => {
    setRecordToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteRecord = () => {
    setFuelRecords(fuelRecords.filter(record => record.id !== recordToDelete));
    setDeleteConfirmOpen(false);
    setSnackbar({
      open: true,
      message: 'Fuel record deleted successfully',
      severity: 'success',
    });
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!currentRecord.vehicle.trim()) errors.vehicle = 'Vehicle is required';
    if (!currentRecord.location.trim()) errors.location = 'Location is required';
    if (currentRecord.amount <= 0) errors.amount = 'Amount must be greater than 0';
    if (currentRecord.cost <= 0) errors.cost = 'Cost must be greater than 0';
    if (currentRecord.efficiency <= 0) errors.efficiency = 'Efficiency must be greater than 0';
    if (currentRecord.odometer && currentRecord.odometer < 0) errors.odometer = 'Odometer cannot be negative';
    
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

  const handleSaveRecord = () => {
    if (!validateForm()) return;
    
    if (openAddDialog) {
      // Add new record
      const newRecord = {
        ...currentRecord,
        id: Math.max(...fuelRecords.map(record => record.id), 0) + 1,
      };
      setFuelRecords([...fuelRecords, newRecord]);
      setSnackbar({
        open: true,
        message: 'Fuel record added successfully',
        severity: 'success',
      });
    } else {
      // Update existing record
      setFuelRecords(fuelRecords.map(record => 
        record.id === currentRecord.id ? currentRecord : record
      ));
      setSnackbar({
        open: true,
        message: 'Fuel record updated successfully',
        severity: 'success',
      });
    }
    
    handleCloseDialog();
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderRecordForm = () => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Vehicle"
            name="vehicle"
            value={currentRecord.vehicle}
            onChange={handleInputChange}
            error={!!formErrors.vehicle}
            helperText={formErrors.vehicle}
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
            label="Amount (gal)"
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
            label="Location"
            name="location"
            value={currentRecord.location}
            onChange={handleInputChange}
            error={!!formErrors.location}
            helperText={formErrors.location}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Efficiency (mpg)"
            name="efficiency"
            type="number"
            value={currentRecord.efficiency}
            onChange={handleInputChange}
            error={!!formErrors.efficiency}
            helperText={formErrors.efficiency}
            required
            InputProps={{ inputProps: { min: 0, step: 0.1 } }}
          />
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
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Warning">Warning</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Odometer Reading"
            name="odometer"
            type="number"
            value={currentRecord.odometer}
            onChange={handleInputChange}
            error={!!formErrors.odometer}
            helperText={formErrors.odometer}
            InputProps={{ inputProps: { min: 0 } }}
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
            <Typography variant="h4">${totalFuelCost}</Typography>
            <Typography variant="body2" color="textSecondary">
              This Month
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
                    <TableCell>Amount (gal)</TableCell>
                    <TableCell>Cost ($)</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Efficiency (mpg)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fuelRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.vehicle}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.amount}</TableCell>
                      <TableCell>{record.cost}</TableCell>
                      <TableCell>{record.location}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {record.efficiency}
                          <LinearProgress
                            variant="determinate"
                            value={(record.efficiency / 10) * 100}
                            sx={{ width: 50, height: 6, borderRadius: 3 }}
                            color={record.status === 'Warning' ? 'warning' : 'success'}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          color={record.status === 'Warning' ? 'warning.main' : 'success.main'}
                        >
                          {record.status}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditRecord(record)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteConfirm(record.id)}>
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