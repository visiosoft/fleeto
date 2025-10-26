import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API_CONFIG, getApiUrl } from '../../config/api';

const CONTRACT_STATUSES = [
  'Active',
  'Pending',
  'Expired',
  'Terminated',
  'Draft',
  'Suspended',
  'Renewed'
] as const;

type ContractStatus = typeof CONTRACT_STATUSES[number];

interface Contract {
  _id?: string;
  companyName: string;
  tradeLicenseNo: string;
  contractType: string;
  startDate: string;
  endDate: string;
  value: number;
  status: ContractStatus;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  vehicleId?: string;
  template?: {
    content: string;
    letterhead?: {
      logo?: string;
      companyInfo?: string;
    };
  };
}

interface RenewalData {
  startDate: Date;
  endDate: Date;
  value: number;
  previousContractId?: string;
}

export interface Vehicle {
  _id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: string;
}

interface Props {
  template: {
    _id: string;
    name: string;
    content: string;
  };
  contract: Partial<Contract>;
  vehicles: Vehicle[];
  onSave: (content: string) => void;
  onClose: () => void;
  onRenewContract?: (renewalData: RenewalData) => Promise<void>;
  allowEdit?: boolean;
  showPreview?: boolean;
}

// Export the default template
export const defaultTemplate = `

<h1 class="document-title">CONTRACT AGREEMENT</h1>

<p>This Contract Agreement (the "Agreement") is made and entered into on [Start Date] in Dubai, United Arab Emirates.</p>

<h2 class="section-title">PARTIES:</h2>

<p>1. Efficient Move New Used Furniture Removal L.L.C, a company registered under the laws of UAE 
   with Trade License No. 1383686, having its registered office at Dubai, UAE 
   (hereinafter referred to as the "Company")</p>

<p>2. [Client Company Name], a company registered under the laws of UAE with Trade License No. 
   [Client Trade License No], represented by [Contact Person] (hereinafter referred to as the "Client")</p>

<h2 class="section-title">VEHICLE INFORMATION:</h2>

<p>The following vehicle is assigned under this contract:</p>
<ul class="document-list">
<li>License Plate: [Vehicle License Plate]</li>
<li>Make: [Vehicle Make]</li>
<li>Model: [Vehicle Model]</li>
<li>Year: [Vehicle Year]</li>
</ul>

<h2 class="section-title">WHEREAS:</h2>
<p>The Company and Client wish to enter into an agreement for [Contract Type], and both parties agree to be bound by the terms and conditions set forth in this agreement.</p>

<h2 class="section-title">TERMS AND CONDITIONS:</h2>

<ol class="document-list">
<li><b>CONTRACT DURATION AND VALUE</b>
   <ul class="document-list">
   <li>Duration: From [Start Date] to [End Date]</li>
   <li>Renewal: Upon mutual written consent</li>
   <li>Total Value: AED [Value]</li>
     <li>Security Deposit: AED 1,000</li>
<li> PDC Check for Total Value</li>
   </ul>
</li>
<li><b>OPERATIONAL REQUIREMENTS</b>
   <ul class="document-list">
   <li>Driver's Accommodation: Client to provide accommodation during service period</li>
   <li>Fuel Costs: Client responsible for all fuel and petrol costs</li>
   <li>Salik Charges: Client responsible for all toll charges</li>
   </ul>
</li>
<li><b>PARTY OBLIGATIONS</b>
   <ul class="document-list">
   <li>Company: Provide services, maintain quality, comply with UAE laws</li>
   <li>Client: Timely payments, provide information/access, comply with UAE laws</li>
   </ul>
</li>
<li><b>VEHICLE AND TERMINATION</b>
   <ul class="document-list">
   <li>Return: Vehicles/equipment returned to Company premises or agreed location</li>
   <li>Termination: 30 days' notice for material breach</li>
   <li>Post-termination: Immediate return of vehicles and settlement of dues</li>
   </ul>
</li>
<li><b>GOVERNING LAW</b>
   <ul class="document-list">
   <li>Jurisdiction: UAE laws and Dubai Courts</li>
   <li>Force Majeure: Neither party liable for circumstances beyond control</li>
   </ul>
</li>
<li><b>MAINTENANCE AND REPAIRS</b>
   <p>In accordance with the principles of good faith and the obligations inherent in contracts under UAE law, the Parties agree as follows:</p>
   <ol class="document-list" type="a">
   <li><b>Client's Responsibilities (Routine Maintenance):</b> The Client shall be solely responsible for the cost and logistical arrangement of all routine and preventive maintenance of the Vehicle. This includes, as a minimum, monthly engine oil changes, oil filter changes, air filter changes, tire rotation, and brake inspections, performed in line with the manufacturer's recommended schedule. All maintenance must be performed at a reputable garage using parts and lubricants that meet the manufacturer's specifications.</li>
   <li><b>Client's Responsibilities (Operational Costs & Liability):</b> The Client shall bear all operational costs including fuel, toll charges, and daily expenses. The Client assumes full financial responsibility for all damages resulting from accidents, collisions, driver negligence, misuse, or improper maintenance. This includes engine damage from overheating, traffic incidents, and any damage attributable to the Client's fault or omission.</li>   <li><b>Company's Responsibilities (Major Repairs):</b> The Company shall be responsible for all major mechanical and structural repairs necessitated by normal wear and tear or latent defects, provided such issues are not a result of the Client's misuse or failure to perform its obligations under this Agreement.</li>
   <li><b>Reporting and Authorization:</b> The Client must immediately notify the Company in writing of any defect, malfunction, or damage to the Vehicle. For any non-routine repairs, the Company must provide prior written authorization before the Client commissions such repairs. Unauthorized repair costs will not be reimbursed.</li>
   <li><b>Records:</b> The Client shall maintain complete and accurate records of all maintenance and repairs performed on the Vehicle and make them available for inspection by the Company upon request.</li>
   </ol>
</li>
</ol>

<p>For Efficient Move New Used Furniture Removal L.L.C:<br/>
Name: ____________________<br/>
Title: ____________________<br/>
License No: 1383686<br/>
Signature: ________________<br/>
Date: ____________________</p>

<p>For [Client Company Name]:<br/>
Name: [Contact Person]<br/>
Title: ____________________<br/>
License No: [Client Trade License No]<br/>
Signature: ________________<br/>
Date: ____________________</p>`;

const ContractTemplateEditor: React.FC<Props> = ({
  template,
  contract,
  vehicles,
  onSave,
  onClose,
  onRenewContract,
  allowEdit = false,
  showPreview = false,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState(template.content);
  const [previewContent, setPreviewContent] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [renewalData, setRenewalData] = useState<RenewalData>({
    startDate: new Date(),
    endDate: new Date(),
    value: contract.value || 0,
    previousContractId: contract._id
  });
  const [isRenewing, setIsRenewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    const vehicle = vehicles.find((v: Vehicle) => v._id === contract.vehicleId);
    // Replace placeholders with actual contract data
    let filledTemplate = content
      .replace(/\[Company Name\]/g, contract.companyName || '')
      .replace(/\[Client Company Name\]/g, contract.companyName || '')
      .replace(/\[Trade License No\]/g, contract.tradeLicenseNo || '')
      .replace(/\[Contract Type\]/g, contract.contractType || '')
      .replace(/\[Start Date\]/g, contract.startDate ? new Date(contract.startDate).toLocaleDateString('en-AE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) : '')
      .replace(/\[End Date\]/g, contract.endDate ? new Date(contract.endDate).toLocaleDateString('en-AE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) : '')
      .replace(/\[Value\]/g, contract.value?.toLocaleString('en-AE') || '0')
      .replace(/\[Contact Person\]/g, contract.contactPerson || '')
      .replace(/\[Client Trade License No\]/g, contract.tradeLicenseNo || '')
      .replace(/\[Vehicle License Plate\]/g, vehicle?.licensePlate || '')
      .replace(/\[Vehicle Make\]/g, vehicle?.make || '')
      .replace(/\[Vehicle Model\]/g, vehicle?.model || '')
      .replace(/\[Vehicle Year\]/g, vehicle?.year || '');

    setContent(filledTemplate);
    updatePreview();
  }, [contract, vehicles, content]);

  const updatePreview = () => {
    let processedContent = content;

    // Check if content already contains HTML tags
    const hasHtmlTags = /<[^>]+>/.test(content);

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

    // If content already has HTML tags, use it directly
    if (hasHtmlTags) {
      setPreviewContent(processedContent);
      return;
    }

    // Convert markdown-like syntax to HTML with better structure (for plain text only)
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
    const newContent = e.target.value;
    setContent(newContent);
    updatePreview();
  };

  const handleSave = async () => {
    if (!contract._id) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        getApiUrl(`${API_CONFIG.ENDPOINTS.TEMPLATE}/${contract._id}`),
        {
          templateName: template?.name || 'Contract Template',
          templateHtml: content,
          templateData: {
            companyName: contract.companyName,
            tradeLicenseNo: contract.tradeLicenseNo,
            vehicleName: '',
            startDate: contract.startDate,
            endDate: contract.endDate,
            amount: contract.value,
          }
        },
        token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined
      );

      setSnackbar({
        open: true,
        message: 'Template saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving template:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save template',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!contract._id) return;

    setIsLoading(true);
    try {
      const element = document.getElementById('contract-preview');
      if (!element) {
        throw new Error('Contract preview element not found');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;

      // Preload header banner
      const headerImg = new Image();
      headerImg.src = '/bannerheader.png';
      await new Promise((resolve, reject) => {
        headerImg.onload = resolve as any;
        headerImg.onerror = reject as any;
        setTimeout(reject, 5000);
      });
      const headerHeight = 120; // reduce to leave more room per page

      // Preload footer banner
      const footerImg = new Image();
      footerImg.src = '/bannerfooter2.png';
      await new Promise((resolve, reject) => {
        footerImg.onload = resolve as any;
        footerImg.onerror = reject as any;
        setTimeout(reject, 5000);
      });
      const footerHeight = 80;

      // Render the content to a single canvas
      const fullCanvas = await (html2canvas as any)(element, {
        useCORS: true,
        logging: false,
        background: '#ffffff',
        scale: 2,
        scrollY: -window.scrollY,
      } as any);

      // Dimensions mapping from canvas px to PDF pts
      const availableWidth = pageWidth - (2 * margin);
      const scale = availableWidth / fullCanvas.width; // px -> pts scale for width
      const availableHeightPts = pageHeight - headerHeight - footerHeight - (2 * margin);
      const availableHeightPxPerPage = Math.floor(availableHeightPts / scale); // convert back to source px height per page slice

      // If the preview already contains a header banner image, skip it on first page slice
      let firstPageSkipPx = 0;
      const headerDomImg = element.querySelector('img[src*="bannerheader"]') as HTMLImageElement | null;
      if (headerDomImg) {
        const elementRect = element.getBoundingClientRect();
        const headerRect = headerDomImg.getBoundingClientRect();
        const relativeBottom = headerRect.bottom - elementRect.top; // px in CSS pixels
        const canvasScale = fullCanvas.width / element.clientWidth; // px per CSS pixel
        firstPageSkipPx = Math.max(0, Math.round(relativeBottom * canvasScale));
      }

      // Helper to draw header/footer per page
      const drawHeaderFooter = () => {
        pdf.addImage(headerImg, 'PNG', 0, 0, pageWidth, headerHeight);
        pdf.addImage(footerImg, 'PNG', 0, pageHeight - footerHeight, pageWidth, footerHeight);
      };

      // Slice the full canvas into page-sized chunks and add to PDF
      let sourceY = firstPageSkipPx;
      let isFirstPage = true;

      while (sourceY < fullCanvas.height) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        drawHeaderFooter();

        const sliceHeightPx = Math.min(availableHeightPxPerPage, fullCanvas.height - sourceY);

        // Create a temporary canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = fullCanvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create canvas context');

        // Draw slice of the full canvas into the page canvas
        ctx.drawImage(
          fullCanvas,
          0, sourceY, fullCanvas.width, sliceHeightPx,
          0, 0, fullCanvas.width, sliceHeightPx
        );

        const imgData = pageCanvas.toDataURL('image/png');
        const destX = margin;
        const destY = headerHeight + margin;
        const destW = availableWidth;
        const destH = sliceHeightPx * scale; // maintain scale

        pdf.addImage(imgData, 'PNG', destX, destY, destW, destH);

        sourceY += sliceHeightPx;
        isFirstPage = false;
      }

      pdf.save(`${contract.companyName}_contract.pdf`);

      setSnackbar({
        open: true,
        message: 'PDF generated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate PDF',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      const element = document.getElementById('contract-preview');
      if (!element) {
        throw new Error('Contract preview element not found');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;

      // Add header banner
      const headerImg = new Image();
      headerImg.src = '/bannerheader.png';
      await new Promise((resolve, reject) => {
        headerImg.onload = resolve;
        headerImg.onerror = reject;
        setTimeout(reject, 5000);
      });
      pdf.addImage(headerImg, 'PNG', 0, 0, pageWidth, 160);

      // Add footer banner
      const footerImg = new Image();
      footerImg.src = '/bannerfooter2.png';
      await new Promise((resolve, reject) => {
        footerImg.onload = resolve;
        footerImg.onerror = reject;
        setTimeout(reject, 5000);
      });
      pdf.addImage(footerImg, 'PNG', 0, pageHeight - 100, pageWidth, 100);

      // Convert the content to canvas
      const canvas = await html2canvas(element, {
        useCORS: true,
        logging: false,
        background: '#ffffff'
      });

      // Add the content to the PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', margin, 180, pageWidth - (2 * margin), 0);

      // Open in new window for printing
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Error printing PDF:', error);
      setSnackbar({
        open: true,
        message: 'Failed to print PDF',
        severity: 'error'
      });
    }
  };

  const handleRenewalOpen = () => {
    // Set default renewal dates
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);

    setRenewalData({
      startDate: today,
      endDate: nextYear,
      value: contract.value || 0,
      previousContractId: contract._id
    });
    setRenewDialogOpen(true);
  };

  const handleRenewalClose = () => {
    setRenewDialogOpen(false);
  };

  const handleRenewalSubmit = async () => {
    if (onRenewContract) {
      setIsRenewing(true);
      try {
        await onRenewContract(renewalData);
        handleRenewalClose();
      } catch (error) {
        console.error('Error renewing contract:', error);
      } finally {
        setIsRenewing(false);
      }
    }
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!contract) {
    return <CircularProgress />;
  }

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
                  disabled={isLoading}
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
                disabled={isLoading}
              >
                Generate PDF
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePrint}
                startIcon={<PrintIcon />}
                sx={{ mr: 1 }}
              >
                Print
              </Button>
              {onRenewContract && (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleRenewalOpen}
                  startIcon={<RefreshIcon />}
                >
                  Renew Contract
                </Button>
              )}
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

      {/* Renewal Dialog */}
      <Dialog open={renewDialogOpen} onClose={handleRenewalClose} maxWidth="sm" fullWidth>
        <DialogTitle>Renew Contract</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please enter the details for the contract renewal. The previous contract will be archived.
          </DialogContentText>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={renewalData.startDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setRenewalData(prev => ({ ...prev, startDate: newValue }));
                    }
                  }}
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={renewalData.endDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setRenewalData(prev => ({ ...prev, endDate: newValue }));
                    }
                  }}
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel htmlFor="contract-value">Contract Value</InputLabel>
                  <OutlinedInput
                    id="contract-value"
                    type="number"
                    value={renewalData.value}
                    onChange={(e) => setRenewalData(prev => ({
                      ...prev,
                      value: Number(e.target.value)
                    }))}
                    startAdornment={<InputAdornment position="start">AED</InputAdornment>}
                    label="Contract Value"
                  />
                </FormControl>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRenewalClose}>Cancel</Button>
          <Button
            onClick={handleRenewalSubmit}
            variant="contained"
            disabled={isRenewing}
          >
            {isRenewing ? 'Renewing...' : 'Renew Contract'}
          </Button>
        </DialogActions>
      </Dialog>

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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContractTemplateEditor; 