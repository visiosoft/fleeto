import React from 'react';
import { Box, Typography, Grid, Paper, List, ListItemButton, ListItemText, ListItemIcon, Chip } from '@mui/material';
import { DirectionsCar, Speed, LocationOn, AccessTime } from '@mui/icons-material';

// Mock data for tracked vehicles
const trackedVehicles = [
  {
    id: 1,
    name: 'Truck 001',
    driver: 'John Smith',
    location: '123 Main St, City',
    speed: 65,
    status: 'Moving',
    lastUpdate: '2 minutes ago',
    destination: 'Warehouse A',
    eta: '15:30'
  },
  {
    id: 2,
    name: 'Van 002',
    driver: 'Sarah Johnson',
    location: '456 Oak Ave, City',
    speed: 45,
    status: 'Stopped',
    lastUpdate: '5 minutes ago',
    destination: 'Customer Site B',
    eta: '16:00'
  },
  {
    id: 3,
    name: 'Truck 003',
    driver: 'Mike Wilson',
    location: '789 Pine Rd, City',
    speed: 55,
    status: 'Moving',
    lastUpdate: '1 minute ago',
    destination: 'Distribution Center',
    eta: '16:45'
  }
];

const Tracking: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Real-Time Tracking
      </Typography>
      
      <Grid container spacing={3}>
        {/* Map View */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              Map View (Integration with mapping service required)
            </Typography>
          </Paper>
        </Grid>

        {/* Vehicle List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Vehicles
            </Typography>
            <List>
              {trackedVehicles.map((vehicle) => (
                <ListItemButton
                  key={vehicle.id}
                  divider
                  onClick={() => {
                    // Handle click event
                    console.log('Vehicle clicked:', vehicle.name);
                  }}
                >
                  <ListItemIcon>
                    <DirectionsCar color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={vehicle.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Driver: {vehicle.driver}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2">{vehicle.location}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Speed fontSize="small" color="action" />
                          <Typography variant="body2">{vehicle.speed} mph</Typography>
                          <Chip
                            label={vehicle.status}
                            size="small"
                            color={vehicle.status === 'Moving' ? 'success' : 'default'}
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <AccessTime fontSize="small" color="action" />
                          <Typography variant="body2">
                            ETA: {vehicle.eta} | Last Update: {vehicle.lastUpdate}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Tracking; 