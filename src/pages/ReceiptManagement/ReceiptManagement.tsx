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
import TableToolbar from '../../components/TableToolbar';

const ReceiptManagement: React.FC = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('paymentDate');

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

  // Sort options
  const sortOptions = [
    { value: 'paymentDate', label: 'Payment Date (Newest)' },
    { value: 'amount', label: 'Amount' },
    { value: 'referenceNumber', label: 'Reference Number' },
    { value: 'clientName', label: 'Client Name (A-Z)' },
    { value: 'status', label: 'Status' },
    { value: 'paymentMethod', label: 'Payment Method' },
  ];

  // Filter and sort receipts
  const filteredAndSortedReceipts = React.useMemo(() => {
    let filtered = receipts;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = receipts.filter(receipt =>
        receipt.referenceNumber?.toLowerCase().includes(query) ||
        receipt.clientName?.toLowerCase().includes(query) ||
        receipt.clientEmail?.toLowerCase().includes(query) ||
        receipt.status?.toLowerCase().includes(query) ||
        receipt.paymentMethod?.toLowerCase().includes(query) ||
        receipt.amount?.toString().includes(query) ||
        receipt.notes?.toLowerCase().includes(query)
      );
    }
    
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'referenceNumber':
          return (a.referenceNumber || '').localeCompare(b.referenceNumber || '');
        case 'clientName':
          return (a.clientName || '').localeCompare(b.clientName || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'paymentMethod':
          return (a.paymentMethod || '').localeCompare(b.paymentMethod || '');
        case 'amount':
          return (b.amount || 0) - (a.amount || 0); // Descending
        case 'paymentDate':
        default:
          return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(); // Newest first
      }
    });
    
    return sorted;
  }, [receipts, searchQuery, sortBy]);

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
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

      <TableToolbar
        searchValue={searchQuery}
        onSearchChange={(value) => setSearchQuery(value)}
        sortValue={sortBy}
        onSortChange={(value) => setSortBy(value)}
        sortOptions={sortOptions}
        searchPlaceholder="Search receipts..."
        sortLabel="Sort By"
      />

            {loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <LinearProgress />
              </Box>
            ) : (
              <>
                <ReceiptList receipts={filteredAndSortedReceipts} onRefresh={fetchReceipts} />
                {filteredAndSortedReceipts.length > 0 && (
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
    </Container>
  );
};

export default ReceiptManagement; 