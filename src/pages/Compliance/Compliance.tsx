import React from 'react';
import { Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, Chip } from '@mui/material';
import { Gavel, Warning, CheckCircle, Error } from '@mui/icons-material';
import { ResponsiveBar } from '@nivo/bar';

// Mock data for compliance metrics
const complianceData = [
  {
    category: 'Driver Hours',
    compliant: 85,
    nonCompliant: 15
  },
  {
    category: 'Vehicle Inspections',
    compliant: 92,
    nonCompliant: 8
  },
  {
    category: 'Documentation',
    compliant: 88,
    nonCompliant: 12
  },
  {
    category: 'Safety Training',
    compliant: 95,
    nonCompliant: 5
  }
];

// Mock data for compliance records
const complianceRecords = [
  {
    id: 1,
    type: 'Driver Hours',
    vehicle: 'Truck 001',
    driver: 'John Smith',
    date: '2024-03-19',
    status: 'Compliant',
    details: 'Within allowed hours'
  },
  {
    id: 2,
    type: 'Vehicle Inspection',
    vehicle: 'Van 002',
    driver: 'Sarah Johnson',
    date: '2024-03-19',
    status: 'Warning',
    details: 'Pre-trip inspection incomplete'
  },
  {
    id: 3,
    type: 'Documentation',
    vehicle: 'Truck 003',
    driver: 'Mike Wilson',
    date: '2024-03-18',
    status: 'Non-Compliant',
    details: 'Missing maintenance records'
  }
];

const Compliance: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Compliance & Safety
      </Typography>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Gavel color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Overall Compliance</Typography>
            </Box>
            <Typography variant="h4">90%</Typography>
            <Typography variant="body2" color="textSecondary">
              Fleet Average
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Warning color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Active Warnings</Typography>
            </Box>
            <Typography variant="h4">3</Typography>
            <Typography variant="body2" color="textSecondary">
              Require Attention
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Compliant Vehicles</Typography>
            </Box>
            <Typography variant="h4">8/10</Typography>
            <Typography variant="body2" color="textSecondary">
              Current Status
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Error color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Violations</Typography>
            </Box>
            <Typography variant="h4">2</Typography>
            <Typography variant="body2" color="textSecondary">
              This Month
            </Typography>
          </Paper>
        </Grid>

        {/* Compliance Metrics Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Compliance Metrics
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveBar
                data={complianceData}
                keys={['compliant', 'nonCompliant']}
                indexBy="category"
                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                colors={{ scheme: 'nivo' }}
                defs={[
                  {
                    id: 'dots',
                    type: 'patternDots',
                    background: 'inherit',
                    color: '#38bcb2',
                    size: 4,
                    padding: 1,
                    stagger: true
                  }
                ]}
                fill={[
                  {
                    match: {
                      id: 'compliant'
                    },
                    id: 'dots'
                  }
                ]}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Category',
                  legendPosition: 'middle',
                  legendOffset: 32
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Percentage',
                  legendPosition: 'middle',
                  legendOffset: -40
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                animate={true}
                legends={[
                  {
                    dataFrom: 'keys',
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 120,
                    translateY: 0,
                    itemsSpacing: 2,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemDirection: 'left-to-right',
                    itemOpacity: 0.85,
                    symbolSize: 20,
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemOpacity: 1
                        }
                      }
                    ]
                  }
                ]}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Safety Score Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Safety Score Trend
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                Safety score trend chart will be implemented here
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Compliance Records Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Compliance Records
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {complianceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.type}</TableCell>
                      <TableCell>{record.vehicle}</TableCell>
                      <TableCell>{record.driver}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.status}
                          color={
                            record.status === 'Compliant'
                              ? 'success'
                              : record.status === 'Warning'
                              ? 'warning'
                              : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>{record.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Compliance; 