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
  LinearProgress
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
import { API_CONFIG, getApiUrl } from '../../config/api';
import moment from 'moment';
import ContractTemplateEditor, { Vehicle as EditorVehicle } from '../../components/ContractTemplate/ContractTemplateEditor';
import { Contract } from '../../types';

const CONTRACT_STATUSES = [
  'Active',
  'Expired',
  'Terminated',
  'Draft',
  'Pending',
  'Suspended'
] as const;

type ContractStatus = (typeof CONTRACT_STATUSES)[number];

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

const ContractManagement: React.FC = () => {
  const [contracts, setContracts] = useState<ContractFormData[]>([]);
  const [currentContract, setCurrentContract] = useState<ContractFormData>(emptyContract);
  const [companies, setCompanies] = useState<string[]>([]);
  const [statuses] = useState<ContractStatus[]>([...CONTRACT_STATUSES]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [expiringContracts, setExpiringContracts] = useState<ContractFormData[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
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

  useEffect(() => {
    fetchContracts();
    fetchCompanies();
    fetchVehicles();
    fetchExpiringContracts();
    fetchTemplates();
  }, []);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.CONTRACTS));
      setContracts(response.data);
      const calculatedStats = calculateStats(response.data);
      setStats(calculatedStats);
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

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.CONTRACT_TEMPLATES));
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch templates',
        severity: 'error'
      });
    }
  };

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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Contract Management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" gutterBottom>Total Contracts</Typography>
            </Box>
            <Typography variant="h4">{stats?.totalContracts || 0}</Typography>
            <Typography variant="body2" color="textSecondary">
              All Time
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" gutterBottom>Active Contracts</Typography>
            </Box>
            <Typography variant="h4">{stats?.activeContracts || 0}</Typography>
            <Typography variant="body2" color="textSecondary">
              Currently Active
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" gutterBottom>Expiring Soon</Typography>
            </Box>
            <Typography variant="h4">{stats?.expiringContracts || 0}</Typography>
            <Typography variant="body2" color="textSecondary">
              Next 30 Days
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" gutterBottom>Total Value</Typography>
            </Box>
            <Typography variant="h4">${(stats?.totalValue || 0).toFixed(2)}</Typography>
            <Typography variant="body2" color="textSecondary">
              Average: ${(stats?.averageValue || 0).toFixed(2)}
            </Typography>
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
                      color={getStatusColor(contract.status)}
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setIsTemplateListOpen(true)}
              startIcon={<DescriptionIcon />}
            >
              Contract Templates
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddContract}
            >
              Add Contract
            </Button>
          </Box>
        </Box>

        {isLoading ? (
          <LinearProgress />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Company</TableCell>
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
                {contracts.map((contract) => (
                  <TableRow key={contract._id}>
                    <TableCell>{contract.companyName}</TableCell>
                    <TableCell>
                      {vehicles.find(v => v._id === contract.vehicleId)?.licensePlate || 'N/A'}
                    </TableCell>
                    <TableCell>{contract.contractType}</TableCell>
                    <TableCell>{moment(contract.startDate).format('YYYY-MM-DD')}</TableCell>
                    <TableCell>{moment(contract.endDate).format('YYYY-MM-DD')}</TableCell>
                    <TableCell>${contract.value.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={contract.status}
                        color={getStatusColor(contract.status)}
                        size="small"
                      />
                    </TableCell>
                    {renderActionsCell(contract)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Contract Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentContract._id ? 'Edit Contract' : 'Add Contract'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {renderContractForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={() => handleSaveContract(undefined)} variant="contained" color="primary">
            {currentContract._id ? 'Update' : 'Create'}
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
                content: selectedTemplate.content || defaultTemplateContent
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