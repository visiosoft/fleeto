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
} from '@mui/material';
import { Invoice } from '../../types/api';
import InvoiceService from '../../services/InvoiceService';

const InvoicePayment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payment, setPayment] = useState({
    amount: 0,
    paymentMethod: '',
    transactionId: '',
    notes: '',
  });

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await InvoiceService.getInstance().getInvoiceById(id!);
      if (response.data.status === 'success') {
        setInvoice(response.data.data);
        setPayment(prev => ({
          ...prev,
          amount: response.data.data.total,
        }));
      }
    } catch (err) {
      setError('Failed to fetch invoice');
      console.error('Error fetching invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await InvoiceService.getInstance().recordPayment(id!, payment);
      navigate('/invoices');
    } catch (err) {
      setError('Failed to record payment');
      console.error('Error recording payment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!invoice) {
    return <Typography>Invoice not found</Typography>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Record Payment
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box mb={3}>
          <Typography variant="h6">Invoice Details</Typography>
          <Typography>Invoice Number: {invoice.invoiceNumber}</Typography>
          <Typography>Total Amount: ${invoice.total.toFixed(2)}</Typography>
          <Typography>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Payment Amount"
                value={payment.amount}
                onChange={(e) => setPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Payment Method"
                value={payment.paymentMethod}
                onChange={(e) => setPayment(prev => ({ ...prev, paymentMethod: e.target.value }))}
                required
              >
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Transaction ID"
                value={payment.transactionId}
                onChange={(e) => setPayment(prev => ({ ...prev, transactionId: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={payment.notes}
                onChange={(e) => setPayment(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/invoices')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default InvoicePayment;
