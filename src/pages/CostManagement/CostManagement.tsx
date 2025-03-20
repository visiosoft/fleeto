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
  Chip,
} from '@mui/material';
import { 
  AttachMoney, 
  TrendingDown, 
  TrendingUp, 
  Warning,
  Add,
  Edit,
  Delete,
  Close,
} from '@mui/icons-material';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';

// Define CostRecord interface
interface CostRecord {
  id: number;
  vehicle: string;
  date: string;
  category: 'Fuel' | 'Maintenance' | 'Insurance' | 'Taxes' | 'Other';
  description: string;
  amount: number;
  paymentMethod: 'Credit Card' | 'Cash' | 'Bank Transfer' | 'Other';
  notes?: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

// Mock data for expense categories
const expenseCategoriesData = [
  {
    id: 'Fuel',
    label: 'Fuel',
    value: 35,
    color: 'hsl(240, 70%, 50%)'
  },
  {
    id: 'Maintenance',
    label: 'Maintenance',
    value: 25,
    color: 'hsl(0, 70%, 50%)'
  },
  {
    id: 'Insurance',
    label: 'Insurance',
    value: 20,
    color: 'hsl(120, 70%, 50%)'
  },
  {
    id: 'Taxes',
    label: 'Taxes',
    value: 15,
    color: 'hsl(45, 70%, 50%)'
  },
  {
    id: 'Other',
    label: 'Other',
    value: 5,
    color: 'hsl(180, 70%, 50%)'
  }
];

// Mock data for expense trend
const expenseTrendData = [
  {
    id: 'expenses',
    color: 'hsl(240, 70%, 50%)',
    data: [
      { x: 'Jan', y: 1250 },
      { x: 'Feb', y: 1350 },
      { x: 'Mar', y: 1400 },
      { x: 'Apr', y: 1500 },
      { x: 'May', y: 1300 },
      { x: 'Jun', y: 1600 }
    ]
  }
];

// Mock data for cost records
const initialCostRecords: CostRecord[] = [
  {
    id: 1,
    vehicle: 'Truck 001',
    date: '2024-03-19',
    category: 'Fuel',
    description: 'Diesel refill',
    amount: 150,
    paymentMethod: 'Credit Card',
    notes: 'Regular maintenance stop',
    status: 'Paid'
  },
  {
    id: 2,
    vehicle: 'Van 002',
    date: '2024-03-18',
    category: 'Maintenance',
    description: 'Oil change and filter',
    amount: 85,
    paymentMethod: 'Credit Card',
    status: 'Paid'
  },
  {
    id: 3,
    vehicle: 'Truck 003',
    date: '2024-03-17',
    category: 'Insurance',
    description: 'Monthly premium',
    amount: 200,
    paymentMethod: 'Bank Transfer',
    status: 'Pending'
  },
  {
    id: 4,
    vehicle: 'Van 002',
    date: '2024-03-15',
    category: 'Taxes',
    description: 'Road tax',
    amount: 120,
    paymentMethod: 'Bank Transfer',
    status: 'Paid'
  },
  {
    id: 5,
    vehicle: 'Truck 001',
    date: '2024-03-10',
    category: 'Maintenance',
    description: 'Brake replacement',
    amount: 350,
    paymentMethod: 'Credit Card',
    status: 'Paid'
  }
];

// Empty cost record template
const emptyCostRecord: CostRecord = {
  id: 0,
  vehicle: '',
  date: new Date().toISOString().split('T')[0],
  category: 'Fuel',
  description: '',
  amount: 0,
  paymentMethod: 'Credit Card',
  notes: '',
  status: 'Paid'
};

const CostManagement: React.FC = () => {
  const [costRecords, setCostRecords] = useState<CostRecord[]>(initialCostRecords);
  const [currentRecord, setCurrentRecord] = useState<CostRecord>(emptyCostRecord);
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

  // Calculate stats from cost records
  const totalCosts = costRecords.reduce((sum, record) => sum + record.amount, 0);
  const fuelCosts = costRecords
    .filter(record => record.category === 'Fuel')
    .reduce((sum, record) => sum + record.amount, 0);
  const maintenanceCosts = costRecords
    .filter(record => record.category === 'Maintenance')
    .reduce((sum, record) => sum + record.amount, 0);
  const pendingPayments = costRecords
    .filter(record => record.status !== 'Paid')
    .reduce((sum, record) => sum + record.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleAddRecord = () => {
    setCurrentRecord({ ...emptyCostRecord });
    setFormErrors({});
    setOpenAddDialog(true);
  };

  const handleEditRecord = (record: CostRecord) => {
    setCurrentRecord({ ...record });
    setFormErrors({});
    setOpenEditDialog(true);
  };

  const handleDeleteConfirm = (id: number) => {
    setRecordToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteRecord = () => {
    setCostRecords(costRecords.filter(record => record.id !== recordToDelete));
    setDeleteConfirmOpen(false);
    setSnackbar({
      open: true,
      message: 'Cost record deleted successfully',
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
    if (!currentRecord.description.trim()) errors.description = 'Description is required';
    if (currentRecord.amount <= 0) errors.amount = 'Amount must be greater than 0';
    
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
        id: Math.max(...costRecords.map(record => record.id), 0) + 1,
      };
      setCostRecords([...costRecords, newRecord]);
      setSnackbar({
        open: true,
        message: 'Cost record added successfully',
        severity: 'success',
      });
    } else {
      // Update existing record
      setCostRecords(costRecords.map(record => 
        record.id === currentRecord.id ? currentRecord : record
      ));
      setSnackbar({
        open: true,
        message: 'Cost record updated successfully',
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
          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={currentRecord.category}
              onChange={handleSelectChange}
              label="Category"
            >
              <MenuItem value="Fuel">Fuel</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
              <MenuItem value="Insurance">Insurance</MenuItem>
              <MenuItem value="Taxes">Taxes</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={currentRecord.description}
            onChange={handleInputChange}
            error={!!formErrors.description}
            helperText={formErrors.description}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Amount ($)"
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
          <FormControl fullWidth required>
            <InputLabel>Payment Method</InputLabel>
            <Select
              name="paymentMethod"
              value={currentRecord.paymentMethod}
              onChange={handleSelectChange}
              label="Payment Method"
            >
              <MenuItem value="Credit Card">Credit Card</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
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
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Overdue">Overdue</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Notes"
            name="notes"
            value={currentRecord.notes || ''}
            onChange={handleInputChange}
            multiline
            rows={2}
          />
        </Grid>
      </Grid>
    </>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cost Management
      </Typography>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AttachMoney color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Costs</Typography>
            </Box>
            <Typography variant="h4">${totalCosts}</Typography>
            <Typography variant="body2" color="textSecondary">
              This Month
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingDown color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Fuel Costs</Typography>
            </Box>
            <Typography variant="h4">${fuelCosts}</Typography>
            <Typography variant="body2" color="textSecondary">
              This Month
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUp color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Maintenance Costs</Typography>
            </Box>
            <Typography variant="h4">${maintenanceCosts}</Typography>
            <Typography variant="body2" color="textSecondary">
              This Month
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Warning color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Pending Payments</Typography>
            </Box>
            <Typography variant="h4">${pendingPayments}</Typography>
            <Typography variant="body2" color="textSecondary">
              This Month
            </Typography>
          </Paper>
        </Grid>

        {/* Expense Category Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Expense Categories
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsivePie
                data={expenseCategoriesData}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#333333"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 56,
                    itemsSpacing: 0,
                    itemWidth: 100,
                    itemHeight: 18,
                    itemTextColor: '#999',
                    itemDirection: 'left-to-right',
                    itemOpacity: 1,
                    symbolSize: 18,
                    symbolShape: 'circle',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemTextColor: '#000'
                        }
                      }
                    ]
                  }
                ]}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Expense Trend Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Expense Trend
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveLine
                data={expenseTrendData}
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
                  legend: 'Amount ($)',
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

        {/* Cost Records Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Cost Records
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={handleAddRecord}
              >
                Add Cost Record
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount ($)</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {costRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.vehicle}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.category}</TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>${record.amount}</TableCell>
                      <TableCell>{record.paymentMethod}</TableCell>
                      <TableCell>
                        <Chip 
                          label={record.status}
                          color={getStatusColor(record.status)}
                          size="small" 
                        />
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

      {/* Add Cost Record Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New Cost Record</Typography>
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

      {/* Edit Cost Record Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Edit Cost Record</Typography>
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
          <Typography>Are you sure you want to delete this cost record? This action cannot be undone.</Typography>
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

export default CostManagement; 