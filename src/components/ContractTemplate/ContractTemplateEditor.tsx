import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Grid,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Contract } from '../../types';

interface Props {
  template: {
    _id: string;
    name: string;
    content: string;
  };
  contract: Partial<Contract>;
  onSave: (content: string) => void;
  onClose: () => void;
  allowEdit?: boolean;
  showPreview?: boolean;
}

// Export the default template
export const defaultTemplate = `@import url('https://fonts.googleapis.com/css2?family=KoHo:wght@400;600;700&display=swap');

                                   CONTRACT AGREEMENT

This Contract Agreement (the "Agreement") is made and entered into on [Start Date] in Dubai, United Arab Emirates.

PARTIES:

1. Efficient Move New Used Furniture Removal L.L.C, a company registered under the laws of UAE 
   with Trade License No. 1383686, having its registered office at Dubai, UAE 
   (hereinafter referred to as the "Company")

2. [Client Company Name], a company registered under the laws of UAE with Trade License No. 
   [Client Trade License No], represented by [Contact Person] (hereinafter referred to as the "Client")

WHEREAS:
The Company and Client wish to enter into an agreement for [Contract Type], and both parties agree to be bound by the terms and conditions set forth in this agreement.

TERMS AND CONDITIONS:

1. CONTRACT DURATION AND VALUE
   • Duration: [Start Date] to [End Date]
   • Renewal: Upon mutual written consent
   • Total Value: AED [Value]

2. OPERATIONAL REQUIREMENTS
   • Driver's Accommodation: Client to provide accommodation during service period
   • Fuel Costs: Client responsible for all fuel and petrol costs
   • Salik Charges: Client responsible for all toll charges

3. PARTY OBLIGATIONS
   • Company: Provide services, maintain quality, comply with UAE laws
   • Client: Timely payments, provide information/access, comply with UAE laws


4. VEHICLE AND TERMINATION
   • Return: Vehicles/equipment returned to Company premises or agreed location
   • Termination: 7 days' notice for material breach
   • Post-termination: Immediate return of vehicles and settlement of dues

5. GOVERNING LAW
   • Jurisdiction: UAE laws and Dubai Courts
   • Force Majeure: Neither party liable for circumstances beyond control


For Efficient Move New Used Furniture Removal L.L.C:
Name: ____________________
Title: ____________________
License No: 1383686
Signature: ________________
Date: ____________________

For [Client Company Name]:
Name: [Contact Person]
Title: ____________________
License No: [Client Trade License No]
Signature: ________________
Date: ____________________`;

const ContractTemplateEditor: React.FC<Props> = ({
  template,
  contract,
  onSave,
  onClose,
  allowEdit = false,
  showPreview = false,
}) => {
  const [content, setContent] = useState(template.content);
  const [previewContent, setPreviewContent] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    updatePreview();
  }, [content, contract]);

  useEffect(() => {
    // Replace placeholders with actual contract data
    let filledTemplate = content
      .replace(/\[Company Name\]/g, contract.companyName || '')
      .replace(/\[Client Company Name\]/g, contract.companyName || '')
      .replace(/\[Trade License No\]/g, contract.tradeLicenseNo || '')
      .replace(/\[Contract Type\]/g, contract.contractType || '')
      .replace(/\[Start Date\]/g, contract.startDate ? new Date(contract.startDate).toLocaleDateString('en-AE') : '')
      .replace(/\[End Date\]/g, contract.endDate ? new Date(contract.endDate).toLocaleDateString('en-AE') : '')
      .replace(/\[Value\]/g, contract.value?.toLocaleString('en-AE') || '0')
      .replace(/\[Contact Person\]/g, contract.contactPerson || '')
      .replace(/\[Client Trade License No\]/g, contract.tradeLicenseNo || '');

    setContent(filledTemplate);
  }, [contract]);

  const updatePreview = () => {
    let processedContent = content;
    const contractData = {
      companyName: contract.companyName || '',
      contractType: contract.contractType || '',
      startDate: contract.startDate || '',
      endDate: contract.endDate || '',
      value: contract.value?.toString() || '0',
      contactPerson: contract.contactPerson || '',
      contactEmail: contract.contactEmail || '',
      contactPhone: contract.contactPhone || '',
      notes: contract.notes || ''
    };

    Object.entries(contractData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, String(value));
    });

    // Convert markdown-like syntax to HTML with better structure
    const lines = processedContent.split('\n');
    let inList = false;
    processedContent = lines
      .map(line => {
        // Headers
        if (line.startsWith('# ')) {
          return `<h1 class="document-title">${line.slice(2)}</h1>`;
        }
        if (line.startsWith('## ')) {
          return `<h2 class="section-title">${line.slice(3)}</h2>`;
        }
        // Lists
        if (line.startsWith('- ')) {
          if (!inList) {
            inList = true;
            return `<ul class="document-list"><li>${line.slice(2)}</li>`;
          }
          return `<li>${line.slice(2)}</li>`;
        }
        if (inList && !line.startsWith('- ')) {
          inList = false;
          return `</ul>${line ? `<p>${line}</p>` : '<br/>'}`;
        }
        // Empty lines
        if (line.trim() === '') {
          return '<br/>';
        }
        // Regular text
        return `<p>${line}</p>`;
      })
      .join('\n');

    if (inList) {
      processedContent += '</ul>';
    }

    setPreviewContent(processedContent);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleSave = () => {
    onSave(content);
  };

  const generatePDFFromContent = async () => {
    const element = document.getElementById('contract-preview');
    if (!element) return null;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;

    // Function to add header and footer to each page
    const addHeaderAndFooter = async () => {
      try {
        // Add header banner
        const headerImg = new Image();
        headerImg.src = '/bannerheader.png';
        await new Promise((resolve, reject) => {
          headerImg.onload = resolve;
          headerImg.onerror = reject;
          // Set a timeout in case the image loading hangs
          setTimeout(reject, 5000);
        });
        pdf.addImage(headerImg, 'PNG', 0, 0, pageWidth, 160);

        // Add footer banner at the bottom of the page
        const footerImg = new Image();
        footerImg.src = '/bannerfooter.png';
        await new Promise((resolve, reject) => {
          footerImg.onload = resolve;
          footerImg.onerror = reject;
          setTimeout(reject, 5000);
        });
        pdf.addImage(footerImg, 'PNG', 0, pageHeight - 100, pageWidth, 100);
      } catch (error) {
        console.error('Error loading banner images:', error);
      }
    };

    try {
      // Add header and footer to first page
      await addHeaderAndFooter();

      // Reset text color and font for content
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      
      // Use standard PDF font instead of custom font
      pdf.setFont('helvetica', 'normal');
      
      // Start content after header banner
      let y = 180;

      // Filter out banner tags and split content into lines
      const lines = content
        .replace(/<div[^>]*>|<\/div>|<img[^>]*>/g, '')
        .split('\n')
        .filter(line => line.trim() !== '' && !line.includes('@import'));
      
      for (const line of lines) {
        if (line.trim() === '') {
          y += 15;
          continue;
        }

        // Check if we need a new page
        if (y > pageHeight - 140) {
          pdf.addPage();
          await addHeaderAndFooter();
          y = 180;
        }

        // Make headings bold and slightly larger
        if (line.trim().startsWith('CONTRACT AGREEMENT')) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(14);
          const textWidth = pdf.getStringUnitWidth(line.trim()) * 14;
          pdf.text(line.trim(), (pageWidth - textWidth) / 2, y);
          y += 30;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          continue;
        }

        if (line.startsWith('PARTIES:') || 
            line.startsWith('WHEREAS:') || 
            line.startsWith('TERMS AND CONDITIONS:')) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.text(line.trim(), margin, y);
          y += 25;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          continue;
        }

        // Handle main numbered sections (1., 2., etc.)
        if (/^\d+\.\s[A-Z]/.test(line.trim())) {
          pdf.setFont('helvetica', 'bold');
          const words = line.trim().split(' ');
          let currentLine = '';
          let isFirstLine = true;
          
          for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = pdf.getStringUnitWidth(testLine) * 10;

            if (testWidth > pageWidth - (2 * margin)) {
              pdf.text(currentLine, margin, y);
              currentLine = word;
              y += 15;
              isFirstLine = false;
            } else {
              currentLine = testLine;
            }
          }

          if (currentLine) {
            pdf.text(currentLine, margin, y);
            y += 20;
          }
          
          pdf.setFont('helvetica', 'normal');
          continue;
        }

        // Handle bullet points (subsections)
        if (line.trim().startsWith('•')) {
          const words = line.trim().split(' ');
          let currentLine = '';
          let isFirstLine = true;
          
          for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = pdf.getStringUnitWidth(testLine) * 10;

            if (testWidth > pageWidth - (2 * margin + 20)) {
              pdf.text(currentLine, isFirstLine ? margin + 20 : margin + 30, y);
              currentLine = word;
              y += 15;
              isFirstLine = false;
            } else {
              currentLine = testLine;
            }
          }

          if (currentLine) {
            pdf.text(currentLine, isFirstLine ? margin + 20 : margin + 30, y);
            y += 15;
          }
          continue;
        }

        // Regular text with proper wrapping
        const words = line.trim().split(' ');
        let currentLine = '';
        let isFirstLine = true;
        
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const testWidth = pdf.getStringUnitWidth(testLine) * 10;

          if (testWidth > pageWidth - (2 * margin)) {
            pdf.text(currentLine, isFirstLine ? margin : margin + 10, y);
            currentLine = word;
            y += 15;
            isFirstLine = false;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          pdf.text(currentLine, isFirstLine ? margin : margin + 10, y);
          y += 15;
        }
      }

      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  const handlePrint = async () => {
    try {
      const pdf = await generatePDFFromContent();
      if (pdf) {
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url);
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }
    } catch (error) {
      console.error('Error printing PDF:', error);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const pdf = await generatePDFFromContent();
      if (pdf) {
        const fileName = `${contract.companyName || 'contract'}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {allowEdit && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Edit Template
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={20}
                value={content}
                onChange={handleContentChange}
                variant="outlined"
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  startIcon={<SaveIcon />}
                >
                  Save Changes
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
        <Grid item xs={12} md={allowEdit ? 6 : 12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleGeneratePDF}
                startIcon={<DownloadIcon />}
                sx={{ mr: 1 }}
              >
                Download PDF
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePrint}
                startIcon={<PrintIcon />}
              >
                Print
              </Button>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Paper 
              id="contract-preview" 
              sx={{ 
                p: 0,
                backgroundColor: '#fff',
                minHeight: '297mm',
                width: '210mm',
                margin: '0 auto',
                boxShadow: 1,
                fontFamily: '"KoHo", Arial, sans-serif',
                position: 'relative',
                '& .banner-header': {
                  width: '100%',
                  height: '160px',
                  position: 'relative',
                  marginBottom: '30px',
                  '& img': {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }
                },
                '& .banner-footer': {
                  width: '100%',
                  height: '100px',
                  position: 'relative',
                  marginTop: '30px',
                  '& img': {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }
                },
                '& .document-content': {
                  padding: '30px',
                  '& h1, h2, h3, h4, h5, h6': {
                    fontFamily: '"KoHo", Arial, sans-serif',
                    fontWeight: 700
                  }
                },
                '& .document-title': { 
                  fontSize: '20px',
                  fontWeight: 700,
                  textAlign: 'center',
                  marginBottom: '20px',
                  color: '#000',
                  fontFamily: '"KoHo", Arial, sans-serif'
                },
                '& .section-title': { 
                  fontSize: '16px',
                  fontWeight: 700,
                  marginTop: '16px',
                  marginBottom: '12px',
                  color: '#000',
                  fontFamily: '"KoHo", Arial, sans-serif'
                },
                '& p': { 
                  marginBottom: '10px',
                  lineHeight: 1.5,
                  fontSize: '12px',
                  fontFamily: '"KoHo", Arial, sans-serif'
                },
                '& .document-list': {
                  marginLeft: '16px',
                  marginBottom: '12px',
                  '& li': {
                    marginBottom: '6px',
                    lineHeight: 1.5,
                    fontSize: '12px',
                    fontFamily: '"KoHo", Arial, sans-serif'
                  }
                },
                '& br': {
                  marginTop: '10px'
                }
              }}
            >
              <div className="banner-header">
                <img src="/bannerheader.png" alt="Header Banner" />
              </div>
              <div dangerouslySetInnerHTML={{ 
                __html: `<div class="document-content">${previewContent}</div>` 
              }} />
              <div className="banner-footer">
                <img src="/bannerfooter.png" alt="Footer Banner" />
              </div>
            </Paper>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Preview Contract</DialogTitle>
        <DialogContent>
          <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {content}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button onClick={handlePrint} startIcon={<PrintIcon />}>
            Print
          </Button>
          <Button onClick={handleGeneratePDF} startIcon={<DownloadIcon />}>
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractTemplateEditor; 