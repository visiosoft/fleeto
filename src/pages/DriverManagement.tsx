import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
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
  IconButton,
  Snackbar,
  Alert,
  OutlinedInput,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Avatar,
  Stack,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import type { Moment } from 'moment';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../config/api';
import DriverDocuments from '../components/DriverDocuments';
import TableToolbar from '../components/TableToolbar';

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  contact: string;
  address: string;
  status: string;
  notes?: string;
}

interface DriverFormValues extends Omit<Driver, '_id' | 'licenseExpiry'> {
  licenseExpiry: Moment;
}

const DriverManagement: React.FC = () => {
  const theme = useTheme();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formValues, setFormValues] = useState<Partial<DriverFormValues>>({});
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('firstName');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.DRIVERS_API.LIST));
      setDrivers(response.data);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      showSnackbar('Failed to fetch drivers', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleAdd = () => {
    setFormValues({
      status: 'active',
    });
    setEditingDriver(null);
    setIsModalOpen(true);
  };

  const handleEdit = async (driver: Driver) => {
    try {
      const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.DRIVERS}/${driver._id}`));
      const driverData = response.data;
      setFormValues({
        ...driverData,
        licenseExpiry: moment(driverData.licenseExpiry),
      });
      setEditingDriver(driver);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch driver details:', error);
      showSnackbar('Failed to fetch driver details', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) {
      return;
    }

    try {
      await axios.delete(getApiUrl(API_CONFIG.ENDPOINTS.DRIVERS_API.DELETE(id)));
      showSnackbar('Driver deleted successfully', 'success');
      fetchDrivers();
    } catch (error) {
      console.error('Failed to delete driver:', error);
      showSnackbar('Failed to delete driver', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.firstName || !formValues.lastName || !formValues.licenseNumber || !formValues.licenseExpiry) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    try {
      const driverData = {
        ...formValues,
        licenseExpiry: formValues.licenseExpiry.format('YYYY-MM-DD'),
      };

      if (editingDriver) {
        await axios.put(getApiUrl(API_CONFIG.ENDPOINTS.DRIVERS_API.UPDATE(editingDriver._id)), driverData);
        showSnackbar('Driver updated successfully', 'success');
      } else {
        await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.DRIVERS_API.CREATE), driverData);
        showSnackbar('Driver added successfully', 'success');
      }
      handleCloseDialog();
      fetchDrivers();
    } catch (error) {
      console.error('Failed to save driver:', error);
      showSnackbar('Failed to save driver', 'error');
    }
  };

  const handleInputChange = (field: keyof DriverFormValues, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCloseDialog = () => {
    setIsModalOpen(false);
    setFormValues({});
  };

  // Sort options for drivers
  const sortOptions = [
    { value: 'firstName', label: 'First Name (A-Z)' },
    { value: 'lastName', label: 'Last Name (A-Z)' },
    { value: 'licenseNumber', label: 'License Number' },
    { value: 'status', label: 'Status' },
    { value: 'licenseExpiry', label: 'License Expiry' },
  ];

  // Filter and sort drivers
  const filteredAndSortedDrivers = React.useMemo(() => {
    let filtered = drivers;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = drivers.filter(driver =>
        driver.firstName?.toLowerCase().includes(query) ||
        driver.lastName?.toLowerCase().includes(query) ||
        driver.licenseNumber?.toLowerCase().includes(query) ||
        driver.contact?.toLowerCase().includes(query) ||
        driver.address?.toLowerCase().includes(query) ||
        driver.status?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'firstName':
          return (a.firstName || '').localeCompare(b.firstName || '');
        case 'lastName':
          return (a.lastName || '').localeCompare(b.lastName || '');
        case 'licenseNumber':
          return (a.licenseNumber || '').localeCompare(b.licenseNumber || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'licenseExpiry':
          const dateA = a.licenseExpiry ? moment(a.licenseExpiry).valueOf() : 0;
          const dateB = b.licenseExpiry ? moment(b.licenseExpiry).valueOf() : 0;
          return dateA - dateB;
        default:
          return 0;
      }
    });

    return sorted;
  }, [drivers, searchQuery, sortBy]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Driver Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Driver
        </Button>
      </Box>

      <TableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search drivers by name, license, contact..."
        sortValue={sortBy}
        onSortChange={setSortBy}
        sortOptions={sortOptions}
      />

      <TableContainer component={Paper} sx={{ 
        borderRadius: 3,
        overflowX: 'auto',
        boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)` }}>
              <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Driver Info</TableCell>
              <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>License Details</TableCell>
              <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedDrivers.map((driver) => (
              <TableRow 
                key={driver._id}
                onMouseEnter={() => setHoveredRow(driver._id)}
                onMouseLeave={() => setHoveredRow(null)}
                sx={{
                  backgroundColor: hoveredRow === driver._id 
                    ? alpha(theme.palette.primary.main, 0.04)
                    : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: hoveredRow === driver._id ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: hoveredRow === driver._id 
                    ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                    : 'none',
                  borderLeft: hoveredRow === driver._id 
                    ? `4px solid ${theme.palette.primary.main}`
                    : '4px solid transparent',
                  '& td': {
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    py: 2.5,
                  },
                  '&:last-child td': {
                    borderBottom: 'none',
                  },
                  cursor: 'pointer',
                }}
              >
                <TableCell>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        sx={{ 
                          width: 40, 
                          height: 40,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {`${driver.firstName} ${driver.lastName}`}
                        </Typography>
                        {driver.address && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 12, color: theme.palette.text.disabled }} />
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                              {driver.address}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BadgeIcon sx={{ fontSize: 14, color: theme.palette.info.main }} />
                      <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                        {driver.licenseNumber}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {driver.licenseState}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon sx={{ fontSize: 12, color: theme.palette.text.secondary }} />
                      <Typography variant="caption" color="text.secondary">
                        Expires: {moment(driver.licenseExpiry).format('MMM DD, YYYY')}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                    <Typography variant="body2">
                      {driver.contact}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={driver.status} 
                    color={driver.status === 'active' ? 'success' : 'default'}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="Edit Driver">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(driver)}
                        sx={{
                          backgroundColor: alpha(theme.palette.info.main, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.info.main, 0.2),
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s',
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Documents">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedDriverId(driver._id);
                          setDocumentsDialogOpen(true);
                        }}
                        sx={{
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.success.main, 0.2),
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s',
                        }}
                      >
                        <AttachFileIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Driver">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(driver._id)}
                        sx={{
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.2),
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s',
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={isModalOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingDriver ? 'Edit Driver' : 'Add Driver'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formValues.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formValues.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="License Number"
                  value={formValues.licenseNumber || ''}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="License State"
                  value={formValues.licenseState || ''}
                  onChange={(e) => handleInputChange('licenseState', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    label="License Expiry"
                    value={formValues.licenseExpiry || null}
                    onChange={(date: Moment | null) => handleInputChange('licenseExpiry', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formValues.status || 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    input={<OutlinedInput label="Status" />}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact"
                  value={formValues.contact || ''}
                  onChange={(e) => handleInputChange('contact', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formValues.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formValues.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingDriver ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Driver Documents Dialog */}
      {selectedDriverId && (
        <DriverDocuments
          driverId={selectedDriverId}
          open={documentsDialogOpen}
          onClose={() => {
            setDocumentsDialogOpen(false);
            setSelectedDriverId(null);
          }}
        />
      )}
    </Box>
  );
};

export default DriverManagement; 