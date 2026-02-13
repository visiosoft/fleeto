import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Tooltip,
    Box,
    Typography,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Payment as PaymentIcon,
    Visibility as ViewIcon,
    Print as PrintIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Invoice } from '../../../types/api';
import BetaInvoiceService from '../../../services/BetaInvoiceService';

interface BetaInvoiceTableProps {
    invoices: Invoice[];
    onRefresh: () => void;
}

const BetaInvoiceTable: React.FC<BetaInvoiceTableProps> = ({ invoices = [], onRefresh }) => {
    const navigate = useNavigate();

    const handleEdit = (id: string) => {
        navigate(`/beta-invoices/${id}/edit`);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                await BetaInvoiceService.getInstance().deleteInvoice(id);
                onRefresh();
            } catch (error) {
                console.error('Error deleting invoice:', error);
            }
        }
    };

    const handleRecordPayment = (id: string) => {
        navigate(`/beta-invoices/${id}/payment`);
    };

    const getStatusColor = (status: Invoice['status']) => {
        switch (status) {
            case 'paid':
                return 'success';
            case 'partial':
                return 'warning';
            case 'unpaid':
                return 'error';
            case 'overdue':
                return 'error';
            case 'sent':
                return 'info';
            case 'draft':
                return 'default';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    if (!invoices || invoices.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    No invoices found. Create your first invoice!
                </Typography>
            </Box>
        );
    }

    return (
        <TableContainer>
            <Table sx={{ '& .MuiTableRow-root': { height: '70px' } }}>
                <TableHead>
                    <TableRow>
                        <TableCell>Invoice Number</TableCell>
                        <TableCell>Issue Date</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell align="right">Total (AED)</TableCell>
                        <TableCell align="right">Paid (AED)</TableCell>
                        <TableCell align="right">Remaining (AED)</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {invoices.map((invoice) => {
                        const totalPaid = invoice.totalPaid || 0;
                        const remainingBalance = invoice.remainingBalance || 0;

                        return (
                            <TableRow key={invoice._id}>
                                <TableCell>
                                    <Box
                                        component="span"
                                        onClick={() => handleRecordPayment(invoice._id)}
                                        sx={{
                                            cursor: 'pointer',
                                            color: 'primary.main',
                                            textDecoration: 'underline',
                                            '&:hover': {
                                                color: 'primary.dark',
                                            },
                                        }}
                                    >
                                        {invoice.invoiceNumber || 'N/A'}
                                    </Box>
                                </TableCell>
                                <TableCell>{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold">
                                        {(invoice.total || 0).toFixed(2)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography
                                        variant="body2"
                                        color={totalPaid > 0 ? 'success.main' : 'text.secondary'}
                                    >
                                        {totalPaid.toFixed(2)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography
                                        variant="body2"
                                        color={remainingBalance === 0 ? 'success.main' : remainingBalance > 0 ? 'error.main' : 'text.secondary'}
                                        fontWeight={remainingBalance > 0 ? 'bold' : 'normal'}
                                    >
                                        {remainingBalance.toFixed(2)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={invoice.status || 'draft'}
                                        color={getStatusColor(invoice.status || 'draft')}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
                                        <Tooltip title="View">
                                            <IconButton
                                                size="small"
                                                onClick={() => navigate(`/beta-invoices/${invoice._id}`)}
                                                color="primary"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Print">
                                            <IconButton
                                                size="small"
                                                onClick={() => navigate(`/beta-invoices/${invoice._id}`)}
                                                color="secondary"
                                            >
                                                <PrintIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(invoice._id)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Record Payment">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRecordPayment(invoice._id)}
                                                color="success"
                                            >
                                                <PaymentIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(invoice._id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default BetaInvoiceTable;
