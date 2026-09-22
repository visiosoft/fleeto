import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  Grid,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  ArrowBack as BackIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { Letterhead, LetterHistoryEntry } from '../../types/api';
import LetterheadService from '../../services/LetterheadService';
import html2pdf from 'html2pdf.js';

const LetterheadPDF: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  const [letterhead, setLetterhead] = useState<Letterhead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [letterContent, setLetterContent] = useState({
    date: new Date().toLocaleDateString(),
    to: '',
    subject: '',
    body: '',
    closing: 'Sincerely,',
    signature: '',
  });
  const [history, setHistory] = useState<LetterHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchLetterhead();
      fetchHistory();
    }
  }, [id]);

  const fetchLetterhead = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LetterheadService.getInstance().getLetterheadById(id!);
      setLetterhead(data);
    } catch (err) {
      console.error('Error fetching letterhead:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch letterhead');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await LetterheadService.getInstance().getLetterHistory(id!);
      setHistory(data);
    } catch (err) {
      console.error('Error fetching letter history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const buildOptions = (filename: string) => ({
    margin: 0,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true
    },
    jsPDF: {
      unit: 'in',
      format: 'letter',
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  });

  const generateAndSavePDF = async () => {
    if (!contentRef.current || !letterhead) return;

    const filename = `Letter_${letterhead.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    const opt = buildOptions(filename);

    try {
      setSaving(true);
      setActionError(null);

      const blob: Blob = await (html2pdf() as any).set(opt).from(contentRef.current).outputPdf('blob');

      // Trigger a browser download for the user, same as before
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      // Save to history so it can be reopened later, or overwrite the entry being edited
      if (editingHistoryId) {
        await LetterheadService.getInstance().updateLetterHistory(
          letterhead._id,
          editingHistoryId,
          blob,
          filename,
          letterContent.subject || filename,
          letterContent
        );
        setSuccessMessage('Saved letter updated');
        setEditingHistoryId(null);
      } else {
        await LetterheadService.getInstance().saveLetterHistory(
          letterhead._id,
          blob,
          filename,
          letterContent.subject || filename,
          letterContent
        );
        setSuccessMessage('Letter saved to history');
      }

      await fetchHistory();
    } catch (error) {
      console.error('Error generating/saving PDF:', error);
      setActionError('Failed to generate or save the PDF');
    } finally {
      setSaving(false);
    }
  };

  const handleViewHistoryEntry = (entry: LetterHistoryEntry) => {
    const url = LetterheadService.getInstance().getLetterPdfUrl(entry.url);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEditHistoryEntry = (entry: LetterHistoryEntry) => {
    setLetterContent({
      date: entry.letterContent?.date || new Date().toLocaleDateString(),
      to: entry.letterContent?.to || '',
      subject: entry.letterContent?.subject || '',
      body: entry.letterContent?.body || '',
      closing: entry.letterContent?.closing || 'Sincerely,',
      signature: entry.letterContent?.signature || '',
    });
    setEditingHistoryId(entry._id);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicateHistoryEntry = (entry: LetterHistoryEntry) => {
    setLetterContent({
      date: new Date().toLocaleDateString(),
      to: entry.letterContent?.to || '',
      subject: entry.letterContent?.subject ? `${entry.letterContent.subject} (Copy)` : '',
      body: entry.letterContent?.body || '',
      closing: entry.letterContent?.closing || 'Sincerely,',
      signature: entry.letterContent?.signature || '',
    });
    setEditingHistoryId(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingHistoryId(null);
    setLetterContent({
      date: new Date().toLocaleDateString(),
      to: '',
      subject: '',
      body: '',
      closing: 'Sincerely,',
      signature: '',
    });
  };

  const handleDeleteHistoryEntry = async (entry: LetterHistoryEntry) => {
    if (!window.confirm('Delete this saved letter from history?')) return;
    try {
      await LetterheadService.getInstance().deleteLetterHistory(entry._id);
      if (editingHistoryId === entry._id) {
        handleCancelEdit();
      }
      await fetchHistory();
    } catch (err) {
      console.error('Error deleting letter history entry:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to delete history entry');
    }
  };

  const formatAddress = () => {
    if (!letterhead) return '';
    const address = letterhead.header.address;
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  const formatContact = () => {
    if (!letterhead) return '';
    const contact = letterhead.header.contact;
    const parts = [
      contact.phone && `Tel: ${contact.phone}`,
      contact.email && `Email: ${contact.email}`,
      contact.website && `Web: ${contact.website}`
    ].filter(Boolean);
    return parts.join(' | ');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !letterhead) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Letterhead not found'}
        </Alert>
        <Button variant="contained" startIcon={<BackIcon />} onClick={() => navigate('/letterheads')}>
          Back to Letterheads
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Generate Letter - {letterhead.name}</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/letterheads')}
          >
            Back
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
          {editingHistoryId && (
            <Button variant="outlined" color="inherit" onClick={handleCancelEdit}>
              Cancel Edit
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={generateAndSavePDF}
            disabled={saving}
          >
            {saving ? 'Saving...' : editingHistoryId ? 'Update Saved Letter' : 'Generate & Save PDF'}
          </Button>
        </Box>
      </Box>

      {editingHistoryId && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={handleCancelEdit}>
          Editing a previously saved letter. Saving will update that history entry instead of creating a new one.
        </Alert>
      )}

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Letter Content Form */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Letter Content
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Date"
                    value={letterContent.date}
                    onChange={(e) => setLetterContent(prev => ({ ...prev, date: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="To"
                    value={letterContent.to}
                    onChange={(e) => setLetterContent(prev => ({ ...prev, to: e.target.value }))}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={letterContent.subject}
                    onChange={(e) => setLetterContent(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Body"
                    value={letterContent.body}
                    onChange={(e) => setLetterContent(prev => ({ ...prev, body: e.target.value }))}
                    multiline
                    rows={6}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Closing"
                    value={letterContent.closing}
                    onChange={(e) => setLetterContent(prev => ({ ...prev, closing: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Signature"
                    value={letterContent.signature}
                    onChange={(e) => setLetterContent(prev => ({ ...prev, signature: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Letter Preview */}
        <Grid item xs={12} md={8}>
          <Paper
            ref={contentRef}
            sx={{
              p: 3,
              minHeight: '11in',
              fontFamily: letterhead.styling.fontFamily,
              fontSize: `${letterhead.styling.fontSize}px`,
              color: letterhead.styling.secondaryColor,
              position: 'relative',
            }}
          >
            {/* Header */}
            <Box sx={{ mb: 3 }}>
              <img
                src="/bannerheader.png"
                alt="Header Banner"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </Box>

            {/* Letter Content */}
            <Box sx={{ mb: 4 }}>
              {/* Date aligned to the right with label */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4, px: 2 }}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  <strong>Date:</strong> {letterContent.date}
                </Typography>
              </Box>

              {/* To and Subject with more padding */}
              <Box sx={{ px: 2, mb: 2 }}>
                {letterContent.to && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {letterContent.to}
                  </Typography>
                )}
                {letterContent.subject && (
                  <Typography variant="body1" sx={{ mb: 3, fontWeight: 'bold' }}>
                    {letterContent.subject}
                  </Typography>
                )}
              </Box>

              {/* Body content with more padding */}
              <Box sx={{ mt: 4, mb: 4, px: 2 }}>
                {letterContent.body && (
                  <Typography variant="body1" sx={{ mb: 3, textAlign: 'justify', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {letterContent.body}
                  </Typography>
                )}
              </Box>

              {/* Closing with more space and padding */}
              <Box sx={{ mt: 6, px: 2 }}>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {letterContent.closing}
                </Typography>
                {letterContent.signature && (
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    {letterContent.signature}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
              }}
            >
              <img
                src={letterhead.footer?.image || '/bannerfooter2.png'}
                alt="Footer Banner"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Letter History */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            History
          </Typography>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : history.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No letters generated yet for this template. Click "Generate & Save PDF" to create your first one.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title / Subject</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Generated On</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry._id}>
                    <TableCell>{entry.title}</TableCell>
                    <TableCell>{entry.letterContent?.to || '-'}</TableCell>
                    <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View PDF">
                        <IconButton size="small" onClick={() => handleViewHistoryEntry(entry)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEditHistoryEntry(entry)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Duplicate">
                        <IconButton size="small" onClick={() => handleDuplicateHistoryEntry(entry)}>
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteHistoryEntry(entry)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Box>
  );
};

export default LetterheadPDF;
