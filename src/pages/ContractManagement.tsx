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
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  FileCopy as FileCopyIcon,
  Autorenew as AutorenewIcon
} from '@mui/icons-material';
import axios, { AxiosError } from 'axios';
import { API_CONFIG, getApiUrl } from '../config/api';
import moment from 'moment';
import ContractTemplateEditor, { Vehicle as EditorVehicle } from '../components/ContractTemplate/ContractTemplateEditor';

const CONTRACT_STATUSES = [
  'Active',
  'Pending',
  'Expired',
  'Terminated',
  'Draft',
  'Suspended',
  'Renewed'
] as const;

type ContractStatus = typeof CONTRACT_STATUSES[number];

interface Contract {
  _id?: string;
  companyName: string;
  tradeLicenseNo: string;
  contractType: string;
  startDate: string;
  endDate: string;
  value: number;
  status: ContractStatus;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  vehicleId?: string;
  template?: {
    content: string;
    letterhead?: {
      logo?: string;
      companyInfo?: string;
    };
  };
}

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  totalValue: number;
  averageValue: number;
  contractsByStatus: Record<string, number>;
}

const emptyContract: Partial<Contract> = {
  companyName: '',
  tradeLicenseNo: '',
  contractType: '',
  startDate: '',
  endDate: '',
  value: 0,
  status: 'Draft',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  notes: '',
  vehicleId: '',
};

const ContractManagement: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [currentContract, setCurrentContract] = useState<Contract>(emptyContract as Contract);
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
  const [vehicles, setVehicles] = useState<EditorVehicle[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    _id: string;
    name: string;
    content: string;
  }>({
    _id: 'default',
    name: 'Default Template',
    content: ''
  });

  useEffect(() => {
    fetchContracts();
    fetchStats();
    fetchExpiringContracts();
    fetchVehicles();
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

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.VEHICLES));
      const vehiclesData: EditorVehicle[] = response.data.map((v: any) => ({
        _id: v._id,
        licensePlate: v.licensePlate,
        make: v.make,
        model: v.model,
        year: v.year
      }));
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch vehicles',
        severity: 'error'
      });
    }
  };

  const handleAddContract = () => {
    setCurrentContract(emptyContract as Contract);
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
    if (!currentContract.vehicleId) errors.vehicleId = 'Vehicle is required';
    
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

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentContract(prev => ({
      ...prev,
      [name]: name === 'value' ? Number(value) : value
    }));
    // Clear error when field is filled
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setCurrentContract(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is filled
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Expired':
      case 'Terminated':
        return 'error';
      case 'Pending':
      case 'Suspended':
        return 'warning';
      case 'Draft':
      case 'Renewed':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleTemplateClick = async (contract: Contract) => {
    try {
      // First get the latest contract data
      const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${contract._id}`));
      const updatedContract = response.data;
      
      // Store both contract and vehicles data in localStorage for the template editor
      localStorage.setItem('currentContractData', JSON.stringify({
        contract: updatedContract,
        vehicles: vehicles
      }));
      
      // Navigate to template editor with contract data
      window.location.href = `/contracts/template/${contract._id}`;
    } catch (error) {
      console.error('Error fetching contract details:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load contract template',
        severity: 'error'
      });
    }
  };

  const handleContractRenewal = async (contract: Contract) => {
    try {
      // Implement the logic to renew the contract
      // This is a placeholder and should be replaced with the actual implementation
      console.log('Renewing contract:', contract);
      await handleSaveContract();
      setSnackbar({
        open: true,
        message: 'Contract renewed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error renewing contract:', error);
      setSnackbar({
        open: true,
        message: 'Failed to renew contract',
        severity: 'error'
      });
    }
  };

  const renderContractForm = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Company Name"
          name="companyName"
          value={currentContract.companyName}
          onChange={handleTextFieldChange}
          error={!!formErrors.companyName}
          helperText={formErrors.companyName}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth required error={!!formErrors.vehicleId}>
          <InputLabel>Vehicle</InputLabel>
          <Select
            value={currentContract.vehicleId || ''}
            onChange={handleSelectChange}
            name="vehicleId"
            label="Vehicle"
          >
            {vehicles.map((vehicle) => (
              <MenuItem key={vehicle._id} value={vehicle._id}>
                {`${vehicle.licensePlate} | ${vehicle.make} ${vehicle.model} ${vehicle.year}`}
              </MenuItem>
            ))}
          </Select>
          {formErrors.vehicleId && (
            <Typography color="error" variant="caption" sx={{ mt: 1, ml: 2 }}>
              {formErrors.vehicleId}
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
          onChange={handleTextFieldChange}
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
          onChange={handleTextFieldChange}
          error={!!formErrors.contractType}
          helperText={formErrors.contractType}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            name="status"
            value={currentContract.status}
            onChange={handleSelectChange}
            label="Status"
          >
            {CONTRACT_STATUSES.map((status) => (
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
          onChange={handleTextFieldChange}
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
          onChange={handleTextFieldChange}
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
          onChange={handleTextFieldChange}
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
          onChange={handleTextFieldChange}
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
          onChange={handleTextFieldChange}
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
          onChange={handleTextFieldChange}
          error={!!formErrors.contactPhone}
          helperText={formErrors.contactPhone}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Notes"
          name="notes"
          value={currentContract.notes}
          onChange={handleTextFieldChange}
        />
      </Grid>
    </Grid>
  );

  const renderActionsCell = (contract: Contract) => (
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton 
          size="small" 
          onClick={() => handleEditContract(contract)}
          title="Edit Contract"
        >
          <EditIcon />
        </IconButton>
        {contract.status === 'Active' && (
          <IconButton
            size="small"
            color="secondary"
            onClick={() => {
              setCurrentContract(contract);
              setOpenDialog(true);
            }}
            title="Renew Contract"
          >
            <AutorenewIcon />
          </IconButton>
        )}
        <IconButton 
          size="small" 
          onClick={() => handleDeleteConfirm(contract._id || '')}
          title="Delete Contract"
        >
          <DeleteIcon />
        </IconButton>
        <Button
          size="small"
          variant="outlined"
          startIcon={<DescriptionIcon />}
          onClick={() => handleTemplateClick(contract)}
          title="Edit and Generate Contract Template"
        >
          Edit Template
        </Button>
      </Box>
    </TableCell>
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
            startIcon={<AddIcon />}
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
                  <TableCell>Company Name</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Contract Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.map((contract) => {
                  const vehicle = vehicles.find(v => v._id === contract.vehicleId);
                  const vehicleDisplay = contract.vehicleId 
                    ? (vehicle 
                        ? `${vehicle.licensePlate} | ${vehicle.make} ${vehicle.model} ${vehicle.year}` 
                        : 'Vehicle not found')
                    : 'No vehicle assigned';
                    
                  return (
                    <TableRow key={contract._id}>
                      <TableCell>{contract.companyName}</TableCell>
                      <TableCell>{vehicleDisplay}</TableCell>
                      <TableCell>{contract.contractType}</TableCell>
                      <TableCell>
                        {contract.startDate ? new Date(contract.startDate).toLocaleDateString('en-AE', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : ''}
                      </TableCell>
                      <TableCell>
                        {contract.endDate ? new Date(contract.endDate).toLocaleDateString('en-AE', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : ''}
                      </TableCell>
                      <TableCell>{contract.value?.toLocaleString('en-AE') || '0'}</TableCell>
                      <TableCell>
                        <Chip
                          label={contract.status}
                          color={getStatusColor(contract.status)}
                          size="small"
                        />
                      </TableCell>
                      {renderActionsCell(contract)}
                    </TableRow>
                  );
                })}
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
              <CloseIcon />
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

      {selectedContract && (
        <ContractTemplateEditor
          template={selectedTemplate}
          contract={currentContract}
          vehicles={vehicles}
          onSave={handleSaveContract}
          onClose={handleCloseDialog}
          onRenewContract={async (renewalData) => {
            if (selectedContract) {
              await handleContractRenewal(selectedContract);
            }
          }}
          allowEdit={false}
          showPreview={true}
        />
      )}
    </Box>
  );
};

export default ContractManagement; 