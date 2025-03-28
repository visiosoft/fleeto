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
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Invoice } from '../../../types/api';
import InvoiceService from '../../../services/InvoiceService';

interface InvoiceListProps {
  invoices: Invoice[];
  onRefresh: () => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices = [], onRefresh }) => {
  const navigate = useNavigate();

  const handleEdit = (id: string) => {
    navigate(`/invoices/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await InvoiceService.getInstance().deleteInvoice(id);
        onRefresh();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const handleRecordPayment = (id: string) => {
    navigate(`/invoices/${id}/payment`);
  };

  const handleSendInvoice = async (id: string) => {
    try {
      await InvoiceService.getInstance().sendInvoice(id);
      onRefresh();
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'overdue':
        return 'error';
      case 'sent':
        return 'warning';
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
          No invoices found
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Invoice Number</TableCell>
            <TableCell>Contract ID</TableCell>
            <TableCell>Issue Date</TableCell>
            <TableCell>Due Date</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice._id}>
              <TableCell>{invoice.invoiceNumber || 'N/A'}</TableCell>
              <TableCell>{invoice.contractId || 'N/A'}</TableCell>
              <TableCell>{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell>${(invoice.total || 0).toFixed(2)}</TableCell>
              <TableCell>
                <Chip
                  label={invoice.status || 'draft'}
                  color={getStatusColor(invoice.status || 'draft')}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Box>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(invoice._id)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  {invoice.status === 'sent' && (
                    <Tooltip title="Record Payment">
                      <IconButton
                        size="small"
                        onClick={() => handleRecordPayment(invoice._id)}
                      >
                        <PaymentIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {invoice.status === 'draft' && (
                    <Tooltip title="Send Invoice">
                      <IconButton
                        size="small"
                        onClick={() => handleSendInvoice(invoice._id)}
                      >
                        <ReceiptIcon />
                      </IconButton>
                    </Tooltip>
                  )}
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default InvoiceList; 