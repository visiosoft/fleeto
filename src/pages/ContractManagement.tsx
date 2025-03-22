import React, { useState, useEffect } from 'react';
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
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Close,
  Warning,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import axios, { AxiosError } from 'axios';
import { API_CONFIG, getApiUrl } from '../config/api';
import moment from 'moment';

interface Contract {
  _id?: string;
  companyName: string;
  tradeLicenseNo: string;
  contractType: string;
  startDate: string;
  endDate: string;
  value: number;
  status: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
}

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  totalValue: number;
  averageValue: number;
  contractsByStatus: Record<string, number>;
}

const emptyContract: Contract = {
  companyName: '',
  tradeLicenseNo: '',
  contractType: '',
  startDate: moment().format('YYYY-MM-DD'),
  endDate: moment().add(1, 'year').format('YYYY-MM-DD'),
  value: 0,
  status: 'draft',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  notes: ''
};

const ContractManagement: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [currentContract, setCurrentContract] = useState<Contract>(emptyContract);
  const [companies, setCompanies] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [expiringContracts, setExpiringContracts] = useState<Contract[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  useEffect(() => {
    fetchContracts();
    fetchCompanies();
    fetchStatuses();
    fetchStats();
    fetchExpiringContracts();
  }, []);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.CONTRACTS));
      setContracts(response.data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch contracts',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/companies`));
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/statuses`));
      setStatuses(response.data);
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/stats`));
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchExpiringContracts = async () => {
    try {
      const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/expiring`));
      setExpiringContracts(response.data);
    } catch (error) {
      console.error('Error fetching expiring contracts:', error);
    }
  };

  const handleAddContract = () => {
    setCurrentContract(emptyContract);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleEditContract = async (contract: Contract) => {
    try {
      const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${contract._id}`));
      setCurrentContract(response.data);
      setFormErrors({});
      setOpenDialog(true);
    } catch (error) {
      console.error('Error fetching contract details:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch contract details',
        severity: 'error'
      });
    }
  };

  const handleDeleteConfirm = (id: string) => {
    setContractToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteContract = async () => {
    try {
      await axios.delete(getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${contractToDelete}`));
      await fetchContracts();
      await fetchStats();
      setSnackbar({
        open: true,
        message: 'Contract deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting contract:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete contract',
        severity: 'error'
      });
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  const handleSaveContract = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (currentContract._id) {
        // Update existing contract
        const { _id, ...contractToUpdate } = currentContract;
        console.log('Updating contract:', contractToUpdate);
        const response = await axios.put(
          getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${_id}`),
          contractToUpdate
        );
        console.log('Update response:', response.data);
      } else {
        // Create new contract
        const { _id, ...contractToCreate } = currentContract;
        console.log('Creating contract:', contractToCreate);
        const response = await axios.post(
          getApiUrl(API_CONFIG.ENDPOINTS.CONTRACTS),
          contractToCreate
        );
        console.log('Create response:', response.data);
      }

      await fetchContracts();
      await fetchStats();
      setSnackbar({
        open: true,
        message: `Contract ${currentContract._id ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
      handleCloseDialog();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      console.error('Error saving contract:', axiosError);
      console.error('Error details:', axiosError.response?.data);
      setSnackbar({
        open: true,
        message: axiosError.response?.data?.message || `Failed to ${currentContract._id ? 'update' : 'create'} contract`,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (contractId: string, newStatus: string) => {
    try {
      await axios.patch(
        getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${contractId}/status`),
        { status: newStatus }
      );
      await fetchContracts();
      await fetchStats();
      setSnackbar({
        open: true,
        message: 'Contract status updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating contract status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update contract status',
        severity: 'error'
      });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!currentContract.companyName) errors.companyName = 'Company name is required';
    if (!currentContract.tradeLicenseNo) errors.tradeLicenseNo = 'Trade license number is required';
    if (!currentContract.contractType) errors.contractType = 'Contract type is required';
    if (!currentContract.startDate) errors.startDate = 'Start date is required';
    if (!currentContract.endDate) errors.endDate = 'End date is required';
    if (currentContract.value <= 0) errors.value = 'Value must be greater than 0';
    if (!currentContract.contactPerson) errors.contactPerson = 'Contact person is required';
    if (!currentContract.contactEmail) errors.contactEmail = 'Contact email is required';
    if (!currentContract.contactPhone) errors.contactPhone = 'Contact phone is required';
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (currentContract.contactEmail && !emailRegex.test(currentContract.contactEmail)) {
      errors.contactEmail = 'Invalid email format';
    }
    
    // Validate dates
    if (moment(currentContract.endDate).isBefore(currentContract.startDate)) {
      errors.endDate = 'End date must be after start date';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setCurrentContract(prev => ({
        ...prev,
        [name]: name === 'value' ? Number(value) : value,
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setCurrentContract({
      ...currentContract,
      [name]: value,
    });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'expired':
        return 'error';
      case 'pending':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const renderContractForm = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!formErrors.companyName}>
          <InputLabel>Company</InputLabel>
          <Select
            name="companyName"
            value={currentContract.companyName}
            onChange={handleSelectChange}
            label="Company"
            required
          >
            {companies.map((company) => (
              <MenuItem key={company} value={company}>
                {company}
              </MenuItem>
            ))}
          </Select>
          {formErrors.companyName && (
            <Typography variant="caption" color="error">
              {formErrors.companyName}
            </Typography>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Trade License No"
          name="tradeLicenseNo"
          value={currentContract.tradeLicenseNo}
          onChange={handleInputChange}
          error={!!formErrors.tradeLicenseNo}
          helperText={formErrors.tradeLicenseNo}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Contract Type"
          name="contractType"
          value={currentContract.contractType}
          onChange={handleInputChange}
          error={!!formErrors.contractType}
          helperText={formErrors.contractType}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={currentContract.status}
            onChange={handleSelectChange}
            label="Status"
          >
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Start Date"
          name="startDate"
          type="date"
          value={currentContract.startDate}
          onChange={handleInputChange}
          InputLabelProps={{ shrink: true }}
          error={!!formErrors.startDate}
          helperText={formErrors.startDate}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="End Date"
          name="endDate"
          type="date"
          value={currentContract.endDate}
          onChange={handleInputChange}
          InputLabelProps={{ shrink: true }}
          error={!!formErrors.endDate}
          helperText={formErrors.endDate}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Value"
          name="value"
          type="number"
          value={currentContract.value}
          onChange={handleInputChange}
          error={!!formErrors.value}
          helperText={formErrors.value}
          required
          InputProps={{ inputProps: { min: 0, step: 0.01 } }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Contact Person"
          name="contactPerson"
          value={currentContract.contactPerson}
          onChange={handleInputChange}
          error={!!formErrors.contactPerson}
          helperText={formErrors.contactPerson}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Contact Email"
          name="contactEmail"
          type="email"
          value={currentContract.contactEmail}
          onChange={handleInputChange}
          error={!!formErrors.contactEmail}
          helperText={formErrors.contactEmail}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Contact Phone"
          name="contactPhone"
          value={currentContract.contactPhone}
          onChange={handleInputChange}
          error={!!formErrors.contactPhone}
          helperText={formErrors.contactPhone}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Notes"
          name="notes"
          multiline
          rows={3}
          value={currentContract.notes}
          onChange={handleInputChange}
        />
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Contract Management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Total Contracts</Typography>
            <Typography variant="h4">{stats?.totalContracts || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Active Contracts</Typography>
            <Typography variant="h4">{stats?.activeContracts || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Expiring Soon</Typography>
            <Typography variant="h4">{stats?.expiringContracts || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Total Value</Typography>
            <Typography variant="h4">${(stats?.totalValue || 0).toFixed(2)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Expiring Contracts Section */}
      {expiringContracts.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Contracts Expiring in 30 Days
          </Typography>
          <Grid container spacing={2}>
            {expiringContracts.map((contract) => (
              <Grid item xs={12} sm={6} md={4} key={contract._id}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1">{contract.companyName}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Expires: {moment(contract.endDate).format('MMMM D, YYYY')}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={contract.status}
                      color={getStatusColor(contract.status) as any}
                      size="small"
                    />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Contracts Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Contract List
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleAddContract}
          >
            Add Contract
          </Button>
        </Box>

        {isLoading ? (
          <LinearProgress />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Company</TableCell>
                  <TableCell>Contract Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract._id}>
                    <TableCell>{contract.companyName}</TableCell>
                    <TableCell>{contract.contractType}</TableCell>
                    <TableCell>{moment(contract.startDate).format('YYYY-MM-DD')}</TableCell>
                    <TableCell>{moment(contract.endDate).format('YYYY-MM-DD')}</TableCell>
                    <TableCell>${contract.value.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={contract.status}
                        color={getStatusColor(contract.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEditContract(contract)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteConfirm(contract._id || '')}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {currentContract._id ? 'Edit Contract' : 'Add New Contract'}
            </Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseDialog} aria-label="close">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderContractForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveContract} variant="contained" color="primary">
            {currentContract._id ? 'Save Changes' : 'Add Contract'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this contract? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteContract} color="error" variant="contained">
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

export default ContractManagement; 