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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
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
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

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

  if (!receipts || receipts.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No receipts found
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Reference Number</TableCell>
              <TableCell>Invoice ID</TableCell>
              <TableCell>Client Name</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Payment Date</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {receipts.map((receipt) => (
              <TableRow key={receipt._id}>
                <TableCell>{receipt.referenceNumber}</TableCell>
                <TableCell>{receipt.invoiceId}</TableCell>
                <TableCell>{receipt.clientName}</TableCell>
                <TableCell>AED {receipt.amount.toFixed(2)}</TableCell>
                <TableCell>{new Date(receipt.paymentDate).toLocaleDateString()}</TableCell>
                <TableCell>{receipt.paymentMethod.replace('_', ' ').toUpperCase()}</TableCell>
                <TableCell>
                  <Chip
                    label={receipt.status}
                    color={getStatusColor(receipt.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(receipt._id)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print">
                      <IconButton
                        size="small"
                        onClick={() => handlePrint(receipt)}
                      >
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(receipt._id)}
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