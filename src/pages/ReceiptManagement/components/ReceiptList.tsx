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
  Dialog,
  Avatar,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Receipt } from '../../../types/api';
import ReceiptService from '../../../services/ReceiptService';
import PrintableReceipt from './PrintableReceipt';

interface ReceiptListProps {
  receipts: Receipt[];
  onRefresh: () => void;
}

const ReceiptList: React.FC<ReceiptListProps> = ({ receipts = [], onRefresh }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    navigate(`/receipts/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try {
        await ReceiptService.getInstance().deleteReceipt(id);
        onRefresh();
      } catch (error) {
        console.error('Error deleting receipt:', error);
      }
    }
  };

  const handlePrint = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setPrintDialogOpen(true);
  };

  const handlePrintDialogClose = () => {
    setPrintDialogOpen(false);
    setSelectedReceipt(null);
  };

  const getStatusColor = (status: Receipt['status']) => {
    switch (status) {
      case 'received':
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: Receipt['status']) => {
    switch (status) {
      case 'received':
      case 'paid':
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'pending':
        return <PendingIcon sx={{ fontSize: 16 }} />;
      case 'failed':
        return <ErrorIcon sx={{ fontSize: 16 }} />;
      case 'refunded':
        return <RefreshIcon sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'cash': theme.palette.success.main,
      'card': theme.palette.primary.main,
      'bank_transfer': theme.palette.info.main,
      'credit_card': theme.palette.secondary.main,
      'cheque': theme.palette.warning.main,
    };
    return colors[method] || theme.palette.grey[500];
  };

  if (!receipts || receipts.length === 0) {
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
          No receipts found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start by creating your first receipt
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer 
        sx={{ 
          borderRadius: 3,
          overflowX: 'auto',
          boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)` }}>
              <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>
                Receipt Info
              </TableCell>
             
              <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>
                Amount
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>
                Payment
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>
                Status
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {receipts.map((receipt, index) => (
              <TableRow 
                key={receipt._id}
                onMouseEnter={() => setHoveredRow(receipt._id)}
                onMouseLeave={() => setHoveredRow(null)}
                sx={{
                  backgroundColor: hoveredRow === receipt._id 
                    ? alpha(theme.palette.primary.main, 0.04)
                    : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: hoveredRow === receipt._id ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: hoveredRow === receipt._id 
                    ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                    : 'none',
                  borderLeft: hoveredRow === receipt._id 
                    ? `4px solid ${theme.palette.primary.main}`
                    : '4px solid transparent',
                  '& td': {
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    py: 2.5,
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
                          sx={{ 
                            color: theme.palette.text.primary,
                            mb: 0.25,
                          }}
                        >
                          {receipt.referenceNumber}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                        </Typography>
                        {/* Show company info if available */}
                        {receipt.clientName && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            {receipt.clientName}
                            {receipt.clientPhone ? ` • ${receipt.clientPhone}` : ''}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </TableCell>
                
                <TableCell>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: 2,
                      py: 0.75,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.dark, 0.15)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      fontWeight={700}
                      sx={{ 
                        color: theme.palette.success.dark,
                        fontSize: '1rem',
                      }}
                    >
                      AED {receipt.amount.toFixed(2)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(receipt.paymentDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PaymentIcon sx={{ fontSize: 14, color: getPaymentMethodColor(receipt.paymentMethod) }} />
                      <Chip
                        label={receipt.paymentMethod.replace('_', ' ').toUpperCase()}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: alpha(getPaymentMethodColor(receipt.paymentMethod), 0.1),
                          color: getPaymentMethodColor(receipt.paymentMethod),
                          border: `1px solid ${alpha(getPaymentMethodColor(receipt.paymentMethod), 0.3)}`,
                          '& .MuiChip-label': {
                            px: 1,
                          }
                        }}
                      />
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    {...(getStatusIcon(receipt.status) ? { icon: getStatusIcon(receipt.status)! } : {})}
                    label={receipt.status.toUpperCase()}
                    color={getStatusColor(receipt.status)}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                      boxShadow: (() => {
                        const statusColor = getStatusColor(receipt.status);
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
                      opacity: hoveredRow === receipt._id ? 1 : 0.6,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <Tooltip title="Print Receipt" arrow>
                      <IconButton
                        size="small"
                        onClick={() => handlePrint(receipt)}
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
                        <PrintIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Receipt" arrow>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(receipt._id)}
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
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Receipt" arrow>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(receipt._id)}
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={printDialogOpen}
        onClose={handlePrintDialogClose}
        maxWidth="md"
        fullWidth
      >
        {selectedReceipt && (
          <PrintableReceipt receipt={selectedReceipt} />
        )}
      </Dialog>
    </>
  );
};

export default ReceiptList; 