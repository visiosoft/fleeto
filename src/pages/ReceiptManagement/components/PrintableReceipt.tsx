import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Receipt } from '../../../types/api';
import html2pdf from 'html2pdf.js';
import axios from 'axios';
import { API_ENDPOINTS } from '../../../config/environment';

interface PrintableReceiptProps {
  receipt: Receipt;
}

const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ receipt }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [headerImage, setHeaderImage] = useState<string>('/bannerheader.png');
  const [footerImage, setFooterImage] = useState<string>('/bannerfooter2.png');

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const selectedCompanyId = localStorage.getItem('selectedCompanyId');
      if (!selectedCompanyId) return;

      const response = await axios.get(
        `${API_ENDPOINTS.companies}/${selectedCompanyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const companyData = response.data.data.company;
      if (companyData.settings?.invoiceHeader) {
        setHeaderImage(companyData.settings.invoiceHeader);
      }
      if (companyData.settings?.invoiceFooter) {
        setFooterImage(companyData.settings.invoiceFooter);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const handleDownload = () => {
    const element = contentRef.current;
    if (!element) return;

    const opt = {
      margin: 1,
      filename: `receipt-${receipt.referenceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box ref={contentRef} sx={{ p: 0, backgroundColor: 'white' }}>
        {/* Header Banner */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <img 
            src={headerImage} 
            alt="Header Banner" 
            style={{ 
              width: '100%', 
              height: 'auto',
              display: 'block',
              margin: 0,
              padding: 0
            }}
          />
        </Box>

        {/* Content Container */}
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              Payment Receipt
            </Typography>
            <Typography variant="subtitle2" sx={{ fontSize: '0.9rem' }}>
              Receipt No: {receipt._id}
            </Typography>
            <Typography variant="subtitle2" sx={{ fontSize: '0.9rem' }}>
              Reference: {receipt.referenceNumber}
            </Typography>
          </Box>

          {/* Client Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              Client Information
            </Typography>
            <Typography sx={{ fontSize: '0.9rem' }}>Name: {receipt.clientName}</Typography>
            <Typography sx={{ fontSize: '0.9rem' }}>Email: {receipt.clientEmail}</Typography>
          </Box>

          {/* Payment Details */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              Payment Details
            </Typography>
            <Box sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 1,
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                '& > div': {
                  p: 1,
                  borderBottom: '1px solid #e0e0e0',
                  fontSize: '0.9rem',
                  '&:nth-of-type(odd)': {
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold'
                  }
                }
              }}>
                <Box>Invoice ID</Box>
                <Box>{receipt.invoiceId}</Box>
                
                <Box>Amount</Box>
                <Box>AED {receipt.amount.toFixed(2)}</Box>
                
                <Box>Payment Method</Box>
                <Box>{(receipt.paymentMethod || '').replace('_', ' ').toUpperCase()}</Box>
                
                <Box>Payment Date</Box>
                <Box>{new Date(receipt.paymentDate).toLocaleDateString()}</Box>
                
                <Box>Status</Box>
                <Box sx={{ 
                  color: receipt.status === 'received' || receipt.status === 'paid' ? 'success.main' : 
                         receipt.status === 'pending' ? 'warning.main' :
                         receipt.status === 'failed' ? 'error.main' :
                         receipt.status === 'refunded' ? 'info.main' : 'inherit'
                }}>
                  {(receipt.status || '').toUpperCase()}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Notes */}
          {receipt.notes && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                Notes
              </Typography>
              <Typography sx={{ fontSize: '0.9rem' }}>{receipt.notes}</Typography>
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ mt: 2, textAlign: 'center', borderTop: '1px solid #ccc', pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              This is a computer-generated receipt and does not require a signature.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Generated on: {new Date().toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Footer Banner */}
        <Box sx={{ width: '100%', mt: 2 }}>
          <img 
            src={footerImage} 
            alt="Footer Banner" 
            style={{ 
              width: '100%', 
              height: 'auto',
              display: 'block',
              margin: 0,
              padding: 0
            }}
          />
        </Box>
      </Box>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleDownload}
        >
          Download PDF
        </Button>
      </Box>
    </Box>
  );
};

export default PrintableReceipt; 