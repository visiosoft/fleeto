import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { ResponsiveLine } from '@nivo/line';
import { FuelRecord } from '../../types';

// Mock data (replace with actual API calls)
const mockFuelRecords: FuelRecord[] = [
  {
    id: '1',
    vehicleId: '1',
    date: '2024-03-15',
    gallons: 15.5,
    cost: 52.70,
    odometer: 15000,
    fuelType: 'gasoline',
    location: 'Shell Station - Main St',
  },
  {
    id: '2',
    vehicleId: '1',
    date: '2024-03-01',
    gallons: 14.2,
    cost: 48.28,
    odometer: 14500,
    fuelType: 'gasoline',
    location: 'Exxon - Highway 1',
  },
  // Add more mock records as needed
];

// Prepare data for the consumption trend chart
const consumptionData = [
  {
    id: 'fuel consumption',
    data: mockFuelRecords
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((record) => ({
        x: record.date,
        y: record.gallons,
      })),
  },
];

const FuelManagement: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" component="div">
          Fuel Records
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => {/* Handle add fuel record */}}
        >
          Add Fuel Record
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="right">Gallons</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell align="right">Odometer</TableCell>
                  <TableCell>Fuel Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockFuelRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{record.location}</TableCell>
                    <TableCell align="right">{record.gallons.toFixed(2)}</TableCell>
                    <TableCell align="right">${record.cost.toFixed(2)}</TableCell>
                    <TableCell align="right">{record.odometer.toLocaleString()}</TableCell>
                    <TableCell>{record.fuelType}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Fuel Consumption Trend
            </Typography>
            <Box sx={{ height: 250 }}>
              <ResponsiveLine
                data={consumptionData}
                margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                xScale={{
                  type: 'time',
                  format: '%Y-%m-%d',
                  useUTC: false,
                  precision: 'day',
                }}
                xFormat="time:%Y-%m-%d"
                yScale={{
                  type: 'linear',
                  min: 'auto',
                  max: 'auto',
                }}
                axisBottom={{
                  format: '%b %d',
                  tickRotation: -45,
                }}
                axisLeft={{
                  legend: 'Gallons',
                  legendOffset: -40,
                }}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                enableArea={true}
                areaOpacity={0.1}
                useMesh={true}
                enableSlices="x"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FuelManagement; 