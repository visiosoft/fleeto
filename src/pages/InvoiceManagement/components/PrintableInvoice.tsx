import React, { useRef } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { Invoice } from '../../../types/api';
import html2pdf from 'html2pdf.js';

interface PrintableInvoiceProps {
  invoice: Invoice;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const generatePDF = async (): Promise<string | null> => {
    if (!contentRef.current) return null;

    const opt = {
      margin: 1,
      filename: `Invoice_${invoice.invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
      const pdf = await html2pdf().set(opt).from(contentRef.current).save();
      return `Invoice_${invoice.invoiceNumber}.pdf`;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  const handleWhatsAppShare = async () => {
    try {
      // Generate PDF first
      const pdfFileName = await generatePDF();
      if (!pdfFileName) {
        console.error('Failed to generate PDF');
        return;
      }

      // Create a simple message
      const message = `Your invoice ${invoice.invoiceNumber} is ready. Please check the attached PDF for details.`;

      // Encode the message for URL
      const encodedMessage = encodeURIComponent(message);
      
      // Create WhatsApp share URL with phone number
      const phoneNumber = invoice.contract?.contactPhone?.replace(/[^0-9]/g, '') || '';
      const whatsappUrl = phoneNumber 
        ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
        : `https://wa.me/?text=${encodedMessage}`;
      
      // Open WhatsApp in a new window
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
    }
  };

  // Calculate totals from items
  const subtotal = invoice?.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const vat = invoice?.includeVat ? subtotal * 0.05 : 0; // 5% VAT if included
  const total = invoice?.includeVat ? subtotal + vat : subtotal; // If VAT is not included, total equals subtotal

  return (
    <>
      <Box 
        ref={contentRef}
        sx={{ 
          p: 3, 
          maxWidth: '800px', 
          margin: '0 auto',
          '@media print': {
            padding: '15px',
            margin: 0,
            maxWidth: 'none',
            '& button': {
              display: 'none'
            }
          }
        }}
      >
        {/* Header Banner */}
        <Box sx={{ 
          mb: 2,
          width: '100%',
          '@media print': {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            width: '100%',
            height: '80px',
            overflow: 'hidden'
          }
        }}>
          <img 
            src="/bannerheader.png" 
            alt="Header Banner" 
            style={{ 
              width: '100%', 
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </Box>

        {/* Main Content */}
        <Box sx={{
          '@media print': {
            paddingTop: '80px',
            paddingBottom: '80px',
            minHeight: 'calc(100vh - 160px)',
            pageBreakInside: 'avoid'
          }
        }}>
          {/* Header */}
          <Box sx={{ 
            mb: 2, 
            textAlign: 'center',
            borderBottom: '1px solid #eee',
            pb: 1,
            '@media print': {
              borderBottom: '1px solid #000',
            }
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1.25rem' }}>
              INVOICE
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Invoice Number: {invoice?.invoiceNumber || 'N/A'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontSize: '0.75rem' }}>
                Issue Date: {invoice?.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                Due Date: {invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom sx={{ 
                fontSize: '0.75rem',
                color: invoice?.status === 'paid' ? '#2e7d32' : // Green for paid
                         invoice?.status === 'sent' ? '#ed6c02' : // Orange for sent
                         invoice?.status === 'overdue' ? '#d32f2f' : // Red for overdue
                         invoice?.status === 'cancelled' ? '#757575' : // Grey for cancelled
                         '#757575', // Grey for draft
                fontWeight: 'bold'
              }}>
                Status: {(invoice?.status || 'draft').toUpperCase()}
              </Typography>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>Description</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1 }}>Quantity</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1 }}>Unit Price</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1 }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice?.items?.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>{item.description || 'N/A'}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1 }}>{item.quantity}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1 }}>AED {(item.unitPrice || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1 }}>AED {(item.amount || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Box sx={{ width: '250px' }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>Subtotal:</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1 }}>AED {subtotal.toFixed(2)}</TableCell>
                  </TableRow>
                  {invoice?.includeVat && (
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>VAT (5%):</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1 }}>AED {vat.toFixed(2)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell sx={{ py: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Total:</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                        AED {total.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Box>

          {invoice?.notes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom sx={{ fontSize: '0.75rem' }}>
                Notes:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {invoice.notes}
              </Typography>
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ 
            mt: 2, 
            pt: 1, 
            borderTop: '1px solid #eee',
            '@media print': {
              borderTop: '1px solid #000',
            }
          }}>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ fontSize: '0.75rem' }}>
              Thank you for your business!
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ fontSize: '0.75rem' }}>
              For any questions, please contact us at dev.xulfi@gmail.com
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }} align="center">
                Bank Details
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }} align="center">
                EFFICIENT MOVE NEW & USED FURNITURE REMOVAL L.L.C

              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }} align="center">
                Bank Name: WIO Bank
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }} align="center">
                Account Number: 9834601124
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }} align="center">
                IBAN: AE230860000009834601124
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer Banner */}
        <Box sx={{ 
          mt: 2,
          width: '100%',
          '@media print': {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            width: '100%',
            height: '80px',
            overflow: 'hidden'
          }
        }}>
          <img 
            src="/bannerfooter.png" 
            alt="Footer Banner" 
            style={{ 
              width: '100%', 
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 2, 
          mb: 2, 
          '@media print': { display: 'none' } 
        }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleWhatsAppShare}
          >
            Share on WhatsApp
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePrint}
          >
            Print Invoice
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default PrintableInvoice; 