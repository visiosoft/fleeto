import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Grid,
  Divider,
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

  useEffect(() => {
    updatePreview();
  }, [content, contract]);

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

    // Convert markdown-like syntax to HTML
    processedContent = processedContent
      .split('\n')
      .map(line => {
        // Headers
        if (line.startsWith('# ')) {
          return `<h1>${line.slice(2)}</h1>`;
        }
        if (line.startsWith('## ')) {
          return `<h2>${line.slice(3)}</h2>`;
        }
        // Lists
        if (line.startsWith('- ')) {
          return `<li>${line.slice(2)}</li>`;
        }
        // Empty lines
        if (line.trim() === '') {
          return '<br/>';
        }
        // Regular text
        return `<p>${line}</p>`;
      })
      .join('\n');

    setPreviewContent(processedContent);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleSave = () => {
    onSave(content);
  };

  const handlePrint = async () => {
    const element = document.getElementById('contract-preview');
    if (element) {
      try {
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${contract.companyName || 'contract'}_${new Date().toISOString()}.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${contract.companyName || 'contract'}_${new Date().toISOString()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
                onClick={handlePrint}
                startIcon={<PrintIcon />}
                sx={{ mr: 1 }}
              >
                Generate PDF
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleDownload}
                startIcon={<DownloadIcon />}
              >
                Download Markdown
              </Button>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Paper 
              id="contract-preview" 
              sx={{ 
                p: 3, 
                backgroundColor: '#fff',
                minHeight: '297mm',
                width: '210mm',
                margin: '0 auto',
                boxShadow: 1,
                '& h1': { 
                  fontSize: '24px', 
                  marginBottom: '16px',
                  fontFamily: 'Arial, sans-serif'
                },
                '& h2': { 
                  fontSize: '20px', 
                  marginBottom: '12px',
                  fontFamily: 'Arial, sans-serif'
                },
                '& p': { 
                  marginBottom: '8px',
                  fontFamily: 'Arial, sans-serif',
                  lineHeight: 1.6
                },
                '& li': { 
                  marginBottom: '4px',
                  fontFamily: 'Arial, sans-serif',
                  lineHeight: 1.6
                }
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: previewContent }} />
            </Paper>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContractTemplateEditor; 