import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    IconButton,
    Card,
    CardContent,
    CardMedia,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    Tooltip,
    Stack,
    Box,
    Divider,
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
import moment from 'moment';
import { API_BASE_URL } from '../../config/environment';

interface ExpenseDocument {
    _id: string;
    fileName: string;
    url: string;
    uploadedAt: string;
}

interface ExpenseDocumentsProps {
    expenseId: string;
    open: boolean;
    onClose: () => void;
    onDocumentsUpdated?: () => void;
}

const ExpenseDocuments: React.FC<ExpenseDocumentsProps> = ({ expenseId, open, onClose, onDocumentsUpdated }) => {
    const [documents, setDocuments] = useState<ExpenseDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    useEffect(() => {
        if (open && expenseId) {
            fetchDocuments();
        }
        // eslint-disable-next-line
    }, [open, expenseId]);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/expenses/${expenseId}/documents`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDocuments(response.data.documents || []);
        } catch (error) {
            setError('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (doc: ExpenseDocument) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(doc.url, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = doc.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
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

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select files to upload');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            selectedFiles.forEach((file) => {
                formData.append('receipts', file);
            });

            await axios.post(
                `${API_BASE_URL}/expenses/${expenseId}/upload-documents`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setSuccess(`${selectedFiles.length} file(s) uploaded successfully`);
            setSelectedFiles([]);
            fetchDocuments();
            if (onDocumentsUpdated) onDocumentsUpdated();
        } catch (error: any) {
            console.error('Upload error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to upload documents';
            setError(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${API_BASE_URL}/expenses/${expenseId}/documents/${docId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess('Document deleted successfully');
            fetchDocuments();
            if (onDocumentsUpdated) onDocumentsUpdated();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to delete document');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Expense Documents</Typography>
                <IconButton onClick={onClose} size="small">
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
                <Box sx={{ mb: 3 }}>
                    <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        startIcon={<UploadIcon />}
                        disabled={uploading}
                    >
                        Select Files to Upload
                        <input
                            type="file"
                            hidden
                            multiple
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length > 0) {
                                    setSelectedFiles([...selectedFiles, ...files]);
                                }
                            }}
                        />
                    </Button>

                    {selectedFiles.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Files to Upload ({selectedFiles.length})
                            </Typography>
                            <Stack spacing={1}>
                                {selectedFiles.map((file, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            p: 1,
                                            border: '1px solid',
                                            borderColor: 'primary.main',
                                            borderRadius: 1,
                                            backgroundColor: (theme) => `${theme.palette.primary.main}10`,
                                        }}
                                    >
                                        <DescriptionIcon color="primary" />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" noWrap>
                                                {file.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                                            color="error"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Stack>
                            <Button
                                variant="contained"
                                fullWidth
                                startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                                onClick={handleUpload}
                                disabled={uploading}
                                sx={{ mt: 2 }}
                            >
                                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
                            </Button>
                        </Box>
                    )}
                </Box>

                <Divider sx={{ mb: 2 }} />

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
                                        <CardMedia
                                            component="img"
                                            height="140"
                                            image={doc.url}
                                            alt={doc.fileName}
                                            sx={{ objectFit: 'cover' }}
                                        />
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
                                            {doc.fileName}
                                        </Typography>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            Uploaded: {moment(doc.uploadedAt).format('MMM DD, YYYY')}
                                        </Typography>
                                    </CardContent>
                                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <Tooltip title="Download">
                                            <IconButton size="small" onClick={() => handleDownload(doc)} color="primary">
                                                <DownloadIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" onClick={() => handleDeleteDocument(doc._id)} color="error">
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
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExpenseDocuments;
