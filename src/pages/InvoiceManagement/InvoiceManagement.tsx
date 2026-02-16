import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  LinearProgress,
  Pagination,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Invoice, InvoiceStats } from '../../types/api';
import InvoiceList from './components/InvoiceList';
import InvoiceStatsCard from './components/InvoiceStatsCard';
import InvoiceService from '../../services/InvoiceService';

const InvoiceManagement: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [page]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await InvoiceService.getInstance().getAllInvoices(page, limit);
      console.log('Invoices API response:', response);
      
      if (response?.data?.status === 'success') {
        // The response data is directly an array of invoices
        if (Array.isArray(response.data.data)) {
          setInvoices(response.data.data);
        } else if (Array.isArray(response.data.data.invoices)) {
          setInvoices(response.data.data.invoices);
        } else {
          console.error('Invalid invoices data format:', response.data);
          setError('Failed to fetch invoices: Invalid data format');
          setInvoices([]);
        }
        
        // Set total pages based on total count
        const total = response.data.data.total || response.data.data.length || 0;
        setTotalPages(Math.ceil(total / limit));
      } else {
        setError(response?.data?.message || 'Failed to fetch invoices');
        setInvoices([]);
      }
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to fetch invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await InvoiceService.getInstance().getInvoiceStats();
      console.log('Invoice Stats API response:', response);
      if (response.data.status === 'success') {
        setStats(response.data.data);
      } else {
        console.error('Failed to fetch invoice stats:', response.data.message);
      }
    } catch (err) {
      console.error('Error fetching invoice stats:', err);
    }
  };

  const handleCreateInvoice = () => {
    navigate('/invoices/new');
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Invoice Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateInvoice}
        >
          Create Invoice
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <InvoiceStatsCard stats={stats} />
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <LinearProgress />
              </Box>
            ) : (
              <>
                <InvoiceList invoices={invoices} onRefresh={fetchInvoices} />
                {invoices.length > 0 && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default InvoiceManagement; 