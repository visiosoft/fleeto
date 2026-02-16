import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Stack,
  Badge,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/api';
import moment from 'moment';

interface Document {
  _id: string;
  type: string;
  title: string;
  url: string;
  uploadDate: string;
  expiryDate?: string;
}

interface ContractDocumentsProps {
  contractId: string;
  open: boolean;
  onClose: () => void;
}

const documentTypes = [
  { value: 'contract', label: 'Contract Document' },
  { value: 'amendment', label: 'Amendment' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'payment', label: 'Payment Receipt' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'legal', label: 'Legal Document' },
  { value: 'other', label: 'Other' },
];

const ContractDocuments: React.FC<ContractDocumentsProps> = ({ contractId, open, onClose }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('other');
  const [documentTitle, setDocumentTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Prevent closing during upload
  const handleClose = () => {
    if (uploading) {
      console.log('Cannot close dialog while uploading');
      return;
    }
    onClose();
  };

  // Component for authenticated image loading
  const DocumentImage: React.FC<{ doc: Document }> = ({ doc }) => {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
      const loadImage = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            getApiUrl(doc.url.replace('/contracts/', '/contracts/file/')),
            {
              headers: {
                Authorization: `Bearer ${token}`
              },
              responseType: 'blob'
            }
          );
          const url = window.URL.createObjectURL(response.data);
          setImageSrc(url);
        } catch (error) {
          console.error('Failed to load image:', error);
        } finally {
          setImageLoading(false);
        }
      };
      loadImage();
      
      // Cleanup
      return () => {
        if (imageSrc) {
          window.URL.revokeObjectURL(imageSrc);
        }
      };
    }, [doc.url]);

    if (imageLoading) {
      return (
        <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    return (
      <CardMedia
        component="img"
        height="140"
        image={imageSrc}
        alt={doc.title}
        sx={{ objectFit: 'cover' }}
      />
    );
  };

  useEffect(() => {
    if (open && contractId) {
      fetchDocuments();
    }
  }, [open, contractId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${contractId}/get-documents`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only images (JPEG, PNG, GIF) and PDF files are allowed');
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setDocumentTitle(file.name);
      setError(null);
    }
  };

  const handleUpload = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('=== Upload started ===');
    console.log('Contract ID:', contractId);
    console.log('Selected File:', selectedFile);
    console.log('Document Title:', documentTitle);
    console.log('Document Type:', documentType);
    
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (!documentTitle) {
      setError('Please enter a document title');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('type', documentType);
    formData.append('title', documentTitle);

    console.log('FormData created');

    try {
      const token = localStorage.getItem('token');
      const url = getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${contractId}/upload-document`);
      console.log('Upload URL:', url);
      console.log('Token present:', !!token);
      
      const response = await axios.post(
        url,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          },
        }
      );
      
      console.log('Upload response:', response.data);
      
      // Show success message
      setSuccess('Document uploaded successfully!');
      
      // Reset form
      setSelectedFile(null);
      setDocumentTitle('');
      setDocumentType('other');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log('Fetching updated documents...');
      // Refresh documents list
      await fetchDocuments();
      
      console.log('Upload complete!');
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('=== Upload error ===');
      console.error('Error details:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      setError(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      console.log('=== Upload process ended ===');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${contractId}/delete-document/${documentId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      await fetchDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      setError('Failed to delete document');
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        getApiUrl(doc.url.replace('/contracts/', '/contracts/file/')),
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );
      
      // Create a blob URL and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download document:', error);
      setError('Failed to download document');
    }
  };

  const getFileIcon = (url: string) => {
    const ext = url.toLowerCase();
    if (ext.endsWith('.pdf')) return <PdfIcon sx={{ fontSize: 48, color: '#EF4444' }} />;
    if (ext.match(/\.(jpg|jpeg|png|gif)$/)) return <ImageIcon sx={{ fontSize: 48, color: '#3B82F6' }} />;
    return <DescriptionIcon sx={{ fontSize: 48, color: '#6B7280' }} />;
  };

  const isImage = (url: string) => {
    return url.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={uploading}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Contract Documents</Typography>
          <Badge badgeContent={documents.length} color="primary" />
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={uploading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Upload Section */}
        <Card sx={{ mb: 3, border: '2px dashed #E5E7EB', backgroundColor: '#F9FAFB' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Upload New Document
            </Typography>
            
            <Stack spacing={2}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                {selectedFile ? selectedFile.name : 'Choose File'}
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                />
              </Button>

              {selectedFile && (
                <>
                  <TextField
                    fullWidth
                    label="Document Title"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    required
                  />

                  <TextField
                    fullWidth
                    select
                    label="Document Type"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                  >
                    {documentTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Button
                    type="button"
                    variant="contained"
                    onClick={handleUpload}
                    disabled={uploading}
                    startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                  >
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Uploaded Documents ({documents.length})
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : documents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <DescriptionIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
            <Typography>No documents uploaded yet</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {documents.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {isImage(doc.url) ? (
                    <DocumentImage doc={doc} />
                  ) : (
                    <Box
                      sx={{
                        height: 140,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#F3F4F6',
                      }}
                    >
                      {getFileIcon(doc.url)}
                    </Box>
                  )}
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {doc.title}
                    </Typography>
                    <Chip
                      label={documentTypes.find(t => t.value === doc.type)?.label || doc.type}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                      Uploaded: {moment(doc.uploadDate).format('MMM DD, YYYY')}
                    </Typography>
                  </CardContent>
                  
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Tooltip title="Download">
                      <IconButton size="small" onClick={() => handleDownload(doc)} color="primary">
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(doc._id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractDocuments;
