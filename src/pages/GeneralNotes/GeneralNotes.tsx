import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';

interface Note {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    name: string;
  };
}

interface NoteFormValues {
  title: string;
  content: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'archived';
}

const GeneralNotes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [formValues, setFormValues] = useState<NoteFormValues>({
    title: '',
    content: '',
    category: '',
    priority: 'medium',
    status: 'active',
  });
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await api.getNotes();
      setNotes(response.notes);
    } catch (err) {
      setError('Failed to fetch notes');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleOpenDialog = (note?: Note) => {
    if (note) {
      setSelectedNote(note);
      setFormValues({
        title: note.title,
        content: note.content,
        category: note.category,
        priority: note.priority,
        status: note.status,
      });
    } else {
      setSelectedNote(null);
      setFormValues({
        title: '',
        content: '',
        category: '',
        priority: 'medium',
        status: 'active',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedNote(null);
    setFormValues({
      title: '',
      content: '',
      category: '',
      priority: 'medium',
      status: 'active',
    });
  };

  const handleSubmit = async () => {
    try {
      if (selectedNote) {
        await api.updateNote(selectedNote._id, formValues);
      } else {
        await api.createNote(formValues);
      }
      handleCloseDialog();
      fetchNotes();
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await api.deleteNote(noteId);
        fetchNotes();
      } catch (err) {
        console.error('Error deleting note:', err);
      }
    }
  };

  const handleToggleArchive = async (note: Note) => {
    try {
      await api.updateNote(note._id, {
        ...note,
        status: note.status === 'active' ? 'archived' : 'active',
      });
      fetchNotes();
    } catch (err) {
      console.error('Error updating note status:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const filteredNotes = notes.filter(note => {
    if (filter === 'all') return true;
    return note.status === filter;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          General Notes
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mr: 2 }}
          >
            Add Note
          </Button>
          <FormControl sx={{ minWidth: 120 }}>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              size="small"
            >
              <MenuItem value="all">All Notes</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {filteredNotes.map((note) => (
          <Grid item xs={12} md={6} lg={4} key={note._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {note.title}
                  </Typography>
                  <Chip
                    label={note.priority}
                    color={getPriorityColor(note.priority)}
                    size="small"
                  />
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  {note.category}
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {note.content}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  Created by {note.createdBy?.name || 'Unknown User'} on {new Date(note.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
              <Divider />
              <CardActions>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog(note)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleToggleArchive(note)}
                  color={note.status === 'active' ? 'warning' : 'success'}
                >
                  {note.status === 'active' ? <ArchiveIcon /> : <UnarchiveIcon />}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(note._id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedNote ? 'Edit Note' : 'Add New Note'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formValues.title}
              onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Content"
              multiline
              rows={4}
              value={formValues.content}
              onChange={(e) => setFormValues({ ...formValues, content: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Category"
              value={formValues.category}
              onChange={(e) => setFormValues({ ...formValues, category: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formValues.priority}
                label="Priority"
                onChange={(e) => setFormValues({ ...formValues, priority: e.target.value as NoteFormValues['priority'] })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formValues.status}
                label="Status"
                onChange={(e) => setFormValues({ ...formValues, status: e.target.value as NoteFormValues['status'] })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedNote ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GeneralNotes; 