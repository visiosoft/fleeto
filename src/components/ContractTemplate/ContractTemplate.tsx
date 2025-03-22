import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/api';
import ContractTemplateEditor from './ContractTemplateEditor';
import { Contract } from '../../types';

interface Template {
  _id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  contract: Partial<Contract>;
}

const ContractTemplate: React.FC<Props> = ({ contract }) => {
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
                    secondary={`Last updated: ${new Date(template.updatedAt).toLocaleDateString()}`}
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
              template={selectedTemplate}
              contract={{
                companyName: contract?.companyName || '',
                contractType: contract?.contractType || '',
                startDate: contract?.startDate || '',
                endDate: contract?.endDate || '',
                value: contract?.value || 0,
                contactPerson: contract?.contactPerson || '',
                contactEmail: contract?.contactEmail || '',
                contactPhone: contract?.contactPhone || '',
                notes: contract?.notes || '',
                _id: contract?._id || '',
                status: contract?.status || 'Draft',
                vehicleId: contract?.vehicleId || '',
                tradeLicenseNo: contract?.tradeLicenseNo || ''
              }}
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