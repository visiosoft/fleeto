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

<h1 class="document-title">VEHICLE RENTAL AGREEMENT</h1>

<p>This Vehicle Rental Agreement (the "Agreement") is made and entered into on [Start Date] in Dubai, United Arab Emirates.</p>

<h2 class="section-title">PARTIES:</h2>

<p>1. Efficient Move New Used Furniture Removal L.L.C, a company registered under the laws of UAE 
with Trade License No. 1383686, having its registered office at Dubai, UAE 
(hereinafter referred to as the "Company")</p>

<p>2. [Client Company Name], a company registered under the laws of UAE with Trade License No. 
[Client Trade License No], represented by [Contact Person] 
(hereinafter referred to as the "Client")</p>

<h2 class="section-title">VEHICLE INFORMATION:</h2>

<p>The Company hereby rents to the Client the following vehicle without driver:</p>

<ul class="document-list">
<li>License Plate: [Vehicle License Plate]</li>
<li>Make / Model / Year : [Vehicle Make]  [Vehicle Model]  [Vehicle Year]</li>
</ul>

<h2 class="section-title">TERMS AND CONDITIONS:</h2>

<ul class="document-list">

<li><b>CONTRACT DURATION AND VALUE</b>
   <ul class="document-list">
   <li>Duration: From [Start Date] to [End Date]</li>
   <li>Renewal: Only upon mutual written consent of both Parties</li>
   <li>Total Rental Value: AED [Value]</li>
   <li>Security Deposit: AED 1,000</li>
   <li>Payment Method: Post-Dated Cheque (PDC) for full rental amount</li>
   </ul>
   <p>The Security Deposit shall be refundable within 21 days after vehicle return, subject to inspection, clearance of fines, Salik charges, and settlement of all outstanding dues. The Company reserves the right to deduct unpaid amounts, damages, fines, repair costs, or other liabilities from the deposit.</p>
</li>

<li><b>VEHICLE HANDOVER AND CONDITION</b>
   <p>The Vehicle shall be delivered in good working and roadworthy condition. A vehicle handover report shall be signed by both Parties at delivery and return. The Client confirms receipt of the Vehicle in satisfactory condition.</p>
</li>

<li><b>PAYMENT DEFAULT</b>
   <p>In case of cheque dishonor or delayed payment, the Company reserves the right to immediately repossess the Vehicle without prior notice and pursue legal remedies under UAE law.</p>
</li>

<li><b>CLIENT RESPONSIBILITIES</b>
   <ul class="document-list">
   <li>Fuel and petrol costs</li>
   <li>Salik (toll) charges</li>
   <li>Traffic fines, black points, parking violations, and impound charges</li>
   <li>Compliance with all UAE traffic laws and regulations</li>
   </ul>
   <p>The Client shall ensure that only legally licensed drivers operate the Vehicle.</p>
</li>

<li><b>MAINTENANCE AND REPAIRS</b>
   <ul class="document-list" type="a">
   <li><b>Routine Maintenance:</b> The Client shall be responsible for all routine and preventive maintenance including monthly engine oil change, oil filter, air filter, brake inspection, and tire rotation, performed at reputable garages using manufacturer-approved parts.</li>
   <li><b>Operational Liability:</b> The Client assumes full financial responsibility for damages resulting from accidents, driver negligence, misuse, overloading, overheating, or failure to perform required maintenance.</li>
   <li><b>Major Repairs:</b> The Company shall be responsible only for major mechanical defects caused by normal wear and tear, provided such defects are not due to misuse or negligence by the Client.</li>
   <li><b>Accidents:</b> In case of accident, a valid Dubai Police report is mandatory. Insurance deductible/excess shall be borne by the Client. Damage without police report shall be fully payable by the Client.</li>
   <li><b>Authorization:</b> No non-routine repair shall be carried out without prior written approval from the Company. Unauthorized repairs shall not be reimbursed.</li>
   <li><b>Records:</b> The Client shall maintain proper maintenance records and provide them upon request.</li>
   </ul>
</li>


<li><b>PROHIBITED USE</b>
   <p>The Vehicle shall not be used for illegal activities, racing, reckless driving, sub-renting, or transport outside the Dubai without written consent of the Company.</p>
</li>

<li><b>TERMINATION</b>
   <ul class="document-list">
   <li> Early termination by the Client requires 30 days written notice and full settlement of remaining rental value unless otherwise agreed.</li>
   <li> Either Party may terminate for material breach with 30 days written notice.</li>
   <li> Upon termination, the Vehicle must be returned immediately and all dues settled.</li>
   </ul>
</li>

<li><b>VEHICLE RETURN</b>
   <p>The Vehicle shall be returned to the Company premises or agreed location in clean condition along with all keys and documents. Failure to return the Vehicle may result in legal action.</p>
</li>

<li><b>GOVERNING LAW AND JURISDICTION</b>
   <p>This Agreement shall be governed by the laws of the United Arab Emirates. The Courts of Dubai shall have exclusive jurisdiction over any dispute arising from this Agreement.</p>
</li>

<li><b>ENTIRE AGREEMENT</b>
   <p>This Agreement constitutes the entire understanding between the Parties and supersedes all prior agreements. Any amendment must be in writing and signed by both Parties.</p>
</li>

</ul>

<p>For Efficient Move New Used Furniture Removal L.L.C:<br/>
Name: ____________________<br/>
Title: ____________________<br/>
License No: 1383686<br/>
Signature: ________________<br/>
Date: ____________________<br/>
Company Stamp:</p>

<p>For [Client Company Name]:<br/>
Name: [Contact Person]<br/>
Title: ____________________<br/>
License No: [Client Trade License No]<br/>
Signature: ________________<br/>
Date: ____________________<br/>
Company Stamp:</p>

`;

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
      const headerHeight = 160; // reduce to leave more room per page

      // Preload footer banner
      const footerImg = new Image();
      footerImg.src = '/bannerfooter2.png';
      await new Promise((resolve, reject) => {
        footerImg.onload = resolve as any;
        footerImg.onerror = reject as any;
        setTimeout(reject, 5000);
      });
      const footerHeight = 160;

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
      const availableHeightPts = pageHeight - headerHeight - footerHeight - 5 - margin;
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
        const destY = headerHeight + 5;
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

      // Preload header banner
      const headerImg = new Image();
      headerImg.src = '/bannerheader.png';
      await new Promise((resolve, reject) => {
        headerImg.onload = resolve as any;
        headerImg.onerror = reject as any;
        setTimeout(reject, 5000);
      });
      const headerHeight = 120;

      // Preload footer banner
      const footerImg = new Image();
      footerImg.src = '/bannerfooter2.png';
      await new Promise((resolve, reject) => {
        footerImg.onload = resolve as any;
        footerImg.onerror = reject as any;
        setTimeout(reject, 5000);
      });
      const footerHeight = 120;

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
      const scale = availableWidth / fullCanvas.width;
      const availableHeightPts = pageHeight - headerHeight - footerHeight - 5 - margin;
      const availableHeightPxPerPage = Math.floor(availableHeightPts / scale);

      // Skip the header banner from the preview to avoid duplication
      let firstPageSkipPx = 0;
      const headerDomImg = element.querySelector('img[src*="bannerheader"]') as HTMLImageElement | null;
      if (headerDomImg) {
        const elementRect = element.getBoundingClientRect();
        const headerRect = headerDomImg.getBoundingClientRect();
        const relativeBottom = headerRect.bottom - elementRect.top;
        const canvasScale = fullCanvas.width / element.clientWidth;
        firstPageSkipPx = Math.max(0, Math.round(relativeBottom * canvasScale));
      }

      // Helper to draw header/footer per page
      const drawHeaderFooter = () => {
        pdf.addImage(headerImg, 'PNG', 0, 0, pageWidth, headerHeight);
        pdf.addImage(footerImg, 'PNG', 0, pageHeight - footerHeight, pageWidth, footerHeight);
      };

      // Slice the full canvas into page-sized chunks
      let sourceY = firstPageSkipPx;
      let isFirstPage = true;

      while (sourceY < fullCanvas.height) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        drawHeaderFooter();

        const sliceHeightPx = Math.min(availableHeightPxPerPage, fullCanvas.height - sourceY);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = fullCanvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create canvas context');

        ctx.drawImage(
          fullCanvas,
          0, sourceY, fullCanvas.width, sliceHeightPx,
          0, 0, fullCanvas.width, sliceHeightPx
        );

        const imgData = pageCanvas.toDataURL('image/png');
        const destX = margin;
        const destY = headerHeight + 5;
        const destW = availableWidth;
        const destH = sliceHeightPx * scale;

        pdf.addImage(imgData, 'PNG', destX, destY, destW, destH);

        sourceY += sliceHeightPx;
        isFirstPage = false;
      }

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
                minHeight: 'auto',
                width: '210mm',
                margin: '0 auto',
                boxShadow: 1,
                fontFamily: '"Roboto", Arial, sans-serif',
                position: 'relative',
                overflow: 'visible',
                '& .banner-header': {
                  width: '100%',
                  height: '160px',
                  position: 'relative',
                  marginBottom: '10px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  '& img': {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }
                },
                '& .banner-footer': {
                  width: '100%',
                  minHeight: '100px',
                  height: 'auto',
                  position: 'relative',
                  marginTop: '30px',
                  display: 'block',
                  '& img': {
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block'
                  }
                },
                '& .document-content': {
                  padding: '5px 30px 30px 30px',
                  '& h1, h2, h3, h4, h5, h6': {
                    fontFamily: '"Roboto", Arial, sans-serif',
                    fontWeight: 700
                  }
                },
                '& .document-title': {
                  fontSize: '20px',
                  fontWeight: 700,
                  textAlign: 'center',
                  marginTop: '0',
                  marginBottom: '20px',
                  color: '#000',
                  fontFamily: '"Roboto", Arial, sans-serif'
                },
                '& .section-title': {
                  fontSize: '16px',
                  fontWeight: 700,
                  marginTop: '16px',
                  marginBottom: '12px',
                  color: '#000',
                  fontFamily: '"Roboto", Arial, sans-serif'
                },
                '& p': {
                  marginBottom: '10px',
                  lineHeight: 1.5,
                  fontSize: '12px',
                  fontFamily: '"Roboto", Arial, sans-serif'
                },
                '& .document-list': {
                  marginLeft: '16px',
                  marginTop: '12px',
                  marginBottom: '16px',
                  '& li': {
                    marginBottom: '8px',
                    paddingLeft: '8px',
                    lineHeight: 1.6,
                    fontSize: '12px',
                    fontFamily: '"Roboto", Arial, sans-serif'
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