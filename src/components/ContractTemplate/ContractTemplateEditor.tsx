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
import { API_ENDPOINTS } from '../../config/environment';

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
<div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #14081F; font-size: 12px; line-height: 1.45;">

  <div style="display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid #14081F; padding-bottom: 12px; margin-bottom: 16px;">
    <div>
      <div style="text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; font-size: 9px; color: #4A1FA0; margin-bottom: 4px;">Vehicle Rental Agreement</div>
      <h1 style="font-family: 'Bricolage Grotesque', serif; font-weight: 800; font-size: 24px; letter-spacing: -0.02em; margin: 0; color: #1A0B33;">Rental Agreement</h1>
    </div>
    <div style="text-align: right; font-size: 10px; color: #756E80; font-weight: 500;">
      <div>Dubai, UAE</div>
      <div>Entered into [Start Date]</div>
    </div>
  </div>

  <p style="margin: 0 0 14px; color: #4A4357;">This Vehicle Rental Agreement (the &ldquo;Agreement&rdquo;) is made and entered into on <strong style="color: #14081F;">[Start Date]</strong> in Dubai, United Arab Emirates.</p>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
    <div style="border: 1px solid rgba(20,8,31,.14); border-radius: 8px; padding: 12px 14px;">
      <div style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 9px; font-weight: 700; color: #756E80; margin-bottom: 4px;">Company</div>
      <div style="font-weight: 700; font-size: 12px; margin-bottom: 2px;">Efficient Move New Used Furniture Removal L.L.C</div>
      <div style="color: #4A4357; font-size: 11px;">UAE &middot; TL# 1383686 &middot; Dubai</div>
    </div>
    <div style="border: 1px solid rgba(20,8,31,.14); border-radius: 8px; padding: 12px 14px;">
      <div style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 9px; font-weight: 700; color: #756E80; margin-bottom: 4px;">Client</div>
      <div style="font-weight: 700; font-size: 12px; margin-bottom: 2px;">[Client Company Name]</div>
      <div style="color: #4A4357; font-size: 11px;">TL# [Client Trade License No] &middot; [Contact Person]</div>
    </div>
  </div>

  <div style="border: 1px solid #DDD0FF; background: #F7F3FF; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;">
    <div style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 9px; font-weight: 700; color: #4A1FA0; margin-bottom: 10px;">Key Terms at a Glance</div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 16px;">
      <div>
        <div style="font-size: 9px; color: #756E80; margin-bottom: 2px;">Vehicle</div>
        <div style="font-weight: 700; font-size: 11px;">[Vehicle Make] [Vehicle Model] [Vehicle Year]</div>
        <div style="font-size: 10px; color: #4A4357;">Plate [Vehicle License Plate]</div>
      </div>
      <div>
        <div style="font-size: 9px; color: #756E80; margin-bottom: 2px;">Duration</div>
        <div style="font-weight: 700; font-size: 11px;">[Start Date] &ndash; [End Date]</div>
      </div>
      <div>
        <div style="font-size: 9px; color: #756E80; margin-bottom: 2px;">Total Rental Value</div>
        <div style="font-weight: 700; font-size: 11px;">AED [Value]</div>
      </div>
      <div>
        <div style="font-size: 9px; color: #756E80; margin-bottom: 2px;">Security Deposit</div>
        <div style="font-weight: 700; font-size: 11px;">AED [Security Deposit]</div>
      </div>
      <div>
        <div style="font-size: 9px; color: #756E80; margin-bottom: 2px;">Payment Method</div>
        <div style="font-weight: 700; font-size: 11px;">[Payment Method]</div>
      </div>
      <div>
        <div style="font-size: 9px; color: #756E80; margin-bottom: 2px;">Mileage Cap</div>
        <div style="font-weight: 700; font-size: 11px;">[Mileage Cap] km / month</div>
      </div>
    </div>
  </div>

  <h2 style="font-family: 'Bricolage Grotesque', serif; font-weight: 700; font-size: 15px; color: #1A0B33; margin: 0 0 6px;">Vehicle Information</h2>
  <p style="margin: 0 0 4px; color: #4A4357;">The Company hereby rents to the Client the following vehicle without driver:</p>
  <div style="margin: 0 0 16px 18px; color: #14081F;">
    <div>License Plate: <strong>[Vehicle License Plate]</strong> &middot; Make/Model/Year: <strong>[Vehicle Make] [Vehicle Model] [Vehicle Year]</strong></div>
  </div>

  <h2 style="font-family: 'Bricolage Grotesque', serif; font-weight: 700; font-size: 15px; color: #1A0B33; margin: 0 0 10px;">Terms and Conditions</h2>

  <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Contract Duration and Value</h3>
  <div style="margin: 0 0 8px 18px;">
    <div>Duration: From [Start Date] to [End Date] &middot; Renewal: mutual written consent only</div>
    <div>Total Rental Value: AED [Value] &middot; Security Deposit: AED [Security Deposit] &middot; Payment: [Payment Method]</div>
  </div>
  <p style="margin: 0 0 12px; color: #4A4357; font-size: 11px;">Security Deposit refundable within 21 days after vehicle return, subject to inspection, clearance of fines, Salik charges, and settlement of all outstanding dues. The Company reserves the right to deduct unpaid amounts, damages, fines, repair costs, or other liabilities from the deposit.</p>

  <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Vehicle Handover and Condition</h3>
  <p style="margin: 0 0 12px; color: #4A4357;">The Vehicle shall be delivered in good working and roadworthy condition. A vehicle handover report shall be signed by both Parties at delivery and return. The Client confirms receipt of the Vehicle in satisfactory condition.</p>

  <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Payment Default</h3>
  <p style="margin: 0 0 12px; color: #4A4357;">In case of cheque dishonor or delayed payment, the Company reserves the right to immediately repossess the Vehicle without prior notice and pursue legal remedies under UAE law.</p>

  <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Client Responsibilities</h3>
  <ul style="margin: 0 0 6px; padding-left: 18px; color: #4A4357;">
    <li>Fuel and petrol costs</li>
    <li>Salik (toll) charges</li>
    <li>Traffic fines, black points, parking violations, and impound charges &mdash; must be paid within 3 days</li>
    <li>Compliance with all UAE traffic laws and regulations</li>
  </ul>
  <p style="margin: 0 0 12px; color: #4A4357;">The Client shall ensure that only legally licensed drivers operate the Vehicle.</p>

  <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Maintenance and Repairs</h3>
  <div style="margin: 0 0 12px; color: #4A4357;">
    <p style="margin: 0 0 4px;"><strong style="color: #14081F;">Routine Maintenance:</strong> Client responsible for all routine/preventive maintenance (monthly oil change, filters, brake inspection, tire rotation) at reputable garages using manufacturer-approved parts.</p>
    <p style="margin: 0 0 4px;"><strong style="color: #14081F;">Operational Liability:</strong> Client assumes full financial responsibility for damages from accidents, negligence, misuse, overloading, overheating, or failure to maintain.</p>
    <p style="margin: 0 0 4px;"><strong style="color: #14081F;">Major Repairs:</strong> Company responsible only for major mechanical defects from normal wear and tear, not caused by misuse or negligence.</p>
    <p style="margin: 0 0 4px;"><strong style="color: #14081F;">Accidents:</strong> Valid Dubai Police report mandatory. Insurance deductible borne by Client. Damage without police report fully payable by Client.</p>
    <p style="margin: 0 0 4px;"><strong style="color: #14081F;">Authorization:</strong> No non-routine repair without prior written Company approval. Unauthorized repairs not reimbursed.</p>
    <p style="margin: 0;"><strong style="color: #14081F;">Records:</strong> Client shall maintain proper maintenance records and provide upon request.</p>
  </div>

  <div style="border: 1.5px solid #B45309; background: #FEF6E7; border-radius: 8px; padding: 12px 14px; margin: 0 0 14px;">
    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
      <span style="width: 6px; height: 6px; border-radius: 999px; background: #B45309; display: inline-block;"></span>
      <span style="text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; font-weight: 700; color: #92400E;">Mileage Limit and Excess Charges</span>
    </div>
    <p style="margin: 0; color: #78350F; font-weight: 500; font-size: 11px;">Maximum [Mileage Cap] km per month. Excess charged at [Excess Mileage Rate] AED per additional km. Odometer recorded at start/end of each month; excess invoiced separately and payable within 7 days.</p>
  </div>

  <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Prohibited Use</h3>
  <p style="margin: 0 0 12px; color: #4A4357;">The Vehicle shall not be used for illegal activities, racing, reckless driving, sub-renting, or transport outside Dubai without written Company consent.</p>

  <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Termination</h3>
  <ul style="margin: 0 0 12px; padding-left: 18px; color: #4A4357;">
    <li>Early termination requires 30 days written notice and full settlement of remaining rental value.</li>
    <li>Either Party may terminate for material breach with 30 days written notice.</li>
    <li>Upon termination, Vehicle must be returned immediately and all dues settled.</li>
  </ul>

  <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Vehicle Return</h3>
  <p style="margin: 0 0 12px; color: #4A4357;">Vehicle shall be returned to Company premises or agreed location in clean condition with all keys and documents. Failure to return may result in legal action.</p>

  <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Governing Law and Jurisdiction</h3>
  <p style="margin: 0 0 12px; color: #4A4357;">Governed by the laws of the UAE. Courts of Dubai have exclusive jurisdiction.</p>

  <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Entire Agreement</h3>
  <p style="margin: 0 0 20px; color: #4A4357;">This Agreement constitutes the entire understanding between the Parties and supersedes all prior agreements. Any amendment must be in writing and signed by both Parties.</p>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
    <div>
      <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #1A0B33; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid rgba(20,8,31,.14);">For Efficient Move New Used Furniture Removal L.L.C</div>
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px; color: #4A4357;">
        <div>Name: <span style="display: inline-block; border-bottom: 1px dotted #756E80; width: 58%;">&nbsp;</span></div>
        <div>License No: <strong style="color: #14081F;">1383686</strong></div>
        <div>Signature: <span style="display: inline-block; border-bottom: 1px dotted #756E80; width: 58%;">&nbsp;</span></div>
        <div>Date: <span style="display: inline-block; border-bottom: 1px dotted #756E80; width: 58%;">&nbsp;</span></div>
      </div>
    </div>
    <div>
      <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #1A0B33; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid rgba(20,8,31,.14);">For [Client Company Name]</div>
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px; color: #4A4357;">
        <div>Name: <strong style="color: #14081F;">[Contact Person]</strong></div>
        <div>License No: <strong style="color: #14081F;">[Client Trade License No]</strong></div>
        <div>Signature: <span style="display: inline-block; border-bottom: 1px dotted #756E80; width: 58%;">&nbsp;</span></div>
        <div>Date: <span style="display: inline-block; border-bottom: 1px dotted #756E80; width: 58%;">&nbsp;</span></div>
      </div>
    </div>
  </div>

</div>
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
  const [headerImage, setHeaderImage] = useState<string>('/bannerheader.png');
  const [footerImage, setFooterImage] = useState<string>('/bannerfooter2.png');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

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
      .replace(/\[Security Deposit\]/g, ((contract as any).securityDeposit || 1000).toLocaleString('en-AE'))
      .replace(/\[Payment Method\]/g, (contract as any).paymentMethod || 'Post-Dated Cheque')
      .replace(/\[Mileage Cap\]/g, ((contract as any).mileageCap || 5000).toLocaleString('en-AE'))
      .replace(/\[Excess Mileage Rate\]/g, ((contract as any).excessMileageRate || 1).toString())
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
      headerImg.src = headerImage;
      await new Promise((resolve, reject) => {
        headerImg.onload = resolve as any;
        headerImg.onerror = reject as any;
        setTimeout(reject, 5000);
      });
      const headerHeight = 160; // reduce to leave more room per page

      // Preload footer banner
      const footerImg = new Image();
      footerImg.src = footerImage;
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
      const headerDomImg = element.querySelector('.banner-header img') as HTMLImageElement | null;
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
        const remainingPx = fullCanvas.height - sourceY;
        if (!isFirstPage && remainingPx < 50) break;

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
      headerImg.src = headerImage;
      await new Promise((resolve, reject) => {
        headerImg.onload = resolve as any;
        headerImg.onerror = reject as any;
        setTimeout(reject, 5000);
      });
      const headerHeight = 120;

      // Preload footer banner
      const footerImg = new Image();
      footerImg.src = footerImage;
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
      const headerDomImg = element.querySelector('.banner-header img') as HTMLImageElement | null;
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
        // Skip if remaining content is negligible (< 50px of source content)
        const remainingPx = fullCanvas.height - sourceY;
        if (!isFirstPage && remainingPx < 50) break;

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
                <img src={headerImage} alt="Header Banner" />
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