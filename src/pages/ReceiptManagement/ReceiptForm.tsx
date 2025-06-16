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
} from '@mui/material';
import { Receipt } from '../../types/api';
import ReceiptService from '../../services/ReceiptService';

const ReceiptForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Partial<Receipt>>({
    invoiceId: '',
    paymentMethod: 'bank_transfer',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: '',
    clientName: '',
    clientEmail: '',
    status: 'pending',
  });

  useEffect(() => {
    if (id) {
      fetchReceipt();
    }
  }, [id]);

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
              <TextField
                fullWidth
                label="Invoice ID"
                value={receipt.invoiceId}
                onChange={(e) => setReceipt(prev => ({ ...prev, invoiceId: e.target.value }))}
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
                label="Reference Number"
                value={receipt.referenceNumber}
                onChange={(e) => setReceipt(prev => ({ ...prev, referenceNumber: e.target.value }))}
                required
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
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
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