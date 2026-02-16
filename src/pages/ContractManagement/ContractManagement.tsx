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
  Card,
  CardContent,
  useTheme,
  CircularProgress,
  Tooltip,
  Avatar,
  Divider,
  TablePagination
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
  Autorenew as AutorenewIcon,
  MoreVert as MoreVertIcon,
  MonetizationOn as MonetizationOnIcon,
  Visibility as ViewIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  DirectionsCar as DirectionsCarIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import axios, { AxiosError } from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/api';
import moment from 'moment';
import ContractTemplateEditor, { Vehicle as EditorVehicle } from '../../components/ContractTemplate/ContractTemplateEditor';
import { Contract } from '../../types';
import TableToolbar from '../../components/TableToolbar';

const CONTRACT_STATUSES = [
  'Active',
  'Expired',
  'Terminated',
  'Draft',
  'Pending',
  'Suspended'
] as const;

type ContractStatus = (typeof CONTRACT_STATUSES)[number];

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

interface ContractFormData extends Omit<Contract, '_id'> {
  _id?: string;
  content?: string;
  templateId?: string;
}

interface Vehicle {
  _id: string;
  licensePlate: string;
  make: string;
  model: string;
}

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  totalValue: number;
  averageValue: number;
}

interface Template {
  _id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface RenewalData {
  startDate: Date;
  endDate: Date;
  value: number;
  previousContractId?: string;
}

const emptyContract: ContractFormData = {
  companyName: '',
  vehicleId: '',
  tradeLicenseNo: '',
  contractType: '',
  startDate: moment().format('YYYY-MM-DD'),
  endDate: moment().add(1, 'year').format('YYYY-MM-DD'),
  value: 0,
  status: 'Draft',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  notes: '',
  content: '',
  templateId: ''
};

const calculateStats = (contracts: ContractFormData[]): ContractStats => {
  const now = moment();
  const thirtyDaysFromNow = moment().add(30, 'days');

  const stats: ContractStats = {
    totalContracts: contracts.length,
    activeContracts: contracts.filter(contract => 
      contract.status === 'Active' && 
      moment(contract.endDate).isAfter(now)
    ).length,
    expiringContracts: contracts.filter(contract => 
      contract.status === 'Active' && 
      moment(contract.endDate).isBetween(now, thirtyDaysFromNow)
    ).length,
    totalValue: contracts.reduce((sum, contract) => sum + Number(contract.value), 0),
    averageValue: 0
  };

  stats.averageValue = stats.totalContracts > 0 ? stats.totalValue / stats.totalContracts : 0;
  return stats;
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, icon, color }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ my: 1, color: color }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: color + '15', p: 1, borderRadius: 2 }}>
            {React.cloneElement(icon as React.ReactElement, { sx: { color: color } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const ContractManagement: React.FC = () => {
  const theme = useTheme();
  const [contracts, setContracts] = useState<ContractFormData[]>([]);
  const [currentContract, setCurrentContract] = useState<ContractFormData>(emptyContract);
  const [statuses] = useState<ContractStatus[]>([...CONTRACT_STATUSES]);
  const [stats, setStats] = useState<ContractStats>({
    totalContracts: 0,
    activeContracts: 0,
    expiringContracts: 0,
    totalValue: 0,
    averageValue: 0
  });
  const [expiringContracts, setExpiringContracts] = useState<ContractFormData[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('startDate');
  const [vehicles, setVehicles] = useState<EditorVehicle[]>([]);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractFormData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>({
    _id: '1',
    name: 'Default Contract Template',
    content: defaultTemplateContent,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [isTemplateListOpen, setIsTemplateListOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const fetchContracts = async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.CONTRACTS));
      const contractsData = response.data;
      
      // Sort contracts: Terminated status goes to the end
      const sortedContracts = contractsData.sort((a: ContractFormData, b: ContractFormData) => {
        if (a.status === 'Terminated' && b.status !== 'Terminated') return 1;
        if (a.status !== 'Terminated' && b.status === 'Terminated') return -1;
        return 0;
      });
      
      setContracts(sortedContracts);
      
      // Calculate stats from contracts data
      const calculatedStats = calculateStats(contractsData);
      setStats(calculatedStats);
      
      // Calculate expiring contracts
      const now = moment();
      const thirtyDaysFromNow = moment().add(30, 'days');
      const expiring = contractsData.filter((contract: ContractFormData) => 
        contract.status === 'Active' && 
        moment(contract.endDate).isBetween(now, thirtyDaysFromNow)
      );
      setExpiringContracts(expiring);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch contracts',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch contract statistics
        const statsResponse = await axios.get<ApiResponse<ContractStats>>(
          getApiUrl('/api/dashboard/contracts/stats')
        );

        if (statsResponse.data.status === 'success' && statsResponse.data.data) {
          const contractStats = statsResponse.data.data;
          setStats({
            totalContracts: contractStats.totalContracts || 0,
            activeContracts: contractStats.activeContracts || 0,
            expiringContracts:  0,
            totalValue: contractStats.totalValue || 0,
            averageValue: contractStats.totalValue ? (contractStats.totalValue / (contractStats.totalContracts || 1)) : 0
          });
        }

        // Fetch contracts list
        await fetchContracts();

      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to fetch data',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddContract = () => {
    setCurrentContract(emptyContract);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleEditContract = async (contract: ContractFormData) => {
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

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!currentContract.companyName) errors.companyName = 'Company name is required';
    if (!currentContract.vehicleId) errors.vehicleId = 'Vehicle is required';
    if (!currentContract.tradeLicenseNo) errors.tradeLicenseNo = 'Trade license number is required';
    if (!currentContract.contractType) errors.contractType = 'Contract type is required';
    if (!currentContract.startDate) errors.startDate = 'Start date is required';
    if (!currentContract.endDate) errors.endDate = 'End date is required';
    if (currentContract.value <= 0) errors.value = 'Value must be greater than 0';
    if (!currentContract.contactPerson) errors.contactPerson = 'Contact person is required';
    if (!currentContract.contactPhone) errors.contactPhone = 'Contact phone is required';
    
    if (currentContract.contactEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(currentContract.contactEmail)) {
        errors.contactEmail = 'Invalid email format';
      }
    }
    
    if (moment(currentContract.endDate).isBefore(currentContract.startDate)) {
      errors.endDate = 'End date must be after start date';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveContract = async (content?: string) => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (currentContract._id) {
        const { _id, ...contractToUpdate } = currentContract;
        await axios.put(
          getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${_id}`),
          {
            ...contractToUpdate,
            content: content || contractToUpdate.content
          }
        );
      } else {
        const { _id, ...contractToCreate } = currentContract;
        await axios.post(
          getApiUrl(API_CONFIG.ENDPOINTS.CONTRACTS),
          {
            ...contractToCreate,
            content: content || contractToCreate.content
          }
        );
      }

      await fetchContracts();
      setSnackbar({
        open: true,
        message: `Contract ${currentContract._id ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
      handleCloseDialog();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      console.error('Error saving contract:', axiosError);
      setSnackbar({
        open: true,
        message: axiosError.response?.data?.message || `Failed to ${currentContract._id ? 'update' : 'create'} contract`,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
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
    setCurrentContract(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'expired':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleGenerateDocument = (contract: ContractFormData) => {
    setSelectedContract(contract);
    setTemplateEditorOpen(true);
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.CONTRACT_TEMPLATES), {
        name: newTemplateName,
        content: defaultTemplateContent,
      });
      setTemplates([...templates, response.data]);
      setNewTemplateName('');
      setIsNewTemplateDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Template created successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to create template:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create template',
        severity: 'error'
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await axios.delete(getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACT_TEMPLATES}/${templateId}`));
      setTemplates(templates.filter(t => t._id !== templateId));
      setSnackbar({
        open: true,
        message: 'Template deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to delete template:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete template',
        severity: 'error'
      });
    }
  };

  const handleCreateContractFromTemplate = (template: Template) => {
    const newContract: ContractFormData = {
      ...emptyContract,
      content: template.content,
      templateId: template._id,
      status: 'Draft'
    };
    setCurrentContract(newContract);
    setOpenDialog(true);
    setIsTemplateListOpen(false);
  };

  const handleContractRenewal = async (contract: ContractFormData) => {
    try {
      const renewalData: RenewalData = {
        startDate: new Date(contract.startDate),
        endDate: new Date(contract.endDate),
        value: contract.value,
        previousContractId: contract._id
      };
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

  const renderActionsCell = (contract: ContractFormData) => (
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
              setSelectedContract(contract);
              setTemplateEditorOpen(true);
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
          onClick={() => {
            setSelectedContract(contract);
            setTemplateEditorOpen(true);
          }}
        >
          Generate PDF
        </Button>
      </Box>
    </TableCell>
  );

  const renderContractForm = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Company Name"
          name="companyName"
          value={currentContract.companyName}
          onChange={handleInputChange}
          error={!!formErrors.companyName}
          helperText={formErrors.companyName}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Type"
          name="contractType"
          value={currentContract.contractType}
          onChange={handleInputChange}
          error={!!formErrors.contractType}
          helperText={formErrors.contractType}
          required
        />
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
          label="Start Date"
          name="startDate"
          value={currentContract.startDate}
          onChange={handleInputChange}
          error={!!formErrors.startDate}
          helperText={formErrors.startDate}
          required
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="End Date"
          name="endDate"
          value={currentContract.endDate}
          onChange={handleInputChange}
          error={!!formErrors.endDate}
          helperText={formErrors.endDate}
          required
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="number"
          label="Value"
          name="value"
          value={currentContract.value}
          onChange={handleInputChange}
          error={!!formErrors.value}
          helperText={formErrors.value}
          required
          InputProps={{
            startAdornment: '$'
          }}
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
          value={currentContract.contactEmail}
          onChange={handleInputChange}
          error={!!formErrors.contactEmail}
          helperText={formErrors.contactEmail}
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
          multiline
          rows={4}
          label="Notes"
          name="notes"
          value={currentContract.notes}
          onChange={handleInputChange}
        />
      </Grid>
    </Grid>
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
        contract.contactEmail?.toLowerCase().includes(query) ||
        contract.contactPhone?.toLowerCase().includes(query) ||
        contract.status?.toLowerCase().includes(query) ||
        contract.tradeLicenseNo?.toLowerCase().includes(query) ||
        contract.contractType?.toLowerCase().includes(query) ||
        contract.notes?.toLowerCase().includes(query)
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Add Company / Contract</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleAddContract()}
        >
          Add Contract
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Contract Statistics */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Contracts"
            value={isLoading ? "..." : stats.totalContracts}
            icon={<DescriptionIcon />}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Contracts"
            value={isLoading ? "..." : stats.activeContracts}
            icon={<CheckCircleIcon />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expiring Soon"
            value={isLoading ? "..." : stats.expiringContracts}
            icon={<WarningIcon />}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Value"
            value={isLoading ? "..." : `AED ${stats.totalValue.toLocaleString()}`}
            icon={<MonetizationOnIcon />}
            color={theme.palette.primary.main}
          />
        </Grid>

        {/* Expiring Contracts Section */}
        {expiringContracts.length > 0 && (
          <Grid item xs={12}>
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
                          color={getStatusColor(contract.status)}
                          size="small"
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Contracts Table */}
        <Grid item xs={12}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Recent Contracts</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FileCopyIcon />}
                  onClick={() => setIsTemplateListOpen(true)}
                >
                  Templates
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddContract()}
                >
                  New Contract
                </Button>
              </Box>
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
            <TableContainer sx={{ 
              borderRadius: 3,
              overflowX: 'auto',
              boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
            }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)` }}>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>
                      Contract Details
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>
                      Company
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>
                      Vehicle
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>
                      Duration
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>
                      Value
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>
                      Status
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedContracts.map((contract) => (
                    <TableRow 
                      key={contract._id}
                      sx={{
                        backgroundColor: 'transparent',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        borderLeft: '4px solid transparent',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                          borderLeft: `4px solid ${theme.palette.primary.main}`,
                        },
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ 
                            bgcolor: theme.palette.primary.main,
                            width: 40,
                            height: 40,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            <DescriptionIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 500 }}>
                              {contract.contractType}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ID: {contract._id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessIcon sx={{ color: theme.palette.secondary.main }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {contract.companyName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DirectionsCarIcon sx={{ color: theme.palette.info.main }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {vehicles.find(v => v._id === contract.vehicleId)?.licensePlate || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon sx={{ color: theme.palette.warning.main }} />
                          <Box>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                              {moment(contract.startDate).format('MMM DD, YYYY')} - {moment(contract.endDate).format('MMM DD, YYYY')}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: moment(contract.endDate).diff(moment(), 'days') < 30 
                                  ? theme.palette.error.main 
                                  : theme.palette.success.main,
                                fontWeight: 500
                              }}
                            >
                              {moment(contract.endDate).diff(moment(), 'days')} days remaining
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MonetizationOnIcon sx={{ color: theme.palette.success.main }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                            AED {contract.value.toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={contract.status}
                          color={getStatusColor(contract.status)}
                          size="small"
                          sx={{ 
                            minWidth: 100,
                            fontWeight: 500,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="View Details" arrow>
                            <IconButton 
                              size="small" 
                              sx={{ 
                                color: theme.palette.info.main,
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                                '&:hover': { 
                                  backgroundColor: alpha(theme.palette.info.main, 0.2),
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s',
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Contract" arrow>
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditContract(contract)}
                              sx={{ 
                                color: theme.palette.primary.main,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                '&:hover': { 
                                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s',
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Contract" arrow>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteConfirm(contract._id || '')}
                              sx={{ 
                                color: theme.palette.error.main,
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                '&:hover': { 
                                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s',
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider />
            <TablePagination
              component="div"
              count={contracts.length}
              page={0}
              onPageChange={() => {}}
              rowsPerPage={10}
              onRowsPerPageChange={() => {}}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Contract Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedContract ? 'Edit Contract' : 'Add New Contract'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {renderContractForm()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            {selectedContract ? 'Update' : 'Add'}
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

      {/* Template List Dialog */}
      <Dialog
        open={isTemplateListOpen}
        onClose={() => setIsTemplateListOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Contract Templates
          <IconButton
            onClick={() => setIsTemplateListOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setIsNewTemplateDialogOpen(true)}
            >
              New Template
            </Button>
          </Box>
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} key={template._id}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{template.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Last updated: {moment(template.updatedAt).format('MMMM D, YYYY')}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        onClick={() => {
                          setSelectedTemplate(template);
                          setTemplateEditorOpen(true);
                          setIsTemplateListOpen(false);
                        }}
                        title="Edit Template"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleCreateContractFromTemplate(template)}
                        title="Create Contract from Template"
                        color="primary"
                        sx={{ mx: 1 }}
                      >
                        <FileCopyIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteTemplate(template._id)}
                        title="Delete Template"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* New Template Dialog */}
      <Dialog
        open={isNewTemplateDialogOpen}
        onClose={() => setIsNewTemplateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Template</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Template Name"
            fullWidth
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewTemplateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTemplate} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Editor Dialog */}
      {selectedContract && (
        <Dialog open={templateEditorOpen} onClose={() => setTemplateEditorOpen(false)} maxWidth="lg" fullWidth>
          <DialogContent>
            <ContractTemplateEditor
              template={{
                _id: selectedTemplate._id,
                name: selectedTemplate.name,
                content: selectedTemplate.content
              }}
              contract={{
                ...currentContract,
                _id: currentContract._id || undefined
              }}
              vehicles={vehicles}
              onSave={(content: string) => handleSaveContract(content)}
              onClose={() => setTemplateEditorOpen(false)}
              onRenewContract={async (renewalData: RenewalData) => {
                if (selectedContract) {
                  const contractToRenew = {
                    ...selectedContract,
                    startDate: renewalData.startDate.toISOString().split('T')[0],
                    endDate: renewalData.endDate.toISOString().split('T')[0],
                    value: renewalData.value
                  };
                  await handleContractRenewal(contractToRenew);
                }
              }}
              allowEdit={false}
              showPreview={true}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const defaultTemplateContent = `[Company Name]
[Trade License No]

CONTRACT AGREEMENT

This agreement is made on [Start Date] between [Company Name], having Trade License No. [Trade License No] (hereinafter referred to as "the Client") and our company.

Vehicle Details:
Make: [Vehicle Make]
Model: [Vehicle Model]
License Plate: [Vehicle License Plate]

Contract Duration: From [Start Date] to [End Date]
Contract Value: $[Contract Value]

Contact Information:
Contact Person: [Contact Person]
Email: [Contact Email]
Phone: [Contact Phone]

Notes:
[Notes]

6. MAINTENANCE AND REPAIRS

In accordance with the principles of good faith and the obligations inherent in contracts under UAE law, the Parties agree as follows:

a. **Client's Responsibilities (Routine Maintenance):** The Client shall be solely responsible for the cost and logistical arrangement of all routine and preventive maintenance of the Vehicle. This includes, as a minimum, monthly engine oil changes, oil filter changes, air filter changes, tire rotation, and brake inspections, performed in line with the manufacturer's recommended schedule. All maintenance must be performed at a reputable garage using parts and lubricants that meet the manufacturer's specifications.

b. **Client's Responsibilities (Operational Costs):** The Client remains responsible for all costs related to the day-to-day operation of the Vehicle, including but not limited to fuel, Salik tolls, tire replacements due to wear, and daily cleaning.

c. **Company's Responsibilities (Major Repairs):** The Company shall be responsible for all major mechanical and structural repairs necessitated by normal wear and tear or latent defects. This includes, but is not limited to, repairs to the engine block, transmission, drive train, and chassis, provided such issues are not a result of the Client's misuse or failure to perform routine maintenance.

d. **Reporting and Authorization:** The Client must immediately notify the Company in writing of any defect, malfunction, or damage to the Vehicle. For any non-routine repairs, the Company must provide prior written authorization before the Client commissions such repairs. Unauthorized repair costs will not be reimbursed.

e. **Negligence and Misuse:** The Client shall be fully liable for the cost of all repairs resulting from its negligence, misuse, improper maintenance, failure to adhere to the maintenance schedule, or involvement in an accident where the Client's driver is at fault. The Company may recover these costs from the Client.

f. **Records:** The Client shall maintain complete and accurate records of all maintenance and repairs performed on the Vehicle and make them available for inspection by the Company upon request.

Terms and Conditions:
1. The contract duration is specified above and may be renewed upon mutual agreement.
2. The contract value is to be paid according to the agreed payment schedule.
3. Any modifications to this contract must be made in writing and agreed upon by both parties.

For [Company Name]:
_______________________
Authorized Signatory
Date: [Current Date]

For Our Company:
_______________________
Authorized Signatory
Date: [Current Date]`;

export default ContractManagement; 