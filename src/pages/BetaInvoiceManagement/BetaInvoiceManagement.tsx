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
import BetaInvoiceTable from './components/BetaInvoiceTable';
import BetaInvoiceStats from './components/BetaInvoiceStats';
import BetaInvoiceService from '../../services/BetaInvoiceService';
import TableToolbar from '../../components/TableToolbar';

const BetaInvoiceManagement: React.FC = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [stats, setStats] = useState<InvoiceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('issueDate');

    useEffect(() => {
        fetchInvoices();
        fetchStats();
    }, [page]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await BetaInvoiceService.getInstance().getAllInvoices(page, limit);

            if (response?.data?.status === 'success') {
                if (Array.isArray(response.data.data)) {
                    setInvoices(response.data.data);
                } else {
                    setError('Invalid data format');
                    setInvoices([]);
                }

                const total = response.data.data.length || 0;
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
            const response = await BetaInvoiceService.getInstance().getInvoiceStats();
            if (response.data.status === 'success') {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching invoice stats:', err);
        }
    };

    const handleCreateInvoice = () => {
        navigate('/beta-invoices/new');
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    // Sort options
    const sortOptions = [
        { value: 'issueDate', label: 'Issue Date (Newest)' },
        { value: 'dueDate', label: 'Due Date' },
        { value: 'invoiceNumber', label: 'Invoice Number' },
        { value: 'status', label: 'Status' },
        { value: 'total', label: 'Total Amount' },
        { value: 'companyName', label: 'Company Name (A-Z)' },
    ];

    // Filter and sort invoices
    const filteredAndSortedInvoices = React.useMemo(() => {
        let filtered = invoices;
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = invoices.filter(invoice =>
                invoice.invoiceNumber?.toLowerCase().includes(query) ||
                invoice.contract?.companyName?.toLowerCase().includes(query) ||
                invoice.status?.toLowerCase().includes(query) ||
                invoice.total?.toString().includes(query) ||
                invoice.notes?.toLowerCase().includes(query)
            );
        }
        
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'invoiceNumber':
                    return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
                case 'companyName':
                    return (a.contract?.companyName || '').localeCompare(b.contract?.companyName || '');
                case 'status':
                    return (a.status || '').localeCompare(b.status || '');
                case 'total':
                    return (b.total || 0) - (a.total || 0); // Descending
                case 'dueDate':
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                case 'issueDate':
                default:
                    return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(); // Newest first
            }
        });
        
        return sorted;
    }, [invoices, searchQuery, sortBy]);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography 
                    variant="h4" 
                    component="h1"
                    sx={{
                        fontSize: '28px',
                        fontWeight: 600,
                        color: '#111827',
                    }}
                >
                    Beta Invoice Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateInvoice}
                    sx={{
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '14px',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        textTransform: 'none',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        '&:hover': {
                            backgroundColor: '#1D4ED8',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        },
                    }}
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
                    <BetaInvoiceStats stats={stats} />
                </Grid>
                <Grid item xs={12}>
                    <TableToolbar
                        searchValue={searchQuery}
                        onSearchChange={(value) => setSearchQuery(value)}
                        sortValue={sortBy}
                        onSortChange={(value) => setSortBy(value)}
                        sortOptions={sortOptions}
                        searchPlaceholder="Search invoices..."
                        sortLabel="Sort By"
                    />
                </Grid>
                <Grid item xs={12}>
                        {loading ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <LinearProgress />
                            </Box>
                        ) : (
                            <>
                                <BetaInvoiceTable invoices={filteredAndSortedInvoices} onRefresh={fetchInvoices} />
                                {filteredAndSortedInvoices.length > 0 && (
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
                </Grid>
            </Grid>
        </Container>
    );
};

export default BetaInvoiceManagement;
