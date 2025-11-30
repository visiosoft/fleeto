import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Grid,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Alert,
    Chip,
    MenuItem,
} from '@mui/material';
import { Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Print as PrintIcon } from '@mui/icons-material';
import { Invoice } from '../../types/api';
import BetaInvoiceService from '../../services/BetaInvoiceService';

const BetaInvoicePayment: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState({
        amountPaid: '',
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        transactionId: '',
        notes: '',
    });

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await BetaInvoiceService.getInstance().getInvoiceById(id!);
            if (response.data.status === 'success') {
                setInvoice(response.data.data);
            }
        } catch (err: any) {
            setError('Failed to fetch invoice');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            const amount = Number(paymentData.amountPaid);

            if (isNaN(amount) || amount <= 0) {
                setError('Please enter a valid payment amount');
                return;
            }

            if (invoice && amount > invoice.remainingBalance!) {
                setError(`Payment amount cannot exceed remaining balance (AED ${invoice.remainingBalance?.toFixed(2)})`);
                return;
            }

            await BetaInvoiceService.getInstance().addPayment(id!, {
                ...paymentData,
                amountPaid: amount,
            });

            // Reset form and refresh invoice
            setPaymentData({
                amountPaid: '',
                paymentMethod: 'cash',
                paymentDate: new Date().toISOString().split('T')[0],
                transactionId: '',
                notes: '',
            });
            fetchInvoice();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add payment');
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (window.confirm('Are you sure you want to delete this payment?')) {
            try {
                await BetaInvoiceService.getInstance().deletePayment(id!, paymentId);
                fetchInvoice();
            } catch (err: any) {
                setError('Failed to delete payment');
            }
        }
    };

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    if (!invoice) {
        return <Typography>Invoice not found</Typography>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/beta-invoices')}
                >
                    Back to Invoices
                </Button>
                <Button
                    variant="contained"
                    startIcon={<PrintIcon />}
                    onClick={() => navigate(`/beta-invoices/${id}`)}
                >
                    View & Print Invoice
                </Button>
            </Box>

            <Typography variant="h4" gutterBottom>
                Payment Tracking - {invoice.invoiceNumber}
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Invoice Summary */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Invoice Summary
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <Typography>
                                <strong>Total Amount:</strong> AED {invoice.total?.toFixed(2)}
                            </Typography>
                            <Typography color="success.main">
                                <strong>Total Paid:</strong> AED {invoice.totalPaid?.toFixed(2)}
                            </Typography>
                            <Typography color="error.main">
                                <strong>Remaining Balance:</strong> AED {invoice.remainingBalance?.toFixed(2)}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Chip
                                    label={invoice.status}
                                    color={invoice.status === 'paid' ? 'success' : invoice.status === 'partial' ? 'warning' : 'default'}
                                />
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Add Payment Form */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Record Payment
                        </Typography>
                        <form onSubmit={handleAddPayment}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Amount Paid (AED)"
                                        value={paymentData.amountPaid}
                                        onChange={(e) => setPaymentData({ ...paymentData, amountPaid: e.target.value })}
                                        required
                                        inputProps={{ step: '0.01', min: '0.01' }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Payment Method"
                                        value={paymentData.paymentMethod}
                                        onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                                    >
                                        <MenuItem value="cash">Cash</MenuItem>
                                        <MenuItem value="card">Card</MenuItem>
                                        <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                                        <MenuItem value="cheque">Cheque</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Payment Date"
                                        value={paymentData.paymentDate}
                                        onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Transaction ID (Optional)"
                                        value={paymentData.transactionId}
                                        onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label="Notes (Optional)"
                                        value={paymentData.notes}
                                        onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        disabled={invoice.remainingBalance === 0}
                                    >
                                        Add Payment
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                </Grid>

                {/* Payment History */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Payment History
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Amount (AED)</TableCell>
                                        <TableCell>Method</TableCell>
                                        <TableCell>Transaction ID</TableCell>
                                        <TableCell>Notes</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invoice.payments && invoice.payments.length > 0 ? (
                                        invoice.payments.map((payment: any) => (
                                            <TableRow key={payment._id}>
                                                <TableCell>
                                                    {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography color="success.main" fontWeight="bold">
                                                        {payment.amountPaid?.toFixed(2)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{payment.paymentMethod}</TableCell>
                                                <TableCell>{payment.transactionId || '-'}</TableCell>
                                                <TableCell>{payment.notes || '-'}</TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeletePayment(payment._id)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                No payments recorded yet
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default BetaInvoicePayment;
