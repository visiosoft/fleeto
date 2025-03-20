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

// Define MaintenanceTask interface
interface MaintenanceTask {
  id: number;
  vehicle: string;
  task: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  lastServiceDate: string;
  mileage: number;
  nextServiceMileage: number;
}

// Define ServiceRecord interface
interface ServiceRecord {
  id: number;
  vehicle: string;
  service: string;
  date: string;
  mileage: number;
  cost: number;
  technician: string;
  notes: string;
}

// Mock data for maintenance tasks
const initialMaintenanceTasks: MaintenanceTask[] = [
  {
    id: 1,
    vehicle: 'Truck 101',
    task: 'Oil Change',
    dueDate: '2024-03-20',
    status: 'pending',
    priority: 'high',
    lastServiceDate: '2024-02-20',
    mileage: 15000,
    nextServiceMileage: 20000,
  },
  {
    id: 2,
    vehicle: 'Truck 102',
    task: 'Brake Inspection',
    dueDate: '2024-03-25',
    status: 'in-progress',
    priority: 'medium',
    lastServiceDate: '2024-02-15',
    mileage: 18000,
    nextServiceMileage: 25000,
  },
  {
    id: 3,
    vehicle: 'Truck 103',
    task: 'Tire Rotation',
    dueDate: '2024-03-30',
    status: 'completed',
    priority: 'low',
    lastServiceDate: '2024-03-10',
    mileage: 12000,
    nextServiceMileage: 18000,
  },
];

// Mock data for service history
const initialServiceHistory: ServiceRecord[] = [
  {
    id: 1,
    vehicle: 'Truck 101',
    service: 'Oil Change',
    date: '2024-02-20',
    mileage: 15000,
    cost: 150,
    technician: 'John Smith',
    notes: 'Regular maintenance completed',
  },
  {
    id: 2,
    vehicle: 'Truck 102',
    service: 'Brake Inspection',
    date: '2024-02-15',
    mileage: 18000,
    cost: 200,
    technician: 'Sarah Johnson',
    notes: 'Brake pads replaced',
  },
  {
    id: 3,
    vehicle: 'Truck 103',
    service: 'Tire Rotation',
    date: '2024-03-10',
    mileage: 12000,
    cost: 100,
    technician: 'Mike Brown',
    notes: 'Tires rotated and balanced',
  },
];

// Empty maintenance task template
const emptyMaintenanceTask: MaintenanceTask = {
  id: 0,
  vehicle: '',
  task: '',
  dueDate: new Date().toISOString().split('T')[0],
  status: 'pending',
  priority: 'medium',
  lastServiceDate: new Date().toISOString().split('T')[0],
  mileage: 0,
  nextServiceMileage: 0,
};

// Empty service record template
const emptyServiceRecord: ServiceRecord = {
  id: 0,
  vehicle: '',
  service: '',
  date: new Date().toISOString().split('T')[0],
  mileage: 0,
  cost: 0,
  technician: '',
  notes: '',
};

const MaintenanceCard: React.FC<{
  task: MaintenanceTask;
  onEdit: (task: MaintenanceTask) => void;
  onDelete: (id: number) => void;
}> = ({ task, onEdit, onDelete }) => {
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

  const progress = (task.mileage / task.nextServiceMileage) * 100;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            {task.vehicle}
          </Typography>
          <Box>
            <IconButton size="small" onClick={() => onEdit(task)}>
              <Edit />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(task.id)}>
              <Delete />
            </IconButton>
          </Box>
        </Box>
        <Box>
          <Chip
            label={task.status}
            color={getStatusColor(task.status)}
            size="small"
            sx={{ mr: 1 }}
          />
          <Chip
            label={task.priority}
            color={getPriorityColor(task.priority)}
            size="small"
          />
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          {task.task}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Due Date: {task.dueDate}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last Service: {task.lastServiceDate}
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
            Current: {task.mileage} / Next Service: {task.nextServiceMileage}
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => console.log('View details:', task.id)}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

const Maintenance: React.FC = () => {
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(initialMaintenanceTasks);
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>(initialServiceHistory);
  const [currentTask, setCurrentTask] = useState<MaintenanceTask>(emptyMaintenanceTask);
  const [currentService, setCurrentService] = useState<ServiceRecord>(emptyServiceRecord);
  const [openAddTaskDialog, setOpenAddTaskDialog] = useState(false);
  const [openEditTaskDialog, setOpenEditTaskDialog] = useState(false);
  const [openAddServiceDialog, setOpenAddServiceDialog] = useState(false);
  const [deleteTaskConfirmOpen, setDeleteTaskConfirmOpen] = useState(false);
  const [deleteServiceConfirmOpen, setDeleteServiceConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number>(0);
  const [serviceToDelete, setServiceToDelete] = useState<number>(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });
  
  // Task Management Functions
  const handleAddTask = () => {
    setCurrentTask({ ...emptyMaintenanceTask });
    setFormErrors({});
    setOpenAddTaskDialog(true);
  };

  const handleEditTask = (task: MaintenanceTask) => {
    setCurrentTask({ ...task });
    setFormErrors({});
    setOpenEditTaskDialog(true);
  };

  const handleDeleteTaskConfirm = (id: number) => {
    setTaskToDelete(id);
    setDeleteTaskConfirmOpen(true);
  };

  const handleDeleteTask = () => {
    setMaintenanceTasks(maintenanceTasks.filter(task => task.id !== taskToDelete));
    setDeleteTaskConfirmOpen(false);
    setSnackbar({
      open: true,
      message: 'Maintenance task deleted successfully',
      severity: 'success',
    });
  };

  const handleCloseTaskDialog = () => {
    setOpenAddTaskDialog(false);
    setOpenEditTaskDialog(false);
  };

  // Service Management Functions
  const handleAddService = () => {
    setCurrentService({ ...emptyServiceRecord });
    setFormErrors({});
    setOpenAddServiceDialog(true);
  };

  const handleDeleteServiceConfirm = (id: number) => {
    setServiceToDelete(id);
    setDeleteServiceConfirmOpen(true);
  };

  const handleDeleteService = () => {
    setServiceHistory(serviceHistory.filter(service => service.id !== serviceToDelete));
    setDeleteServiceConfirmOpen(false);
    setSnackbar({
      open: true,
      message: 'Service record deleted successfully',
      severity: 'success',
    });
  };

  const handleCloseServiceDialog = () => {
    setOpenAddServiceDialog(false);
  };

  // Form Validation & Handling
  const validateTaskForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!currentTask.vehicle.trim()) errors.vehicle = 'Vehicle is required';
    if (!currentTask.task.trim()) errors.task = 'Task is required';
    if (currentTask.mileage < 0) errors.mileage = 'Mileage cannot be negative';
    if (currentTask.nextServiceMileage <= currentTask.mileage) {
      errors.nextServiceMileage = 'Next service mileage must be greater than current mileage';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateServiceForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!currentService.vehicle.trim()) errors.vehicle = 'Vehicle is required';
    if (!currentService.service.trim()) errors.service = 'Service is required';
    if (!currentService.technician.trim()) errors.technician = 'Technician is required';
    if (currentService.mileage < 0) errors.mileage = 'Mileage cannot be negative';
    if (currentService.cost < 0) errors.cost = 'Cost cannot be negative';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      if (openAddTaskDialog || openEditTaskDialog) {
        setCurrentTask({
          ...currentTask,
          [name]: value,
        });
      } else {
        setCurrentService({
          ...currentService,
          [name]: value,
        });
      }
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (openAddTaskDialog || openEditTaskDialog) {
      setCurrentTask({
        ...currentTask,
        [name]: value,
      });
    } else {
      setCurrentService({
        ...currentService,
        [name]: value,
      });
    }
  };

  const handleSaveTask = () => {
    if (!validateTaskForm()) return;
    
    if (openAddTaskDialog) {
      // Add new task
      const newTask = {
        ...currentTask,
        id: Math.max(...maintenanceTasks.map(task => task.id), 0) + 1,
      };
      setMaintenanceTasks([...maintenanceTasks, newTask]);
      setSnackbar({
        open: true,
        message: 'Maintenance task added successfully',
        severity: 'success',
      });
    } else {
      // Update existing task
      setMaintenanceTasks(maintenanceTasks.map(task => 
        task.id === currentTask.id ? currentTask : task
      ));
      setSnackbar({
        open: true,
        message: 'Maintenance task updated successfully',
        severity: 'success',
      });
    }
    
    handleCloseTaskDialog();
  };

  const handleSaveService = () => {
    if (!validateServiceForm()) return;
    
    // Add new service record
    const newService = {
      ...currentService,
      id: Math.max(...serviceHistory.map(service => service.id), 0) + 1,
    };
    setServiceHistory([...serviceHistory, newService]);
    setSnackbar({
      open: true,
      message: 'Service record added successfully',
      severity: 'success',
    });
    
    handleCloseServiceDialog();
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderTaskForm = () => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Vehicle"
            name="vehicle"
            value={currentTask.vehicle}
            onChange={handleInputChange}
            error={!!formErrors.vehicle}
            helperText={formErrors.vehicle}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Task"
            name="task"
            value={currentTask.task}
            onChange={handleInputChange}
            error={!!formErrors.task}
            helperText={formErrors.task}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Due Date"
            name="dueDate"
            type="date"
            value={currentTask.dueDate}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={currentTask.status}
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
              value={currentTask.priority}
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
            label="Last Service Date"
            name="lastServiceDate"
            type="date"
            value={currentTask.lastServiceDate}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Current Mileage"
            name="mileage"
            type="number"
            value={currentTask.mileage}
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
            label="Next Service Mileage"
            name="nextServiceMileage"
            type="number"
            value={currentTask.nextServiceMileage}
            onChange={handleInputChange}
            error={!!formErrors.nextServiceMileage}
            helperText={formErrors.nextServiceMileage}
            required
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
      </Grid>
    </>
  );

  const renderServiceForm = () => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Vehicle"
            name="vehicle"
            value={currentService.vehicle}
            onChange={handleInputChange}
            error={!!formErrors.vehicle}
            helperText={formErrors.vehicle}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Service"
            name="service"
            value={currentService.service}
            onChange={handleInputChange}
            error={!!formErrors.service}
            helperText={formErrors.service}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Date"
            name="date"
            type="date"
            value={currentService.date}
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
            value={currentService.mileage}
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
            value={currentService.cost}
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
            value={currentService.technician}
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
            value={currentService.notes}
            onChange={handleInputChange}
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
    </>
  );

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
              onClick={handleAddTask}
            >
              Add Task
            </Button>
          </Box>
          <Grid container spacing={3}>
            {maintenanceTasks.map((task) => (
              <Grid item key={task.id} xs={12} sm={6} md={4}>
                <MaintenanceCard
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTaskConfirm}
                />
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Service History
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddService}
            >
              Add Service Record
            </Button>
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
                {serviceHistory.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.vehicle}</TableCell>
                    <TableCell>{service.service}</TableCell>
                    <TableCell>{service.date}</TableCell>
                    <TableCell>{service.mileage}</TableCell>
                    <TableCell>${service.cost}</TableCell>
                    <TableCell>{service.technician}</TableCell>
                    <TableCell>{service.notes}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleDeleteServiceConfirm(service.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Add Task Dialog */}
      <Dialog open={openAddTaskDialog} onClose={handleCloseTaskDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Maintenance Task</Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseTaskDialog} aria-label="close">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderTaskForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDialog}>Cancel</Button>
          <Button onClick={handleSaveTask} variant="contained" color="primary">
            Add Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={openEditTaskDialog} onClose={handleCloseTaskDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Edit Maintenance Task</Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseTaskDialog} aria-label="close">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderTaskForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDialog}>Cancel</Button>
          <Button onClick={handleSaveTask} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Service Record Dialog */}
      <Dialog open={openAddServiceDialog} onClose={handleCloseServiceDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Service Record</Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseServiceDialog} aria-label="close">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderServiceForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseServiceDialog}>Cancel</Button>
          <Button onClick={handleSaveService} variant="contained" color="primary">
            Add Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Task Confirmation Dialog */}
      <Dialog open={deleteTaskConfirmOpen} onClose={() => setDeleteTaskConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this maintenance task? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTaskConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteTask} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Service Confirmation Dialog */}
      <Dialog open={deleteServiceConfirmOpen} onClose={() => setDeleteServiceConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this service record? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteServiceConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteService} color="error" variant="contained">
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