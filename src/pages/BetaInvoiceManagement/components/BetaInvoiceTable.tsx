import React, { useState } from 'react';
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
    Avatar,
    Stack,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Payment as PaymentIcon,
    Visibility as ViewIcon,
    Print as PrintIcon,
    Receipt as ReceiptIcon,
    CalendarToday as CalendarIcon,
    MonetizationOn as MoneyIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
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
    const theme = useTheme();
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);

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

    const getStatusIcon = (status: Invoice['status']) => {
        switch (status) {
            case 'paid':
                return <CheckCircleIcon sx={{ fontSize: 16 }} />;
            case 'partial':
            case 'sent':
                return <PendingIcon sx={{ fontSize: 16 }} />;
            case 'unpaid':
            case 'overdue':
            case 'cancelled':
                return <ErrorIcon sx={{ fontSize: 16 }} />;
            case 'draft':
                return <InfoIcon sx={{ fontSize: 16 }} />;
            default:
                return null;
        }
    };

    if (!invoices || invoices.length === 0) {
        return (
            <Box 
                sx={{ 
                    p: 8, 
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                    borderRadius: 2,
                }}
            >
                <ReceiptIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    No invoices found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Create your first invoice!
                </Typography>
            </Box>
        );
    }

    return (
        <TableContainer 
            sx={{ 
                borderRadius: '12px',
                overflowX: 'auto',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
        >
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                        <TableCell sx={{ 
                            fontWeight: 600, 
                            color: '#374151',
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            borderBottom: '2px solid #E5E7EB',
                            py: 2.5 
                        }}>Invoice Info</TableCell>
                        <TableCell sx={{ 
                            fontWeight: 600, 
                            color: '#374151',
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            borderBottom: '2px solid #E5E7EB',
                            py: 2.5 
                        }}>Dates</TableCell>
                        <TableCell sx={{ 
                            fontWeight: 600, 
                            color: '#374151',
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            borderBottom: '2px solid #E5E7EB',
                            py: 2.5 
                        }}>Amounts</TableCell>
                        <TableCell sx={{ 
                            fontWeight: 600, 
                            color: '#374151',
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            borderBottom: '2px solid #E5E7EB',
                            py: 2.5 
                        }}>Status</TableCell>
                        <TableCell align="center" sx={{ 
                            fontWeight: 600, 
                            color: '#374151',
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            borderBottom: '2px solid #E5E7EB',
                            py: 2.5 
                        }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {invoices.map((invoice, index) => {
                        const totalPaid = invoice.totalPaid || 0;
                        const remainingBalance = invoice.remainingBalance || 0;

                        return (
                            <TableRow 
                                key={invoice._id}
                                onMouseEnter={() => setHoveredRow(invoice._id)}
                                onMouseLeave={() => setHoveredRow(null)}
                                sx={{
                                    backgroundColor: hoveredRow === invoice._id 
                                        ? '#F1F5F9'
                                        : index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                                    transition: 'background-color 0.2s ease',
                                    '& td': {
                                        borderBottom: '1px solid #E5E7EB',
                                        py: 2.5,
                                        fontSize: '14px',
                                        color: '#111827',
                                    },
                                    '&:last-child td': {
                                        borderBottom: 'none',
                                    },
                                    cursor: 'pointer',
                                }}
                            >
                                <TableCell>
                                    <Stack spacing={0.5}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar 
                                                sx={{ 
                                                    width: 40, 
                                                    height: 40,
                                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                                                }}
                                            >
                                                <ReceiptIcon sx={{ fontSize: 20 }} />
                                            </Avatar>
                                            <Box>
                                                <Typography 
                                                    variant="body2" 
                                                    fontWeight={700}
                                                    onClick={() => handleRecordPayment(invoice._id)}
                                                    sx={{ 
                                                        cursor: 'pointer',
                                                        color: theme.palette.primary.main,
                                                        '&:hover': {
                                                            textDecoration: 'underline',
                                                        },
                                                    }}
                                                >
                                                    {invoice.invoiceNumber || 'N/A'}
                                                </Typography>
                                                {invoice.contract && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        {invoice.contract.companyName}
                                                        {invoice.contract.address ? ` • ${invoice.contract.address}` : ''}
                                                        {invoice.contract.trn ? ` • TRN: ${invoice.contract.trn}` : ''}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Stack spacing={0.5}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CalendarIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                            <Typography variant="caption" color="text.secondary">
                                                Issue: {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CalendarIcon sx={{ fontSize: 14, color: theme.palette.error.main }} />
                                            <Typography variant="caption" color="text.secondary">
                                                Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Stack spacing={0.5}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">Total:</Typography>
                                            <Typography variant="body2" fontWeight={700}>
                                                AED {(invoice.total || 0).toFixed(2)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">Paid:</Typography>
                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                color={totalPaid > 0 ? 'success.main' : 'text.secondary'}
                                            >
                                                AED {totalPaid.toFixed(2)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">Remaining:</Typography>
                                            <Typography
                                                variant="body2"
                                                fontWeight={remainingBalance > 0 ? 700 : 600}
                                                color={remainingBalance === 0 ? 'success.main' : remainingBalance > 0 ? 'error.main' : 'text.secondary'}
                                            >
                                                AED {remainingBalance.toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        {...(getStatusIcon(invoice.status || 'draft') ? { icon: getStatusIcon(invoice.status || 'draft')! } : {})}
                                        label={(invoice.status || 'draft').toUpperCase()}
                                        color={getStatusColor(invoice.status || 'draft')}
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            letterSpacing: '0.5px',
                                            boxShadow: (() => {
                                                const statusColor = getStatusColor(invoice.status || 'draft');
                                                const color = statusColor === 'default' 
                                                    ? theme.palette.grey[500] 
                                                    : theme.palette[statusColor as 'success' | 'warning' | 'error' | 'info'].main;
                                                return `0 2px 4px ${alpha(color, 0.2)}`;
                                            })(),
                                            '& .MuiChip-icon': {
                                                ml: 1,
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Stack 
                                        direction="row" 
                                        spacing={0.5}
                                        justifyContent="center"
                                        sx={{
                                            opacity: hoveredRow === invoice._id ? 1 : 0.6,
                                            transition: 'opacity 0.2s',
                                        }}
                                    >
                                        <Tooltip title="View Invoice" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => navigate(`/beta-invoices/${invoice._id}`)}
                                                sx={{
                                                    color: theme.palette.primary.main,
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                                        transform: 'scale(1.1)',
                                                    },
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <ViewIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Print Invoice" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => navigate(`/beta-invoices/${invoice._id}`)}
                                                sx={{
                                                    color: theme.palette.secondary.main,
                                                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                                                        transform: 'scale(1.1)',
                                                    },
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <PrintIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit Invoice" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(invoice._id)}
                                                sx={{
                                                    color: theme.palette.info.main,
                                                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.info.main, 0.2),
                                                        transform: 'scale(1.1)',
                                                    },
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Record Payment" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRecordPayment(invoice._id)}
                                                sx={{
                                                    color: theme.palette.success.main,
                                                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.success.main, 0.2),
                                                        transform: 'scale(1.1)',
                                                    },
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <PaymentIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete Invoice" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(invoice._id)}
                                                sx={{
                                                    color: theme.palette.error.main,
                                                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.error.main, 0.2),
                                                        transform: 'scale(1.1)',
                                                    },
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
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
