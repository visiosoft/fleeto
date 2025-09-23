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
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { Letterhead } from '../../types/api';
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

  useEffect(() => {
    if (id) {
      fetchLetterhead();
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

  const handlePrint = () => {
    window.print();
  };

  const generatePDF = async (): Promise<string | null> => {
    if (!contentRef.current || !letterhead) return null;

    const filename = `Letter_${letterhead.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    const opt = {
      margin: 0,
      filename: filename,
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
    };

    try {
      const pdf = await html2pdf().set(opt).from(contentRef.current).save();
      return filename;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
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
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={generatePDF}
          >
            Generate PDF
          </Button>
        </Box>
      </Box>

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
                src="/bannerfooter2.png"
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
    </Box>
  );
};

export default LetterheadPDF;
