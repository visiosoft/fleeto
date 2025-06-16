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
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Receipt } from '../../types/api';
import ReceiptList from './components/ReceiptList';
import ReceiptService from '../../services/ReceiptService';

const ReceiptManagement: React.FC = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    fetchReceipts();
  }, [page]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ReceiptService.getInstance().getAllReceipts(page, limit);
      
      if (response?.data?.status === 'success') {
        if (Array.isArray(response.data.data)) {
          setReceipts(response.data.data);
        } else if (Array.isArray(response.data.data.receipts)) {
          setReceipts(response.data.data.receipts);
        } else {
          console.error('Invalid receipts data format:', response.data);
          setError('Failed to fetch receipts: Invalid data format');
          setReceipts([]);
        }
        
        const total = response.data.data.total || response.data.data.length || 0;
        setTotalPages(Math.ceil(total / limit));
      } else {
        setError(response?.data?.message || 'Failed to fetch receipts');
        setReceipts([]);
      }
    } catch (err: any) {
      console.error('Error fetching receipts:', err);
      setError(err.message || 'Failed to fetch receipts');
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReceipt = () => {
    navigate('/receipts/new');
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Receipt Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateReceipt}
        >
          Create Receipt
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <LinearProgress />
              </Box>
            ) : (
              <>
                <ReceiptList receipts={receipts} onRefresh={fetchReceipts} />
                {receipts.length > 0 && (
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

export default ReceiptManagement; 