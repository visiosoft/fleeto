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
    FormControlLabel,
    Switch,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Invoice, InvoiceItem, Contract } from '../../types/api';
import BetaInvoiceService from '../../services/BetaInvoiceService';
import { api } from '../../services/api';

const BetaInvoiceForm: React.FC = () => {
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
        status: 'sent',
        items: [],
        subtotal: 0,
        tax: 0,
        includeVat: true,
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
    }, [id]);

    const fetchContracts = async () => {
        try {
            const response = await api.getContracts();
            if (Array.isArray(response)) {
                const activeContracts = response.filter(contract => contract.status === 'Active');
                setContracts(activeContracts);
            }
        } catch (err: any) {
            setError('Failed to fetch contracts');
        }
    };

    const generateInvoiceNumber = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const newNumber = `BETA-INV-${timestamp}-${random}`;
        setInvoice(prev => ({ ...prev, invoiceNumber: newNumber }));
    };

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const response = await BetaInvoiceService.getInstance().getInvoiceById(id!);
            if (response.data.status === 'success') {
                setInvoice(response.data.data);
            }
        } catch (err) {
            setError('Failed to fetch invoice');
        } finally {
            setLoading(false);
        }
    };

    const handleContractChange = (contractId: string) => {
        const contract = contracts.find(c => c._id === contractId);
        setSelectedContract(contract || null);
        setInvoice(prev => ({ ...prev, contractId }));

        if (!id && contract) {
            const contractItem: InvoiceItem = {
                _id: Date.now().toString(),
                description: `${contract.contractType} Contract - ${contract.companyName}`,
                quantity: 1,
                unitPrice: contract.value,
                amount: contract.value,
                type: 'service',
            };

            setInvoice(prev => {
                const newItems = [contractItem];
                const { subtotal, tax, total } = calculateDerivedTotals(newItems, prev.includeVat || false);
                return {
                    ...prev,
                    items: newItems,
                    subtotal,
                    tax,
                    total
                };
            });
        }
    };

    const calculateDerivedTotals = (items: InvoiceItem[], includeVat: boolean) => {
        const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        const tax = includeVat ? subtotal * 0.05 : 0;
        const total = subtotal + tax;
        return { subtotal, tax, total };
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

        setInvoice(prev => {
            const newItems = [...(prev.items || []), newItem];
            const { subtotal, tax, total } = calculateDerivedTotals(newItems, prev.includeVat || false);
            return {
                ...prev,
                items: newItems,
                subtotal,
                tax,
                total
            };
        });
    };

    const handleRemoveItem = (itemId: string) => {
        setInvoice(prev => {
            const newItems = prev.items?.filter(item => item._id !== itemId) || [];
            const { subtotal, tax, total } = calculateDerivedTotals(newItems, prev.includeVat || false);
            return {
                ...prev,
                items: newItems,
                subtotal,
                tax,
                total
            };
        });
    };

    const handleItemChange = (itemId: string, field: keyof InvoiceItem, value: any) => {
        setInvoice(prev => {
            const newItems = prev.items?.map(item => {
                if (item._id === itemId) {
                    const updatedItem = { ...item, [field]: value };
                    if (field === 'quantity' || field === 'unitPrice') {
                        updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice;
                    }
                    return updatedItem;
                }
                return item;
            }) || [];

            const { subtotal, tax, total } = calculateDerivedTotals(newItems, prev.includeVat || false);
            return {
                ...prev,
                items: newItems,
                subtotal,
                tax,
                total
            };
        });
    };

    const handleVatChange = (checked: boolean) => {
        setInvoice(prev => {
            const { subtotal, tax, total } = calculateDerivedTotals(prev.items || [], checked);
            return {
                ...prev,
                includeVat: checked,
                subtotal,
                tax,
                total
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            if (!invoice.contractId || !invoice.items || invoice.items.length === 0) {
                throw new Error('Contract and at least one item are required');
            }

            const invoiceData = {
                contractId: invoice.contractId,
                invoiceNumber: invoice.invoiceNumber,
                issueDate: invoice.issueDate,
                dueDate: invoice.dueDate,
                items: invoice.items,
                includeVat: invoice.includeVat,
                notes: invoice.notes,
            };

            if (id) {
                await BetaInvoiceService.getInstance().updateInvoice(id, invoiceData);
            } else {
                await BetaInvoiceService.getInstance().createInvoice(invoiceData);
            }
            navigate('/beta-invoices');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to save invoice');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                {id ? 'Edit Beta Invoice' : 'Create Beta Invoice'}
            </Typography>

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {error && (
                            <Grid item xs={12}>
                                <Alert severity="error">{error}</Alert>
                            </Grid>
                        )}

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Contract</InputLabel>
                                <Select
                                    value={invoice.contractId}
                                    label="Contract"
                                    onChange={(e) => handleContractChange(e.target.value)}
                                >
                                    {contracts.map((contract) => (
                                        <MenuItem key={contract._id} value={contract._id}>
                                            {contract.companyName} - AED {contract.value.toFixed(2)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

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
                                onChange={(e) => setInvoice(prev => ({ ...prev, issueDate: e.target.value }))}
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
                                onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Line Items</Typography>
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
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(item._id, 'quantity', Number(e.target.value))}
                                                        size="small"
                                                        sx={{ width: 80 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => handleItemChange(item._id, 'unitPrice', Number(e.target.value))}
                                                        size="small"
                                                        sx={{ width: 120 }}
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

                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!invoice.includeVat}
                                            onChange={(e) => handleVatChange(e.target.checked)}
                                        />
                                    }
                                    label="Include VAT (5%)"
                                />
                                <Typography>Subtotal: AED {invoice.subtotal?.toFixed(2) || '0.00'}</Typography>
                                {invoice.includeVat && (
                                    <Typography>Tax (5%): AED {invoice.tax?.toFixed(2) || '0.00'}</Typography>
                                )}
                                <Typography variant="h6">Total: AED {invoice.total?.toFixed(2) || '0.00'}</Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Notes"
                                value={invoice.notes}
                                onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box display="flex" gap={2}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={loading}
                                >
                                    {id ? 'Update Invoice' : 'Create Invoice'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/beta-invoices')}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default BetaInvoiceForm;
