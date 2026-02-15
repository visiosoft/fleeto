import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Snackbar,
  LinearProgress,
  Avatar,
  Stack,
  Tooltip,
  useTheme,
  alpha,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  Autorenew as AutorenewIcon,
  Business as BusinessIcon,
  DirectionsCar as DirectionsCarIcon,
  CalendarToday as CalendarIcon,
  MonetizationOn as MoneyIcon,
  Visibility as ViewIcon,
  Gavel as ContractIcon,
  CheckCircle as ActiveIcon,
  Warning as ExpiringIcon,
} from '@mui/icons-material';
import { API_CONFIG, getApiUrl } from '../config/api';
import axios, { AxiosError } from 'axios';
import moment from 'moment';
import ContractTemplateEditor, { Vehicle as EditorVehicle } from '../components/ContractTemplate/ContractTemplateEditor';
import { useNavigate } from 'react-router-dom';
import TableToolbar from '../components/TableToolbar';

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
  const theme = useTheme();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
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
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('startDate');

  useEffect(() => {
    fetchContracts();
    fetchStats();
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
      const response = await axios.get(getApiUrl(`/dashboard/contracts/stats`));
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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
      
      // Navigate to template editor with contract data using React Router
      navigate(`/contracts/template/${contract._id}`);
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
          label="Type"
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
    <TableCell align="center">
      <Stack direction="row" spacing={0.5} justifyContent="center">
        <Tooltip title="Edit Contract">
          <IconButton
            size="small"
            onClick={() => handleEditContract(contract)}
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
        {contract.status === 'Active' && (
          <Tooltip title="Renew Contract">
            <IconButton
              size="small"
              onClick={() => {
                setCurrentContract(contract);
                setOpenDialog(true);
              }}
              sx={{
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s',
              }}
            >
              <AutorenewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Edit and Generate Contract Template">
          <IconButton
            size="small"
            onClick={() => handleTemplateClick(contract)}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s',
            }}
          >
            <DescriptionIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Contract">
          <IconButton
            size="small"
            onClick={() => handleDeleteConfirm(contract._id || '')}
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
  );

  // Sort options
  const sortOptions = [
    { value: 'startDate', label: 'Start Date (Newest)' },
    { value: 'endDate', label: 'End Date' },
    { value: 'companyName', label: 'Company Name (A-Z)' },
    { value: 'status', label: 'Status' },
    { value: 'value', label: 'Contract Value' },
    { value: 'contractType', label: 'Contract Type' },
  ];

  // Filter and sort contracts
  const filteredAndSortedContracts = React.useMemo(() => {
    let filtered = contracts;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = contracts.filter(contract =>
        contract.companyName?.toLowerCase().includes(query) ||
        contract.contactPerson?.toLowerCase().includes(query) ||
        contract.status?.toLowerCase().includes(query) ||
        contract.contractType?.toLowerCase().includes(query) ||
        contract.notes?.toLowerCase().includes(query) ||
        contract.tradeLicenseNo?.toLowerCase().includes(query)
      );
    }
    
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'companyName':
          return (a.companyName || '').localeCompare(b.companyName || '');
        case 'contractType':
          return (a.contractType || '').localeCompare(b.contractType || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'value':
          return (b.value || 0) - (a.value || 0); // Descending
        case 'endDate':
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case 'startDate':
        default:
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime(); // Newest first
      }
    });
    
    return sorted;
  }, [contracts, searchQuery, sortBy]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Add Company / Contract
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: `0 4px 20px ${alpha(theme.palette.info.main, 0.15)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              overflow: 'hidden',
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: `0 12px 28px ${alpha(theme.palette.info.main, 0.25)}`,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontSize: '0.7rem',
                      mb: 1,
                    }}
                  >
                    Total Contracts
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: theme.palette.info.main,
                    }}
                  >
                    {stats?.totalContracts || 0}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    width: 44, 
                    height: 44,
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.info.main, 0.4)}`,
                  }}
                >
                  <ContractIcon sx={{ fontSize: 22, color: 'white' }} />
                </Avatar>
              </Box>
              <Box 
                sx={{ 
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  overflow: 'hidden',
                }}
              >
                <Box 
                  sx={{ 
                    height: '100%',
                    width: '100%',
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.15)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
              overflow: 'hidden',
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: `0 12px 28px ${alpha(theme.palette.success.main, 0.25)}`,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontSize: '0.7rem',
                      mb: 1,
                    }}
                  >
                    Active Contracts
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: theme.palette.success.main,
                    }}
                  >
                    {stats?.activeContracts || 0}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    width: 44, 
                    height: 44,
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.4)}`,
                  }}
                >
                  <ActiveIcon sx={{ fontSize: 22, color: 'white' }} />
                </Avatar>
              </Box>
              <Box 
                sx={{ 
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  overflow: 'hidden',
                }}
              >
                <Box 
                  sx={{ 
                    height: '100%',
                    width: stats?.totalContracts ? `${(stats.activeContracts / stats.totalContracts) * 100}%` : '0%',
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                    transition: 'width 1s ease-in-out',
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: `0 4px 20px ${alpha(theme.palette.warning.main, 0.15)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
              overflow: 'hidden',
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: `0 12px 28px ${alpha(theme.palette.warning.main, 0.25)}`,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontSize: '0.7rem',
                      mb: 1,
                    }}
                  >
                    Expiring Soon
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: theme.palette.warning.main,
                    }}
                  >
                    {stats?.expiringContracts || 0}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    width: 44, 
                    height: 44,
                    background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.warning.main, 0.4)}`,
                  }}
                >
                  <ExpiringIcon sx={{ fontSize: 22, color: 'white' }} />
                </Avatar>
              </Box>
              <Box 
                sx={{ 
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.warning.main, 0.1),
                  overflow: 'hidden',
                }}
              >
                <Box 
                  sx={{ 
                    height: '100%',
                    width: stats?.totalContracts ? `${(stats.expiringContracts / stats.totalContracts) * 100}%` : '0%',
                    background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                    transition: 'width 1s ease-in-out',
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              overflow: 'hidden',
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.25)}`,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontSize: '0.7rem',
                      mb: 1,
                    }}
                  >
                    Total Value
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: theme.palette.primary.main,
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 0.5,
                    }}
                  >
                    <Typography 
                      component="span" 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      AED
                    </Typography>
                    {(stats?.totalValue || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    width: 44, 
                    height: 44,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                  }}
                >
                  <MoneyIcon sx={{ fontSize: 22, color: 'white' }} />
                </Avatar>
              </Box>
              <Box 
                sx={{ 
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  overflow: 'hidden',
                }}
              >
                <Box 
                  sx={{ 
                    height: '100%',
                    width: '100%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
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

        <TableToolbar
          searchValue={searchQuery}
          onSearchChange={(value) => setSearchQuery(value)}
          sortValue={sortBy}
          onSortChange={(value) => setSortBy(value)}
          sortOptions={sortOptions}
          searchPlaceholder="Search contracts..."
          sortLabel="Sort By"
        />

        {isLoading ? (
          <LinearProgress />
        ) : (
          <TableContainer sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)` }}>
                  <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Contract Info</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Vehicle</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Value</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedContracts.map((contract) => {
                  const vehicle = vehicles.find(v => v._id === contract.vehicleId);
                  const vehicleDisplay = contract.vehicleId 
                    ? (vehicle 
                        ? `${vehicle.licensePlate} | ${vehicle.make} ${vehicle.model} ${vehicle.year}` 
                        : 'Vehicle not found')
                    : 'No vehicle assigned';
                    
                  return (
                    <TableRow 
                      key={contract._id}
                      onMouseEnter={() => setHoveredRow(contract._id || null)}
                      onMouseLeave={() => setHoveredRow(null)}
                      sx={{
                        backgroundColor: hoveredRow === contract._id 
                          ? alpha(theme.palette.primary.main, 0.04)
                          : 'transparent',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: hoveredRow === contract._id ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: hoveredRow === contract._id 
                          ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                          : 'none',
                        borderLeft: hoveredRow === contract._id 
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
                              <DescriptionIcon sx={{ fontSize: 20 }} />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>
                                {contract.companyName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {contract.contractType}
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DirectionsCarIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />
                          <Typography variant="body2">{vehicleDisplay}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                            <Typography variant="caption" color="text.secondary">
                              Start: {contract.startDate ? new Date(contract.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: 14, color: theme.palette.error.main }} />
                            <Typography variant="caption" color="text.secondary">
                              End: {contract.endDate ? new Date(contract.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MoneyIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                          <Typography variant="body2" fontWeight={700} color="success.main">
                            AED {contract.value?.toLocaleString('en-AE') || '0'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={contract.status}
                          color={getStatusColor(contract.status)}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            letterSpacing: '0.5px',
                          }}
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