import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  LinearProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Invoice, InvoiceItem, Contract } from '../../types/api';
import InvoiceService from '../../services/InvoiceService';
import { api } from '../../services/api';

const InvoiceForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    contractId: '',
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    items: [],
    subtotal: 0,
    tax: 0,
    includeVat: false,
    total: 0,
    notes: '',
  });

  useEffect(() => {
    fetchContracts();
    if (id) {
      fetchInvoice();
    } else {
      generateInvoiceNumber();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching contracts...');
      const response = await api.getContracts();
      console.log('Contracts API response:', response);
      
      // The response is directly an array of contracts
      if (Array.isArray(response)) {
        setContracts(response);
        console.log('Contracts loaded:', response);
      } else {
        console.error('Invalid contracts data format:', response);
        setError('Failed to fetch contracts: Invalid data format');
      }
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      setError('Failed to fetch contracts: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      // Generate a unique invoice number using timestamp and random number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const newNumber = `INV-${timestamp}-${random}`;
      console.log('Generated invoice number:', newNumber);
      setInvoice(prev => ({ ...prev, invoiceNumber: newNumber }));
    } catch (err) {
      console.error('Error generating invoice number:', err);
      // Set a fallback invoice number if generation fails
      const fallbackNumber = `INV-${String(Date.now()).slice(-6)}`;
      setInvoice(prev => ({ ...prev, invoiceNumber: fallbackNumber }));
    }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await InvoiceService.getInstance().getInvoiceById(id!);
      if (response.data.status === 'success') {
        const invoiceData = response.data.data;
        setInvoice({
          ...invoiceData,
          includeVat: invoiceData.includeVat ?? false
        });
      }
    } catch (err) {
      setError('Failed to fetch invoice');
      console.error('Error fetching invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContractChange = (contractId: string) => {
    const contract = contracts.find(c => c._id === contractId);
    setSelectedContract(contract || null);
    setInvoice(prev => ({ ...prev, contractId }));
    
    // If this is a new invoice, add the contract value as the first item
    if (!id && contract) {
      const contractItem: InvoiceItem = {
        _id: Date.now().toString(),
        description: `Van Rental ${contract.contractType} Contract - ${contract.companyName}`,
        quantity: 1,
        unitPrice: contract.value,
        amount: contract.value,
        type: 'service',
      };
      setInvoice(prev => ({
        ...prev,
        items: [contractItem],
      }));
    }
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      _id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      type: 'service',
    };
    setInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items?.filter(item => item._id !== itemId),
    }));
  };

  const handleItemChange = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items?.map(item => {
        if (item._id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const calculateTotals = () => {
    const subtotal = invoice.items?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const tax = !invoice.includeVat ? subtotal * 0.05 : 0; // 5% tax if VAT is not included
    const total = !invoice.includeVat ? subtotal + tax : subtotal; // If VAT is included, total equals subtotal

    setInvoice(prev => ({
      ...prev,
      subtotal,
      tax,
      total,
    }));
  };

  const handleVATToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const includeVat = event.target.checked;
    const currentSubtotal = invoice.subtotal || 0;
    const newTax = !includeVat ? currentSubtotal * 0.05 : 0;
    const newTotal = !includeVat ? currentSubtotal + newTax : currentSubtotal;
    
    setInvoice(prev => ({
      ...prev,
      includeVat,
      tax: newTax,
      total: newTotal
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [invoice.items, invoice.includeVat]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!invoice.contractId) {
        throw new Error('Contract is required');
      }
      if (!invoice.items || invoice.items.length === 0) {
        throw new Error('At least one item is required');
      }
      
      // Ensure all required fields are included in the update
      const invoiceData = {
        ...invoice,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        items: invoice.items,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        status: invoice.status,
        notes: invoice.notes,
        includeVat: invoice.includeVat
      };
      
      console.log('Submitting invoice:', invoiceData);
      
      if (id) {
        const response = await InvoiceService.getInstance().updateInvoice(id, invoiceData);
        console.log('Update response:', response);
        if (response.data.status !== 'success') {
          throw new Error(response.data.message || 'Failed to update invoice');
        }
      } else {
        const response = await InvoiceService.getInstance().createInvoice(invoiceData as Omit<Invoice, '_id' | 'createdAt' | 'updatedAt'>);
        console.log('Create response:', response);
        if (response.data.status !== 'success') {
          throw new Error(response.data.message || 'Failed to create invoice');
        }
      }
      navigate('/invoices');
    } catch (err: any) {
      console.error('Error saving invoice:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {id ? 'Edit Invoice' : 'Create Invoice'}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Contract</InputLabel>
                <Select
                  value={invoice.contractId}
                  label="Contract"
                  onChange={(e) => handleContractChange(e.target.value)}
                  disabled={loading}
                >
                  {contracts.length === 0 ? (
                    <MenuItem disabled>No contracts available</MenuItem>
                  ) : (
                    contracts.map((contract) => (
                      <MenuItem key={contract._id} value={contract._id}>
                        {contract.companyName} - ${contract.value.toFixed(2)} ({contract.contractType})
                      </MenuItem>
                    ))
                  )}
                </Select>
                {loading && <LinearProgress sx={{ mt: 1 }} />}
              </FormControl>
            </Grid>
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
            {selectedContract && (
              <Grid item xs={12} md={6}>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Contact: {selectedContract.contactPerson}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Email: {selectedContract.contactEmail}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Phone: {selectedContract.contactPhone}
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Invoice Number"
                value={invoice.invoiceNumber}
                disabled
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Issue Date"
                value={invoice.issueDate}
                onChange={(e) => {
                  console.log('Issue date changed:', e.target.value);
                  setInvoice(prev => ({ ...prev, issueDate: e.target.value }));
                }}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                value={invoice.dueDate}
                onChange={(e) => {
                  console.log('Due date changed:', e.target.value);
                  setInvoice(prev => ({ ...prev, dueDate: e.target.value }));
                }}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Items</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  variant="outlined"
                >
                  Add Item
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items?.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={item.description}
                            onChange={(e) => handleItemChange(item._id, 'description', e.target.value)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            value={item.type}
                            onChange={(e) => handleItemChange(item._id, 'type', e.target.value)}
                            size="small"
                          >
                            <MenuItem value="service">Service</MenuItem>
                            <MenuItem value="product">Product</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item._id, 'quantity', Number(e.target.value))}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(item._id, 'unitPrice', Number(e.target.value))}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>AED {item.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveItem(item._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={invoice.notes}
                onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Summary</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={invoice.includeVat}
                      onChange={handleVATToggle}
                      color="primary"
                    />
                  }
                  label="Exclude VAT"
                />
                <Typography>Subtotal: AED {invoice.subtotal?.toFixed(2) || '0.00'}</Typography>
                {!invoice.includeVat && (
                  <Typography>Tax (5%): AED {invoice.tax?.toFixed(2) || '0.00'}</Typography>
                )}
                <Typography variant="h6">Total: AED {invoice.total?.toFixed(2) || '0.00'}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/invoices')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Invoice'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default InvoiceForm; 