import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
} from '@mui/material';
import {
  Notifications,
  Security,
  DirectionsCar,
  Build,
  LocalGasStation,
  Person,
} from '@mui/icons-material';

const Settings: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Notifications sx={{ mr: 1 }} />
                <Typography variant="h6">Notification Settings</Typography>
              </Box>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Maintenance Alerts"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Fuel Level Alerts"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Driver Performance Reports"
              />
              <FormControlLabel
                control={<Switch />}
                label="Cost Threshold Alerts"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ mr: 1 }} />
                <Typography variant="h6">Security Settings</Typography>
              </Box>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Two-Factor Authentication"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Session Timeout"
              />
              <FormControlLabel
                control={<Switch />}
                label="Login Notifications"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Activity Logging"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DirectionsCar sx={{ mr: 1 }} />
                <Typography variant="h6">Vehicle Settings</Typography>
              </Box>
              <TextField
                fullWidth
                label="Speed Limit (mph)"
                type="number"
                defaultValue={65}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Idle Time Limit (minutes)"
                type="number"
                defaultValue={5}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Vehicle Tracking Interval</InputLabel>
                <Select defaultValue="5">
                  <MenuItem value="1">1 minute</MenuItem>
                  <MenuItem value="5">5 minutes</MenuItem>
                  <MenuItem value="10">10 minutes</MenuItem>
                  <MenuItem value="15">15 minutes</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Build sx={{ mr: 1 }} />
                <Typography variant="h6">Maintenance Settings</Typography>
              </Box>
              <TextField
                fullWidth
                label="Oil Change Interval (miles)"
                type="number"
                defaultValue={5000}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Tire Rotation Interval (miles)"
                type="number"
                defaultValue={7500}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Maintenance Reminder Period</InputLabel>
                <Select defaultValue="7">
                  <MenuItem value="3">3 days</MenuItem>
                  <MenuItem value="7">7 days</MenuItem>
                  <MenuItem value="14">14 days</MenuItem>
                  <MenuItem value="30">30 days</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalGasStation sx={{ mr: 1 }} />
                <Typography variant="h6">Fuel Settings</Typography>
              </Box>
              <TextField
                fullWidth
                label="Low Fuel Alert Threshold (%)"
                type="number"
                defaultValue={20}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Fuel Efficiency Target (mpg)"
                type="number"
                defaultValue={25}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Fuel Report Frequency</InputLabel>
                <Select defaultValue="weekly">
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1 }} />
                <Typography variant="h6">Driver Settings</Typography>
              </Box>
              <TextField
                fullWidth
                label="Maximum Driving Hours per Day"
                type="number"
                defaultValue={10}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Required Break Duration (minutes)"
                type="number"
                defaultValue={30}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Driver Performance Review Period</InputLabel>
                <Select defaultValue="monthly">
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" color="secondary">
                  Reset to Defaults
                </Button>
                <Button variant="contained" color="primary">
                  Save Changes
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings; 