import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  PictureAsPdf as PdfIcon,
  Visibility as PreviewIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Letterhead } from '../../types/api';
import LetterheadService from '../../services/LetterheadService';
import LetterheadForm from './components/LetterheadForm';
import LetterheadPreview from './components/LetterheadPreview';

const LetterheadManagement: React.FC = () => {
  const navigate = useNavigate();
  const [letterheads, setLetterheads] = useState<Letterhead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [editingLetterhead, setEditingLetterhead] = useState<Letterhead | null>(null);
  const [previewLetterhead, setPreviewLetterhead] = useState<Letterhead | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLetterhead, setSelectedLetterhead] = useState<Letterhead | null>(null);

  useEffect(() => {
    fetchLetterheads();
  }, []);

  const fetchLetterheads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LetterheadService.getInstance().getAllLetterheads();
      setLetterheads(data);
    } catch (err) {
      console.error('Error fetching letterheads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch letterheads');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLetterhead(null);
    setOpenForm(true);
  };

  const handleEdit = (letterhead: Letterhead) => {
    setEditingLetterhead(letterhead);
    setOpenForm(true);
  };

  const handlePreview = (letterhead: Letterhead) => {
    setPreviewLetterhead(letterhead);
    setOpenPreview(true);
  };

  const handleDelete = async (letterhead: Letterhead) => {
    if (window.confirm(`Are you sure you want to delete "${letterhead.name}"?`)) {
      try {
        await LetterheadService.getInstance().deleteLetterhead(letterhead._id);
        await fetchLetterheads();
      } catch (err) {
        console.error('Error deleting letterhead:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete letterhead');
      }
    }
  };

  const handleSetDefault = async (letterhead: Letterhead) => {
    try {
      await LetterheadService.getInstance().setDefaultLetterhead(letterhead._id);
      await fetchLetterheads();
    } catch (err) {
      console.error('Error setting default letterhead:', err);
      setError(err instanceof Error ? err.message : 'Failed to set default letterhead');
    }
  };

  const handleDuplicate = (letterhead: Letterhead) => {
    const duplicatedLetterhead = {
      ...letterhead,
      name: `${letterhead.name} (Copy)`,
      isDefault: false,
    };
    delete (duplicatedLetterhead as any)._id;
    setEditingLetterhead(duplicatedLetterhead as Letterhead);
    setOpenForm(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, letterhead: Letterhead) => {
    setAnchorEl(event.currentTarget);
    setSelectedLetterhead(letterhead);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLetterhead(null);
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setEditingLetterhead(null);
  };

  const handleFormSubmit = async (letterheadData: Partial<Letterhead>) => {
    try {
      if (editingLetterhead) {
        await LetterheadService.getInstance().updateLetterhead(editingLetterhead._id, letterheadData);
      } else {
        await LetterheadService.getInstance().createLetterhead(letterheadData);
      }
      await fetchLetterheads();
      handleFormClose();
    } catch (err) {
      console.error('Error saving letterhead:', err);
      setError(err instanceof Error ? err.message : 'Failed to save letterhead');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Letterhead Templates</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Create Letterhead
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {letterheads.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No letterhead templates found
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Create your first letterhead template to get started
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Create Letterhead
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {letterheads.map((letterhead) => (
            <Grid item xs={12} sm={6} md={4} key={letterhead._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {letterhead.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {letterhead.isDefault && (
                        <Chip
                          icon={<StarIcon />}
                          label="Default"
                          color="primary"
                          size="small"
                        />
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, letterhead)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {letterhead.description && (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {letterhead.description}
                    </Typography>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Company: {letterhead.header.companyName}
                    </Typography>
                    {letterhead.header.tagline && (
                      <Typography variant="body2" color="textSecondary">
                        {letterhead.header.tagline}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={letterhead.styling.fontFamily}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${letterhead.styling.fontSize}px`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<PreviewIcon />}
                    onClick={() => handlePreview(letterhead)}
                  >
                    Preview
                  </Button>
                  <Button
                    size="small"
                    startIcon={<PdfIcon />}
                    onClick={() => navigate(`/letterheads/${letterhead._id}/pdf`)}
                  >
                    Generate PDF
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedLetterhead) {
            handleEdit(selectedLetterhead);
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedLetterhead) {
            handleDuplicate(selectedLetterhead);
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        {selectedLetterhead && !selectedLetterhead.isDefault && (
          <MenuItem onClick={() => {
            if (selectedLetterhead) {
              handleSetDefault(selectedLetterhead);
            }
            handleMenuClose();
          }}>
            <ListItemIcon>
              <StarIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Set as Default</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          if (selectedLetterhead) {
            handleDelete(selectedLetterhead);
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Form Dialog */}
      <Dialog
        open={openForm}
        onClose={handleFormClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingLetterhead ? 'Edit Letterhead' : 'Create Letterhead'}
        </DialogTitle>
        <DialogContent>
          <LetterheadForm
            letterhead={editingLetterhead}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Letterhead Preview</DialogTitle>
        <DialogContent>
          {previewLetterhead && (
            <LetterheadPreview letterhead={previewLetterhead} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LetterheadManagement;
