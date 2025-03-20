import React, { useState, useRef } from 'react';
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
  Description, 
  BusinessCenter, 
  DateRange, 
  Warning,
  Add,
  Edit,
  Delete,
  Close,
  Upload,
  AttachFile,
  AttachMoney,
} from '@mui/icons-material';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';

// Define Contract interface
interface Contract {
  id: number;
  company: string;
  vehicle: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: 'Active' | 'Pending' | 'Expired' | 'Terminated';
  description: string;
  documents: ContractDocument[];
  notes?: string;
}

// Define ContractDocument interface
interface ContractDocument {
  id: number;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  path: string;
}

// Mock data for contract status distribution
const contractStatusData = [
  {
    id: 'Active',
    label: 'Active',
    value: 60,
    color: 'hsl(120, 70%, 50%)'
  },
  {
    id: 'Pending',
    label: 'Pending',
    value: 20,
    color: 'hsl(45, 70%, 50%)'
  },
  {
    id: 'Expired',
    label: 'Expired',
    value: 15,
    color: 'hsl(0, 70%, 50%)'
  },
  {
    id: 'Terminated',
    label: 'Terminated',
    value: 5,
    color: 'hsl(270, 70%, 50%)'
  }
];

// Mock data for contract values over time
const contractValueData = [
  {
    id: 'contractValue',
    color: 'hsl(240, 70%, 50%)',
    data: [
      { x: 'Jan', y: 4500 },
      { x: 'Feb', y: 5000 },
      { x: 'Mar', y: 6200 },
      { x: 'Apr', y: 5800 },
      { x: 'May', y: 6500 },
      { x: 'Jun', y: 7000 }
    ]
  }
];

// Mock data for initial contracts
const initialContracts: Contract[] = [
  {
    id: 1,
    company: 'ABC Logistics',
    vehicle: 'Truck 001',
    startDate: '2024-01-15',
    endDate: '2024-07-15',
    amount: 1200,
    status: 'Active',
    description: 'Delivery services contract',
    documents: [
      {
        id: 1,
        name: 'ABC_Logistics_Contract.pdf',
        type: 'application/pdf',
        size: 2500000,
        uploadDate: '2024-01-15',
        path: '/contracts/ABC_Logistics_Contract.pdf'
      }
    ],
    notes: 'Monthly payment schedule'
  },
  {
    id: 2,
    company: 'XYZ Transport',
    vehicle: 'Van 002',
    startDate: '2024-02-01',
    endDate: '2024-05-01',
    amount: 850,
    status: 'Active',
    description: 'City transport services',
    documents: [
      {
        id: 2,
        name: 'XYZ_Transport_Agreement.pdf',
        type: 'application/pdf',
        size: 1800000,
        uploadDate: '2024-02-01',
        path: '/contracts/XYZ_Transport_Agreement.pdf'
      }
    ]
  },
  {
    id: 3,
    company: 'QuickShip Inc',
    vehicle: 'Van 003',
    startDate: '2024-03-01',
    endDate: '2024-04-01',
    amount: 600,
    status: 'Pending',
    description: 'Short-term logistics support',
    documents: []
  },
  {
    id: 4,
    company: 'Metro Delivery',
    vehicle: 'Truck 002',
    startDate: '2023-10-15',
    endDate: '2024-01-15',
    amount: 1500,
    status: 'Expired',
    description: 'Heavy goods transport',
    documents: [
      {
        id: 3,
        name: 'Metro_Delivery_Contract.pdf',
        type: 'application/pdf',
        size: 3200000,
        uploadDate: '2023-10-15',
        path: '/contracts/Metro_Delivery_Contract.pdf'
      }
    ]
  }
];

// Empty contract template
const emptyContract: Contract = {
  id: 0,
  company: '',
  vehicle: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  amount: 0,
  status: 'Pending',
  description: '',
  documents: [],
  notes: ''
};

const ContractManagement: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [currentContract, setCurrentContract] = useState<Contract>(emptyContract);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<number>(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate stats from contracts
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(contract => contract.status === 'Active').length;
  const totalContractValue = contracts
    .filter(contract => contract.status === 'Active')
    .reduce((sum, contract) => sum + contract.amount, 0);
  const expiringContracts = contracts.filter(contract => {
    if (contract.status !== 'Active') return false;
    const endDate = new Date(contract.endDate);
    const today = new Date();
    const daysDiff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30;
  }).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Expired':
        return 'error';
      case 'Terminated':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleAddContract = () => {
    setCurrentContract({ ...emptyContract });
    setFormErrors({});
    setOpenAddDialog(true);
  };

  const handleEditContract = (contract: Contract) => {
    setCurrentContract({ ...contract });
    setFormErrors({});
    setOpenEditDialog(true);
  };

  const handleDeleteConfirm = (id: number) => {
    setContractToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteContract = () => {
    setContracts(contracts.filter(contract => contract.id !== contractToDelete));
    setDeleteConfirmOpen(false);
    setSnackbar({
      open: true,
      message: 'Contract deleted successfully',
      severity: 'success',
    });
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
    setUploadProgress(0);
    setUploading(false);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!currentContract.company.trim()) errors.company = 'Company is required';
    if (!currentContract.vehicle.trim()) errors.vehicle = 'Vehicle is required';
    if (!currentContract.startDate) errors.startDate = 'Start date is required';
    if (!currentContract.endDate) errors.endDate = 'End date is required';
    if (currentContract.amount <= 0) errors.amount = 'Amount must be greater than 0';
    if (!currentContract.description.trim()) errors.description = 'Description is required';
    
    // Check if end date is after start date
    if (currentContract.startDate && currentContract.endDate) {
      const startDate = new Date(currentContract.startDate);
      const endDate = new Date(currentContract.endDate);
      if (endDate <= startDate) {
        errors.endDate = 'End date must be after start date';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setCurrentContract({
        ...currentContract,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setCurrentContract({
      ...currentContract,
      [name]: value,
    });
  };

  const handleSaveContract = () => {
    if (!validateForm()) return;
    
    if (openAddDialog) {
      // Add new contract
      const newContract = {
        ...currentContract,
        id: Math.max(...contracts.map(contract => contract.id), 0) + 1,
      };
      setContracts([...contracts, newContract]);
      setSnackbar({
        open: true,
        message: 'Contract added successfully',
        severity: 'success',
      });
    } else {
      // Update existing contract
      setContracts(contracts.map(contract => 
        contract.id === currentContract.id ? currentContract : contract
      ));
      setSnackbar({
        open: true,
        message: 'Contract updated successfully',
        severity: 'success',
      });
    }
    
    handleCloseDialog();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setUploading(true);
    
    // Simulate file upload with progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setUploading(false);
        
        // Add document to the current contract
        const newDocument: ContractDocument = {
          id: Math.max(...currentContract.documents.map(doc => doc.id), 0) + 1,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadDate: new Date().toISOString().split('T')[0],
          path: `/contracts/${file.name}`
        };
        
        setCurrentContract({
          ...currentContract,
          documents: [...currentContract.documents, newDocument]
        });
        
        setSnackbar({
          open: true,
          message: 'Document uploaded successfully',
          severity: 'success',
        });
      }
    }, 100);
  };

  const handleRemoveDocument = (documentId: number) => {
    setCurrentContract({
      ...currentContract,
      documents: currentContract.documents.filter(doc => doc.id !== documentId)
    });
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderContractForm = () => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Company"
            name="company"
            value={currentContract.company}
            onChange={handleInputChange}
            error={!!formErrors.company}
            helperText={formErrors.company}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Vehicle"
            name="vehicle"
            value={currentContract.vehicle}
            onChange={handleInputChange}
            error={!!formErrors.vehicle}
            helperText={formErrors.vehicle}
            required
          />
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
            label="Amount ($)"
            name="amount"
            type="number"
            value={currentContract.amount}
            onChange={handleInputChange}
            error={!!formErrors.amount}
            helperText={formErrors.amount}
            required
            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
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
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Expired">Expired</MenuItem>
              <MenuItem value="Terminated">Terminated</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={currentContract.description}
            onChange={handleInputChange}
            error={!!formErrors.description}
            helperText={formErrors.description}
            required
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            name="notes"
            value={currentContract.notes || ''}
            onChange={handleInputChange}
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Documents
          </Typography>
          <Box sx={{ mb: 2 }}>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={triggerFileInput}
              disabled={uploading}
            >
              Upload Document
            </Button>
          </Box>
          
          {uploading && (
            <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" color="text.secondary" align="center">
                {uploadProgress}%
              </Typography>
            </Box>
          )}
          
          {currentContract.documents.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Document Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Upload Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentContract.documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AttachFile fontSize="small" sx={{ mr: 1 }} />
                          {doc.name}
                        </Box>
                      </TableCell>
                      <TableCell>{doc.type.split('/')[1]?.toUpperCase() || doc.type}</TableCell>
                      <TableCell>{formatFileSize(doc.size)}</TableCell>
                      <TableCell>{doc.uploadDate}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleRemoveDocument(doc.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No documents attached to this contract.
            </Typography>
          )}
        </Grid>
      </Grid>
    </>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Contract Management
      </Typography>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Description color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Contracts</Typography>
            </Box>
            <Typography variant="h4">{totalContracts}</Typography>
            <Typography variant="body2" color="textSecondary">
              All Time
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BusinessCenter color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Active Contracts</Typography>
            </Box>
            <Typography variant="h4">{activeContracts}</Typography>
            <Typography variant="body2" color="textSecondary">
              Current
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AttachMoney color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Contract Value</Typography>
            </Box>
            <Typography variant="h4">${totalContractValue}</Typography>
            <Typography variant="body2" color="textSecondary">
              Active Contracts
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Warning color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Expiring Soon</Typography>
            </Box>
            <Typography variant="h4">{expiringContracts}</Typography>
            <Typography variant="body2" color="textSecondary">
              Within 30 Days
            </Typography>
          </Paper>
        </Grid>

        {/* Contract Status Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Contract Status Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsivePie
                data={contractStatusData}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#333333"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 56,
                    itemsSpacing: 0,
                    itemWidth: 100,
                    itemHeight: 18,
                    itemTextColor: '#999',
                    itemDirection: 'left-to-right',
                    itemOpacity: 1,
                    symbolSize: 18,
                    symbolShape: 'circle',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemTextColor: '#000'
                        }
                      }
                    ]
                  }
                ]}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Contract Value Trend Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Contract Value Trend
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveLine
                data={contractValueData}
                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Month',
                  legendOffset: 36,
                  legendPosition: 'middle'
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Amount ($)',
                  legendOffset: -40,
                  legendPosition: 'middle'
                }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Contracts Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Contracts
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
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Company</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Amount ($)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Documents</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>{contract.company}</TableCell>
                      <TableCell>{contract.vehicle}</TableCell>
                      <TableCell>{contract.startDate}</TableCell>
                      <TableCell>{contract.endDate}</TableCell>
                      <TableCell>${contract.amount}</TableCell>
                      <TableCell>
                        <Chip 
                          label={contract.status}
                          color={getStatusColor(contract.status)}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{contract.documents.length}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditContract(contract)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteConfirm(contract.id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Contract Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New Contract</Typography>
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
            Add Contract
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Edit Contract</Typography>
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
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this contract? This action cannot be undone.</Typography>
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