import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Add,
  Build,
  CheckCircle,
  Schedule,
  Warning,
  Edit,
  Delete,
} from '@mui/icons-material';
import { MaintenanceRecord } from '../../types';

// Mock data (replace with actual API calls)
const mockMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: '1',
    vehicleId: '1',
    type: 'scheduled',
    description: 'Oil Change',
    date: '2024-03-25',
    cost: 45.00,
    provider: 'Quick Lube Service',
    status: 'scheduled',
    notes: '5W-30 synthetic oil',
  },
  {
    id: '2',
    vehicleId: '1',
    type: 'repair',
    description: 'Brake Pad Replacement',
    date: '2024-03-15',
    cost: 250.00,
    provider: 'City Auto Shop',
    status: 'completed',
    notes: 'Front brake pads replaced',
  },
  // Add more mock records as needed
];

const Maintenance: React.FC = () => {
  const getStatusIcon = (status: MaintenanceRecord['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'in-progress':
        return <Build color="warning" />;
      case 'scheduled':
        return <Schedule color="info" />;
      default:
        return null;
    }
  };

  const getTypeChipColor = (type: MaintenanceRecord['type']) => {
    switch (type) {
      case 'scheduled':
        return 'primary';
      case 'repair':
        return 'error';
      case 'inspection':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" component="div">
          Maintenance Schedule
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => {/* Handle add maintenance record */}}
        >
          Add Maintenance Task
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockMaintenanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(record.status)}
                        <Typography variant="body2">
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.type}
                        color={getTypeChipColor(record.type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell align="right">${record.cost.toFixed(2)}</TableCell>
                    <TableCell>{record.provider}</TableCell>
                    <TableCell>{record.notes}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => {/* Handle edit */}}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" onClick={() => {/* Handle delete */}}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Maintenance
            </Typography>
            <Box sx={{ mt: 2 }}>
              {mockMaintenanceRecords
                .filter((record) => record.status === 'scheduled')
                .map((record) => (
                  <Box
                    key={record.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                      p: 2,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                    }}
                  >
                    <Warning color="warning" />
                    <Box>
                      <Typography variant="subtitle1">{record.description}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Due: {new Date(record.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Maintenance Statistics
            </Typography>
            {/* Add maintenance statistics and charts here */}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Maintenance; 