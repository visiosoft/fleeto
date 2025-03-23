import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/api';
import ContractTemplateEditor, { Vehicle as EditorVehicle } from '../../components/ContractTemplate/ContractTemplateEditor';

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

interface Template {
  _id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

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

interface Vehicle {
  _id: string;
  name: string;
  // Add any other necessary properties for the vehicle
}

interface Props {
  template: {
    _id: string;
    name: string;
    content: string;
  };
  contract: Contract;
  vehicles: Vehicle[];
  onSave: (content: string) => Promise<void>;
  onClose: () => void;
}

const ContractTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract>({
    companyName: '',
    tradeLicenseNo: '',
    contractType: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    value: 0,
    status: 'Draft',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
    template: {
      content: defaultTemplateContent
    }
  });
  const [template, setTemplate] = useState<Template | null>(null);
  const [vehicles, setVehicles] = useState<EditorVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.CONTRACT_TEMPLATES));
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      showSnackbar('Failed to fetch templates', 'error');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.CONTRACT_TEMPLATES), {
        name: newTemplateName,
        content: '',
      });
      setTemplates([...templates, response.data]);
      setNewTemplateName('');
      setIsNewTemplateDialogOpen(false);
      showSnackbar('Template created successfully', 'success');
    } catch (error) {
      console.error('Failed to create template:', error);
      showSnackbar('Failed to create template', 'error');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await axios.delete(getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACT_TEMPLATES}/${templateId}`));
      setTemplates(templates.filter(t => t._id !== templateId));
      showSnackbar('Template deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete template:', error);
      showSnackbar('Failed to delete template', 'error');
    }
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsEditorOpen(true);
  };

  const handleSaveTemplate = async (templateId: string, content: string) => {
    try {
      await axios.put(getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACT_TEMPLATES}/${templateId}`), {
        content
      });
      setSnackbar({
        open: true,
        message: 'Template saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to save template:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save template',
        severity: 'error'
      });
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box p={3}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4">Contract Templates</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setIsNewTemplateDialogOpen(true)}
            >
              New Template
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Paper>
            <List>
              {templates.map((template) => (
                <ListItem key={template._id}>
                  <ListItemText
                    primary={template.name}
                    secondary={`Last updated: ${new Date(template.updatedAt).toLocaleDateString('en-AE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleEditTemplate(template)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteTemplate(template._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

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

      {isEditorOpen && selectedTemplate && (
        <Dialog
          open={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Edit Template: {selectedTemplate.name}
            <IconButton
              onClick={() => setIsEditorOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <ContractTemplateEditor
              template={{
                _id: selectedTemplate._id || 'new',
                name: selectedTemplate.name || 'New Template',
                content: selectedTemplate.content || defaultTemplateContent
              }}
              contract={{
                ...contract,
                _id: contract._id || undefined
              }}
              vehicles={vehicles}
              onSave={(content: string) => {
                handleSaveTemplate(selectedTemplate._id, content);
                setIsEditorOpen(false);
              }}
              onClose={() => setIsEditorOpen(false)}
              allowEdit={true}
              showPreview={true}
            />
          </DialogContent>
        </Dialog>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContractTemplate; 