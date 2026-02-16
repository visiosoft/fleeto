import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    Chip,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Print as PrintIcon,
    Send as SendIcon,
    Payment as PaymentIcon,
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { Invoice } from '../../types/api';
import BetaInvoiceService from '../../services/BetaInvoiceService';


const BetaInvoiceView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const componentRef = useRef(null);

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const response = await BetaInvoiceService.getInstance().getInvoiceById(id!);
            if (response.data.status === 'success') {
                setInvoice(response.data.data);
            } else {
                setError('Failed to load invoice');
            }
        } catch (err) {
            setError('Error loading invoice');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleMarkAsSent = async () => {
        if (!invoice) return;
        try {
            await BetaInvoiceService.getInstance().updateInvoice(invoice._id, { status: 'sent' });
            fetchInvoice();
        } catch (err) {
            console.error('Error updating status:', err);
            setError('Failed to update status');
        }
    };

    if (loading) return <Box p={3} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!invoice) return <Alert severity="warning">Invoice not found</Alert>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .printable-invoice, .printable-invoice * {
                            visibility: visible;
                        }
                        .printable-invoice {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            margin: 0;
                            padding: 0 !important;
                            box-shadow: none !important;
                            font-size: 0.75em;
                        }
                        .invoice-header {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            z-index: 1000;
                        }
                        .invoice-footer {
                            position: fixed;
                            bottom: 0;
                            left: 0;
                            width: 100%;
                            z-index: 1000;
                        }
                        .invoice-content {
                            margin-top: 140px;
                            margin-bottom: 140px;
                            padding: 0 10px;
                        }
                        .printable-invoice .MuiBox-root {
                            margin-bottom: 4px !important;
                        }
                        .printable-invoice .MuiTableContainer-root {
                            margin-bottom: 4px !important;
                        }
                        .printable-invoice .MuiDivider-root {
                            margin: 4px 0 !important;
                        }
                        @page {
                            margin: 0.3cm;
                            size: A4;
                        }
                    }
                `}
            </style>

            {/* Action Buttons - Hidden when printing */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} sx={{ '@media print': { display: 'none' } }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/beta-invoices')}>
                    Back
                </Button>
                <Box>
                    {invoice.status === 'draft' && (
                        <Button
                            variant="outlined"
                            startIcon={<SendIcon />}
                            onClick={handleMarkAsSent}
                            sx={{ mr: 1 }}
                        >
                            Mark as Sent
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/beta-invoices/${invoice._id}/edit`)}
                        sx={{ mr: 1 }}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<PaymentIcon />}
                        onClick={() => navigate(`/beta-invoices/${invoice._id}/payment`)}
                        sx={{ mr: 1 }}
                    >
                        Payments
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={handlePrint}
                    >
                        Print / PDF
                    </Button>
                </Box>
            </Box>

            {/* Invoice Content */}
            <Paper
                ref={componentRef}
                className="printable-invoice"
                sx={{
                    p: 5,
                    position: 'relative',
                    minHeight: '29.7cm',
                    '@media print': {
                        boxShadow: 'none',
                        p: 0,
                        minHeight: 'auto',
                    }
                }}
            >
                {/* Banner Header */}
                <Box className="invoice-header" mb={2} sx={{ mx: -5, mt: -5, '@media print': { mx: 0, mt: 0, mb: 0 } }}>
                    <img
                        src="/bannerheader.png"
                        alt="Header"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                </Box>

                {/* Main Invoice Content */}
                <Box className="invoice-content">
                    {/* Header Text */}
                    <Box display="flex" justifyContent="space-between" mb={2} px={0} sx={{ '@media print': { mb: 1 } }}>
                        <Box>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                                INVOICE
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                #{invoice.invoiceNumber}
                            </Typography>
                            <Box mt={2}>
                                <Chip
                                    label={invoice.status.toUpperCase()}
                                    color={invoice.status === 'paid' ? 'success' : invoice.status === 'sent' ? 'info' : 'default'}
                                    size="small"
                                />
                            </Box>
                        </Box>
                        <Box textAlign="right">
                            <Typography variant="h6" fontWeight="bold">Efficient Move</Typography>
                            <Typography variant="body2">New & Used Furniture Removal L.L.C</Typography>
                            <Typography variant="body2">Dubai, UAE</Typography>
                            <Typography variant="body2">Phone: +971569420950</Typography>
                            <Typography variant="body2">License No: 1383686</Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 2, '@media print': { mb: 1 } }} />

                    {/* Bill To & Details */}
                    <Grid container spacing={4} mb={2} sx={{ '@media print': { mb: 1, spacing: 2 } }}>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                BILL TO
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                                {invoice.contract?.companyName || 'Unknown Company'}
                            </Typography>
                            <Typography variant="body2">
                                {invoice.contract?.address}
                            </Typography>
                            <Typography variant="body2">
                                {invoice.contract?.contactPhone}
                            </Typography>
                            {invoice.contract?.tradeLicenseNo && (
                                <Typography variant="body2">
                                    License No: {invoice.contract.tradeLicenseNo}
                                </Typography>
                            )}
                            {invoice.contract?.trn && (
                                <Typography variant="body2">
                                    TRN: {invoice.contract.trn}
                                </Typography>
                            )}
                        </Grid>
                        <Grid item xs={6} textAlign="right">
                            <Box mb={2}>
                                <Typography variant="caption" color="text.secondary">
                                    ISSUE DATE
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                    {new Date(invoice.issueDate).toLocaleDateString()}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    DUE DATE
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Line Items */}
                    <TableContainer sx={{ mb: 2, overflowX: 'auto', '@media print': { mb: 1 } }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell><strong>Description</strong></TableCell>
                                    <TableCell align="right"><strong>Qty</strong></TableCell>
                                    <TableCell align="right"><strong>Unit Price</strong></TableCell>
                                    <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {invoice.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell align="right">{item.quantity}</TableCell>
                                        <TableCell align="right">{item.unitPrice.toFixed(2)}</TableCell>
                                        <TableCell align="right">{item.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Totals */}
                    <Box display="flex" justifyContent="flex-end" mb={2} sx={{ '@media print': { mb: 1 } }}>
                        <Box width="300px">
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography>Subtotal:</Typography>
                                <Typography>AED {invoice.subtotal.toFixed(2)}</Typography>
                            </Box>
                            {!!invoice.includeVat && (
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography>VAT (5%):</Typography>
                                    <Typography>AED {invoice.tax.toFixed(2)}</Typography>
                                </Box>
                            )}
                            <Divider sx={{ my: 1 }} />
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="h6">Total:</Typography>
                                <Typography variant="h6">AED {invoice.total.toFixed(2)}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mb={1} color="success.main">
                                <Typography>Paid:</Typography>
                                <Typography>AED {(invoice.totalPaid || 0).toFixed(2)}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" color="error.main">
                                <Typography fontWeight="bold">Balance Due:</Typography>
                                <Typography fontWeight="bold">AED {(invoice.remainingBalance || 0).toFixed(2)}</Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Payment History */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <Box mb={2} sx={{ '@media print': { mb: 1 } }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                PAYMENT HISTORY
                            </Typography>
                            <TableContainer sx={{ overflowX: 'auto' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell><strong>Date</strong></TableCell>
                                            <TableCell><strong>Method</strong></TableCell>
                                            <TableCell><strong>Description</strong></TableCell>
                                            <TableCell align="right"><strong>Amount</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {invoice.payments.map((payment, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>{payment.paymentMethod}</TableCell>
                                                <TableCell>{payment.notes || '-'}</TableCell>
                                                <TableCell align="right">
                                                    AED {(payment.amount || payment.amountPaid || 0).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    {/* Notes */}
                    {invoice.notes && (
                        <Box mb={2} sx={{ '@media print': { mb: 1 } }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                NOTES
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {invoice.notes}
                            </Typography>
                        </Box>
                    )}

                    {/* Bank Details */}
                    <Box mb={2} sx={{ '@media print': { mb: 1 } }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }} align="center">
                            EFFICIENT MOVE NEW & USED FURNITURE REMOVAL L.L.C
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }} align="center">
                            Bank Name: WIO Bank
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }} align="center">
                            Account Number: 9834601124
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }} align="center">
                            IBAN: AE230860000009834601124
                        </Typography>
                    </Box>
                </Box>

                {/* Banner Footer */}
                <Box className="invoice-footer" sx={{ mx: -5, mb: -5, '@media print': { mx: 0, mb: 0 } }}>
                    <img
                        src="/bannerfooter.png"
                        alt="Footer"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                </Box>
            </Paper>
        </Container>
    );
};

export default BetaInvoiceView;
