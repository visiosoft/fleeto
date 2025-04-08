import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsCar as VehicleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout/PageLayout';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  status: string;
  licensePlate: string;
  lastMaintenance: string;
  nextMaintenance: string;
}

const Vehicle: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    status: '',
    licensePlate: '',
    lastMaintenance: '',
    nextMaintenance: '',
  });

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockVehicles: Vehicle[] = [
      {
        id: '1',
        name: 'Truck 1',
        type: 'Heavy Duty',
        status: 'Active',
        licensePlate: 'ABC123',
        lastMaintenance: '2024-02-15',
        nextMaintenance: '2024-05-15',
      },
      {
        id: '2',
        name: 'Van 1',
        type: 'Light Duty',
        status: 'Maintenance',
        licensePlate: 'XYZ789',
        lastMaintenance: '2024-02-10',
        nextMaintenance: '2024-04-10',
      },
    ];
    setVehicles(mockVehicles);
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setFormData({
        name: vehicle.name,
        type: vehicle.type,
        status: vehicle.status,
        licensePlate: vehicle.licensePlate,
        lastMaintenance: vehicle.lastMaintenance,
        nextMaintenance: vehicle.nextMaintenance,
      });
    } else {
      setSelectedVehicle(null);
      setFormData({
        name: '',
        type: '',
        status: '',
        licensePlate: '',
        lastMaintenance: '',
        nextMaintenance: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVehicle(null);
  };

  const handleSubmit = () => {
    if (selectedVehicle) {
      // Update existing vehicle
      setVehicles(vehicles.map(v => 
        v.id === selectedVehicle.id ? { ...v, ...formData } : v
      ));
    } else {
      // Add new vehicle
      const newVehicle: Vehicle = {
        id: String(vehicles.length + 1),
        ...formData,
      };
      setVehicles([...vehicles, newVehicle]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  return (
    <PageLayout title="Vehicle Management">
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Vehicle Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Add Vehicle
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <VehicleIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6" component="div">
                    Total Vehicles
                  </Typography>
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {vehicles.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {/* Add more stat cards as needed */}
        </Grid>

        <Paper sx={{ width: '100%', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>License Plate</TableCell>
                  <TableCell>Last Maintenance</TableCell>
                  <TableCell>Next Maintenance</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((vehicle) => (
                    <TableRow hover key={vehicle.id}>
                      <TableCell>{vehicle.name}</TableCell>
                      <TableCell>{vehicle.type}</TableCell>
                      <TableCell>{vehicle.status}</TableCell>
                      <TableCell>{vehicle.licensePlate}</TableCell>
                      <TableCell>{vehicle.lastMaintenance}</TableCell>
                      <TableCell>{vehicle.nextMaintenance}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => handleOpenDialog(vehicle)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(vehicle.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={vehicles.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
              />
              <TextField
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                fullWidth
              />
              <TextField
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              />
              <TextField
                label="License Plate"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                fullWidth
              />
              <TextField
                label="Last Maintenance"
                type="date"
                value={formData.lastMaintenance}
                onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Next Maintenance"
                type="date"
                value={formData.nextMaintenance}
                onChange={(e) => setFormData({ ...formData, nextMaintenance: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedVehicle ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageLayout>
  );
};

export default Vehicle; 