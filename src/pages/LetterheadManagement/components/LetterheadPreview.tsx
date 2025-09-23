import React, { useRef } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { PictureAsPdf as PdfIcon, Print as PrintIcon } from '@mui/icons-material';
import { Letterhead } from '../../../types/api';
import html2pdf from 'html2pdf.js';

interface LetterheadPreviewProps {
  letterhead: Letterhead;
}

const LetterheadPreview: React.FC<LetterheadPreviewProps> = ({ letterhead }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const generatePDF = async (): Promise<string | null> => {
    if (!contentRef.current) return null;

    const filename = `Letterhead_${letterhead.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
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
    const contact = letterhead.header.contact;
    const parts = [
      contact.phone && `Tel: ${contact.phone}`,
      contact.email && `Email: ${contact.email}`,
      contact.website && `Web: ${contact.website}`
    ].filter(Boolean);
    return parts.join(' | ');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
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
            <Box 
              sx={{ 
                mb: 2,
                width: '100%',
                overflow: 'hidden'
              }}
            >
              <img
                src="/bannerheader.png"
                alt="Header Banner"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover'
                }}
              />
            </Box>

        {/* Custom Text */}
        {letterhead.customText && (
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-line',
                color: letterhead.styling.secondaryColor,
                fontFamily: letterhead.styling.fontFamily,
                fontSize: letterhead.styling.fontSize
              }}
            >
              {letterhead.customText}
            </Typography>
          </Box>
        )}

        {/* Sample Content */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, color: letterhead.styling.primaryColor }}>
            Sample Letter Content
          </Typography>
          
          {/* Date aligned to the right with label */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4, px: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </Typography>
          </Box>

          {/* To and Subject with more padding */}
          <Box sx={{ px: 2, mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              [Recipient Name]<br />
              [Recipient Address]<br />
              [City, State ZIP]
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, fontWeight: 'bold' }}>
              [Subject Line]
            </Typography>
          </Box>

          {/* Body content with more padding */}
          <Box sx={{ mt: 4, mb: 4, px: 2 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Dear [Recipient Name],
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, textAlign: 'justify', lineHeight: 1.6 }}>
              This is a sample letter to demonstrate how your letterhead template will look when used. 
              The header includes your company logo, name, and contact information, while the footer 
              can include additional text, page numbers, and date information as configured.
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, textAlign: 'justify', lineHeight: 1.6 }}>
              You can customize the styling, colors, fonts, and layout to match your brand identity. 
              The template will be used for all official correspondence and documents.
            </Typography>
          </Box>

          {/* Closing with more space and padding */}
          <Box sx={{ mt: 6, px: 2 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Sincerely,<br />
              [Your Name]<br />
              [Your Title]
            </Typography>
          </Box>
        </Box>

            {/* Footer */}
            <Box
              sx={{
                mt: 4,
                width: '100%',
                overflow: 'hidden'
              }}
            >
              <img
                src="/bannerfooter2.png"
                alt="Footer Banner"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover'
                }}
              />
            </Box>
      </Paper>
    </Box>
  );
};

export default LetterheadPreview;
