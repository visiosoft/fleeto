import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Divider,
  FormControlLabel,
  Switch,
  Slider,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ColorLens as ColorLensIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { Letterhead } from '../../../types/api';

interface LetterheadFormProps {
  letterhead?: Letterhead | null;
  onSubmit: (data: Partial<Letterhead>) => void;
  onCancel: () => void;
}

const LetterheadForm: React.FC<LetterheadFormProps> = ({
  letterhead,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<Letterhead>>({
    name: '',
    description: '',
    isDefault: false,
    header: {
      logo: '',
      companyName: '',
      tagline: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      contact: {
        phone: '',
        email: '',
        website: '',
      },
    },
    footer: {
      text: '',
      includePageNumbers: true,
      includeDate: true,
    },
    styling: {
      primaryColor: '#1976d2',
      secondaryColor: '#424242',
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      logoSize: {
        width: 150,
        height: 60,
      },
    },
    margins: {
      top: 1,
      bottom: 1,
      left: 1,
      right: 1,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (letterhead) {
      setFormData(letterhead);
    }
  }, [letterhead]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = field.split('.');
      let current = newData as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleInputChange('header.logo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const fontFamilies = [
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Times New Roman, serif',
    'Georgia, serif',
    'Verdana, sans-serif',
    'Tahoma, sans-serif',
    'Courier New, monospace',
  ];

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Basic Information" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Template Name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isDefault || false}
                        onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                      />
                    }
                    label="Set as default template"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Header & Footer Information */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Header & Footer" />
            <CardContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                This template uses static header and footer images. The header image is loaded from <code>/bannerheader.png</code> and footer from <code>/bannerfooter2.png</code>.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: 'center', p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>Header Preview</Typography>
                    <img
                      src="/bannerheader.png"
                      alt="Header Banner Preview"
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        maxHeight: '100px',
                        border: '1px solid #ddd',
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: 'center', p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>Footer Preview</Typography>
                    <img
                      src="/bannerfooter2.png"
                      alt="Footer Banner Preview"
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        maxHeight: '100px',
                        border: '1px solid #ddd',
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Custom Text */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Custom Text" />
            <CardContent>
              <TextField
                fullWidth
                label="Custom Text"
                value={formData.customText || ''}
                onChange={(e) => handleInputChange('customText', e.target.value)}
                multiline
                rows={4}
                placeholder="Enter any custom text that will appear in the letterhead..."
                helperText="This text will be displayed in the letterhead template"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Styling */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Styling" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Primary Color"
                    type="color"
                    value={formData.styling?.primaryColor || '#1976d2'}
                    onChange={(e) => handleInputChange('styling.primaryColor', e.target.value)}
                    InputProps={{
                      startAdornment: <ColorLensIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Secondary Color"
                    type="color"
                    value={formData.styling?.secondaryColor || '#424242'}
                    onChange={(e) => handleInputChange('styling.secondaryColor', e.target.value)}
                    InputProps={{
                      startAdornment: <ColorLensIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Font Family"
                    value={formData.styling?.fontFamily || 'Arial, sans-serif'}
                    onChange={(e) => handleInputChange('styling.fontFamily', e.target.value)}
                    SelectProps={{ native: true }}
                  >
                    {fontFamilies.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Font Size: {formData.styling?.fontSize || 12}px</Typography>
                  <Slider
                    value={formData.styling?.fontSize || 12}
                    onChange={(_, value) => handleInputChange('styling.fontSize', value)}
                    min={8}
                    max={24}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Logo Width: {formData.styling?.logoSize?.width || 150}px</Typography>
                  <Slider
                    value={formData.styling?.logoSize?.width || 150}
                    onChange={(_, value) => handleInputChange('styling.logoSize.width', value)}
                    min={50}
                    max={300}
                    step={10}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Logo Height: {formData.styling?.logoSize?.height || 60}px</Typography>
                  <Slider
                    value={formData.styling?.logoSize?.height || 60}
                    onChange={(_, value) => handleInputChange('styling.logoSize.height', value)}
                    min={20}
                    max={120}
                    step={5}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Margins */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Page Margins (inches)" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography gutterBottom>Top: {formData.margins?.top || 1}"</Typography>
                  <Slider
                    value={formData.margins?.top || 1}
                    onChange={(_, value) => handleInputChange('margins.top', value)}
                    min={0.5}
                    max={3}
                    step={0.1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography gutterBottom>Bottom: {formData.margins?.bottom || 1}"</Typography>
                  <Slider
                    value={formData.margins?.bottom || 1}
                    onChange={(_, value) => handleInputChange('margins.bottom', value)}
                    min={0.5}
                    max={3}
                    step={0.1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography gutterBottom>Left: {formData.margins?.left || 1}"</Typography>
                  <Slider
                    value={formData.margins?.left || 1}
                    onChange={(_, value) => handleInputChange('margins.left', value)}
                    min={0.5}
                    max={3}
                    step={0.1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography gutterBottom>Right: {formData.margins?.right || 1}"</Typography>
                  <Slider
                    value={formData.margins?.right || 1}
                    onChange={(_, value) => handleInputChange('margins.right', value)}
                    min={0.5}
                    max={3}
                    step={0.1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained">
          {letterhead ? 'Update' : 'Create'} Letterhead
        </Button>
      </Box>
    </Box>
  );
};

export default LetterheadForm;
