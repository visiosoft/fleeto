import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  LinearProgress,
  Autocomplete,
  Chip,
} from '@mui/material';
import { Receipt, Invoice } from '../../types/api';
import ReceiptService from '../../services/ReceiptService';
import InvoiceService from '../../services/InvoiceService';

const ReceiptForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [receipt, setReceipt] = useState<Partial<Receipt>>({
    invoiceId: '',
    paymentMethod: 'bank_transfer',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    status: 'pending',
  });

  useEffect(() => {
    if (id) {
      fetchReceipt();
    } else {
      fetchInvoices();
    }
  }, [id]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await InvoiceService.getInstance().getAllInvoices(1, 100);
      if (response.data.status === 'success') {
        setInvoices(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSelect = (invoice: Invoice | null) => {
    setSelectedInvoice(invoice);
    if (invoice) {
      setReceipt(prev => ({
        ...prev,
        invoiceId: invoice.invoiceNumber,
        referenceNumber: invoice.invoiceNumber, // Copy invoice ID to reference ID
        clientName: invoice.contract?.companyName || '',
        clientEmail: invoice.contract?.contactEmail || '',
        clientPhone: invoice.contract?.contactPhone || '',
        amount: invoice.total || 0,
      }));
    }
  };

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const response = await ReceiptService.getInstance().getReceiptById(id!);
      if (response.data.status === 'success') {
        setReceipt(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch receipt');
      console.error('Error fetching receipt:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!receipt.amount || receipt.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      if (!receipt.clientName) {
        throw new Error('Client name is required');
      }

      if (id) {
        await ReceiptService.getInstance().updateReceipt(id, receipt);
      } else {
        await ReceiptService.getInstance().createReceipt(receipt as Omit<Receipt, '_id' | 'createdAt' | 'updatedAt'>);
      }
      navigate('/receipts');
    } catch (err: any) {
      console.error('Error saving receipt:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save receipt');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {id ? 'Edit Receipt' : 'Create Receipt'}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                options={invoices}
                getOptionLabel={(option) => `${option.invoiceNumber} - ${option.contract?.companyName || 'Unknown Client'} (${option.contract?.contactPhone || 'No Phone'})`}
                value={selectedInvoice}
                onChange={(_, newValue) => handleInvoiceSelect(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Invoice"
                    placeholder="Search by invoice number or client name"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {option.invoiceNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.contract?.companyName || 'Unknown Client'} - ${option.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        📞 {option.contract?.contactPhone || 'No Phone'} | ✉️ {option.contract?.contactEmail || 'No Email'}
                      </Typography>
                    </Box>
                  </Box>
                )}
                isOptionEqualToValue={(option, value) => option._id === value?._id}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Invoice ID (Auto-filled)"
                value={receipt.invoiceId}
                onChange={(e) => setReceipt(prev => ({ ...prev, invoiceId: e.target.value }))}
                disabled
                helperText="This field is automatically filled when you select an invoice above"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Payment Method"
                value={receipt.paymentMethod}
                onChange={(e) => setReceipt(prev => ({ ...prev, paymentMethod: e.target.value as Receipt['paymentMethod'] }))}
                required
              >
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Amount"
                value={receipt.amount}
                onChange={(e) => setReceipt(prev => ({ ...prev, amount: Number(e.target.value) }))}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Payment Date"
                value={receipt.paymentDate}
                onChange={(e) => setReceipt(prev => ({ ...prev, paymentDate: e.target.value }))}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reference Number (Auto-filled)"
                value={receipt.referenceNumber}
                onChange={(e) => setReceipt(prev => ({ ...prev, referenceNumber: e.target.value }))}
                required
                helperText="This field is automatically filled with the invoice ID when you select an invoice"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={receipt.status}
                onChange={(e) => setReceipt(prev => ({ ...prev, status: e.target.value as Receipt['status'] }))}
                required
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="received">Received</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Client Name"
                value={receipt.clientName}
                onChange={(e) => setReceipt(prev => ({ ...prev, clientName: e.target.value }))}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label="Client Email"
                value={receipt.clientEmail}
                onChange={(e) => setReceipt(prev => ({ ...prev, clientEmail: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="tel"
                label="Client Phone"
                value={receipt.clientPhone}
                onChange={(e) => setReceipt(prev => ({ ...prev, clientPhone: e.target.value }))}
                placeholder="+971 XX XXX XXXX"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={receipt.notes}
                onChange={(e) => setReceipt(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/receipts')}
                  sx={{
                    color: '#6B7280',
                    borderColor: '#D1D5DB',
                    fontWeight: 500,
                    fontSize: '14px',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#F3F4F6',
                      borderColor: '#9CA3AF',
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    backgroundColor: '#2563EB !important',
                    color: '#FFFFFF !important',
                    fontWeight: 600,
                    fontSize: '14px',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    textTransform: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    '&:hover': {
                      backgroundColor: '#1D4ED8 !important',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    },
                    '&:disabled': {
                      backgroundColor: '#9CA3AF !important',
                      color: '#FFFFFF !important',
                    },
                  }}
                >
                  {loading ? 'Saving...' : 'Save Receipt'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default ReceiptForm; 