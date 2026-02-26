const { ObjectId } = require('mongodb');
const InvoiceModel = require('../models/invoiceModel');
const ContractModel = require('../models/Contract');

// Helper function to calculate totals from items
const calculateTotals = (items, includeVat) => {
    const subtotal = (items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const tax = includeVat ? subtotal * 0.05 : 0;
    const total = subtotal + tax;
    return { subtotal, tax, total };
};

// Helper function to calculate payment totals
const calculatePaymentTotals = (invoice) => {
    const payments = invoice.payments || [];
    const totalPaid = payments.reduce((sum, payment) => {
        return sum + (Number(payment.amountPaid) || Number(payment.amount) || 0);
    }, 0);
    const remainingBalance = Math.max(0, (invoice.total || 0) - totalPaid);
    return { totalPaid, remainingBalance };
};

// Helper function to determine invoice status based on payments
const determineStatus = (total, totalPaid, currentStatus) => {
    if (currentStatus === 'cancelled') return 'cancelled';
    if (currentStatus === 'draft') return 'draft';

    if (totalPaid >= total) return 'paid';
    if (totalPaid > 0) return 'partial';
    if (currentStatus === 'sent') return 'sent';
    return 'unpaid';
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }

        const collection = await InvoiceModel.getCollection();

        const invoices = await collection.aggregate([
            {
                $match: {
                    companyId: companyId.toString()
                }
            },
            {
                $lookup: {
                    from: 'contracts',
                    let: { contractId: '$contractId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$contractId'] }
                            }
                        }
                    ],
                    as: 'contract'
                }
            },
            {
                $unwind: {
                    path: '$contract',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]).toArray();

        // Calculate payment totals for each invoice
        const formattedInvoices = invoices.map(invoice => {
            const { totalPaid, remainingBalance } = calculatePaymentTotals(invoice);
            return {
                ...invoice,
                totalPaid,
                remainingBalance
            };
        });

        res.status(200).json({
            status: 'success',
            data: formattedInvoices
        });
    } catch (error) {
        console.error('Error getting all invoices:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get single invoice by ID
exports.getInvoiceById = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const id = req.params.id;

        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }

        const collection = await InvoiceModel.getCollection();

        const invoices = await collection.aggregate([
            {
                $match: {
                    _id: new ObjectId(id),
                    companyId: companyId.toString()
                }
            },
            {
                $lookup: {
                    from: 'contracts',
                    let: { contractId: '$contractId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$contractId'] }
                            }
                        }
                    ],
                    as: 'contract'
                }
            },
            {
                $unwind: {
                    path: '$contract',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]).toArray();

        if (!invoices || invoices.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Invoice not found'
            });
        }

        const invoice = invoices[0];
        const { totalPaid, remainingBalance } = calculatePaymentTotals(invoice);

        res.status(200).json({
            status: 'success',
            data: {
                ...invoice,
                totalPaid,
                remainingBalance,
                payments: invoice.payments || []
            }
        });
    } catch (error) {
        console.error('Error getting invoice by ID:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Create new invoice
exports.createInvoice = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }

        const { contractId, invoiceNumber, issueDate, dueDate, items, includeVat, notes } = req.body;

        // Validate required fields
        if (!contractId || !invoiceNumber || !items || items.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields: contractId, invoiceNumber, and items are required'
            });
        }

        // Check if contract exists and belongs to company
        const contractCollection = await ContractModel.getCollection();
        const contract = await contractCollection.findOne({
            _id: new ObjectId(contractId),
            companyId: companyId.toString()
        });

        if (!contract) {
            return res.status(404).json({
                status: 'error',
                message: 'Contract not found or belongs to another company'
            });
        }

        // Check if invoice number is unique within company
        const collection = await InvoiceModel.getCollection();
        const existingInvoice = await collection.findOne({
            invoiceNumber,
            companyId: companyId.toString()
        });

        if (existingInvoice) {
            return res.status(400).json({
                status: 'error',
                message: 'Invoice number already exists'
            });
        }

        // Calculate totals server-side
        const { subtotal, tax, total } = calculateTotals(items, includeVat !== false);

        const invoice = {
            contractId: new ObjectId(contractId),
            invoiceNumber,
            issueDate: issueDate || new Date().toISOString().split('T')[0],
            dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items,
            subtotal,
            tax,
            total,
            includeVat: includeVat !== false,
            notes: notes || '',
            status: 'draft',
            payments: [],
            totalPaid: 0,
            remainingBalance: total,
            companyId: companyId.toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await collection.insertOne(invoice);
        invoice._id = result.insertedId;

        console.log(`✅ Beta Invoice created: ${invoiceNumber}, Total: ${total}`);

        res.status(201).json({
            status: 'success',
            data: invoice
        });
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const id = req.params.id;

        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }

        const collection = await InvoiceModel.getCollection();
        const invoice = await collection.findOne({
            _id: new ObjectId(id),
            companyId: companyId.toString()
        });

        if (!invoice) {
            return res.status(404).json({
                status: 'error',
                message: 'Invoice not found'
            });
        }

        const allowedUpdates = ['items', 'includeVat', 'notes', 'status', 'issueDate', 'dueDate'];
        const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));

        const updateData = {};
        updates.forEach(update => {
            updateData[update] = req.body[update];
        });

        // Recalculate totals if items or includeVat changed
        if (updateData.items || updateData.includeVat !== undefined) {
            const currentItems = updateData.items || invoice.items || [];
            const currentIncludeVat = updateData.includeVat !== undefined ? updateData.includeVat : invoice.includeVat;

            const { subtotal, tax, total } = calculateTotals(currentItems, currentIncludeVat);

            updateData.subtotal = subtotal;
            updateData.tax = tax;
            updateData.total = total;

            // Recalculate remaining balance
            const totalPaid = invoice.totalPaid || 0;
            updateData.remainingBalance = Math.max(0, total - totalPaid);
        }

        updateData.updatedAt = new Date();

        const result = await collection.updateOne(
            { _id: new ObjectId(id), companyId: companyId.toString() },
            { $set: updateData }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No updates were made'
            });
        }

        const updatedInvoice = await collection.findOne({ _id: new ObjectId(id) });
        const { totalPaid, remainingBalance } = calculatePaymentTotals(updatedInvoice);

        console.log(`✅ Beta Invoice updated: ${updatedInvoice.invoiceNumber}`);

        res.status(200).json({
            status: 'success',
            data: {
                ...updatedInvoice,
                totalPaid,
                remainingBalance
            }
        });
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const id = req.params.id;

        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }

        const collection = await InvoiceModel.getCollection();

        const result = await collection.deleteOne({
            _id: new ObjectId(id),
            companyId: companyId.toString()
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Invoice not found'
            });
        }

        console.log(`✅ Beta Invoice deleted: ${id}`);

        res.status(200).json({
            status: 'success',
            message: 'Invoice deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Add payment to invoice
exports.addPayment = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const id = req.params.id;

        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }

        const collection = await InvoiceModel.getCollection();
        const invoice = await collection.findOne({
            _id: new ObjectId(id),
            companyId: companyId.toString()
        });

        if (!invoice) {
            return res.status(404).json({
                status: 'error',
                message: 'Invoice not found'
            });
        }

        const { amountPaid, paymentMethod, paymentDate, transactionId, notes } = req.body;

        // Validate payment amount
        const paymentAmount = Number(amountPaid);

        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Payment amount must be a valid number greater than 0'
            });
        }

        // Calculate current totals
        const { totalPaid: currentTotalPaid, remainingBalance: currentRemaining } = calculatePaymentTotals(invoice);

        // Validate payment doesn't exceed remaining balance
        if (paymentAmount > currentRemaining) {
            return res.status(400).json({
                status: 'error',
                message: `Payment amount (${paymentAmount.toFixed(2)}) exceeds remaining balance (${currentRemaining.toFixed(2)})`
            });
        }

        // Create payment object
        const payment = {
            _id: new ObjectId(),
            amountPaid: paymentAmount,
            paymentMethod: paymentMethod || 'cash',
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            transactionId: transactionId || '',
            notes: notes || '',
            createdAt: new Date()
        };

        const newTotalPaid = currentTotalPaid + paymentAmount;
        const newRemainingBalance = Math.max(0, invoice.total - newTotalPaid);
        const newStatus = determineStatus(invoice.total, newTotalPaid, invoice.status);

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $push: { payments: payment },
                $set: {
                    totalPaid: newTotalPaid,
                    remainingBalance: newRemainingBalance,
                    status: newStatus,
                    updatedAt: new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Failed to add payment'
            });
        }

        const updatedInvoice = await collection.findOne({ _id: new ObjectId(id) });

        console.log(`✅ Payment added: ${paymentAmount} AED to invoice ${invoice.invoiceNumber}`);

        res.status(200).json({
            status: 'success',
            data: {
                ...updatedInvoice,
                totalPaid: newTotalPaid,
                remainingBalance: newRemainingBalance
            }
        });
    } catch (error) {
        console.error('Error adding payment:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Update payment in invoice
exports.updatePayment = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id, paymentId } = req.params;
        const { amountPaid, paymentMethod, paymentDate, transactionId, notes } = req.body;

        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }

        const collection = await InvoiceModel.getCollection();
        const invoice = await collection.findOne({
            _id: new ObjectId(id),
            companyId: companyId.toString()
        });

        if (!invoice) {
            return res.status(404).json({
                status: 'error',
                message: 'Invoice not found'
            });
        }

        // Find the payment to update
        const paymentIndex = (invoice.payments || []).findIndex(p => p._id.toString() === paymentId);

        if (paymentIndex === -1) {
            return res.status(404).json({
                status: 'error',
                message: 'Payment not found'
            });
        }

        // Validate payment amount if provided
        if (amountPaid !== undefined) {
            const paymentAmount = Number(amountPaid);

            if (isNaN(paymentAmount) || paymentAmount <= 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Payment amount must be a valid number greater than 0'
                });
            }

            // Calculate what the new total paid would be (excluding the current payment being edited)
            const otherPaymentsTotal = invoice.payments
                .filter((_, idx) => idx !== paymentIndex)
                .reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

            const newTotalPaid = otherPaymentsTotal + paymentAmount;

            // Check if new amount would exceed invoice total
            if (newTotalPaid > invoice.total) {
                return res.status(400).json({
                    status: 'error',
                    message: `Total payments (${newTotalPaid.toFixed(2)}) would exceed invoice total (${invoice.total.toFixed(2)})`
                });
            }
        }

        // Update payment fields
        const updatedPayments = [...invoice.payments];
        updatedPayments[paymentIndex] = {
            ...updatedPayments[paymentIndex],
            ...(amountPaid !== undefined && { amountPaid: Number(amountPaid) }),
            ...(paymentMethod && { paymentMethod }),
            ...(paymentDate && { paymentDate: new Date(paymentDate) }),
            ...(transactionId !== undefined && { transactionId }),
            ...(notes !== undefined && { notes }),
            updatedAt: new Date()
        };

        // Recalculate totals
        const newTotalPaid = updatedPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
        const newRemainingBalance = Math.max(0, invoice.total - newTotalPaid);
        const newStatus = determineStatus(invoice.total, newTotalPaid, invoice.status);

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    payments: updatedPayments,
                    totalPaid: newTotalPaid,
                    remainingBalance: newRemainingBalance,
                    status: newStatus,
                    updatedAt: new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Failed to update payment'
            });
        }

        const updatedInvoice = await collection.findOne({ _id: new ObjectId(id) });

        console.log(`✅ Payment updated in invoice ${invoice.invoiceNumber}`);

        res.status(200).json({
            status: 'success',
            data: {
                ...updatedInvoice,
                totalPaid: newTotalPaid,
                remainingBalance: newRemainingBalance
            }
        });
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Delete payment from invoice
exports.deletePayment = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id, paymentId } = req.params;

        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }

        const collection = await InvoiceModel.getCollection();
        const invoice = await collection.findOne({
            _id: new ObjectId(id),
            companyId: companyId.toString()
        });

        if (!invoice) {
            return res.status(404).json({
                status: 'error',
                message: 'Invoice not found'
            });
        }

        // Remove payment from array
        const updatedPayments = (invoice.payments || []).filter(p =>
            p._id.toString() !== paymentId
        );

        if (updatedPayments.length === invoice.payments.length) {
            return res.status(404).json({
                status: 'error',
                message: 'Payment not found'
            });
        }

        // Recalculate totals
        const newTotalPaid = updatedPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
        const newRemainingBalance = Math.max(0, invoice.total - newTotalPaid);
        const newStatus = determineStatus(invoice.total, newTotalPaid, invoice.status);

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    payments: updatedPayments,
                    totalPaid: newTotalPaid,
                    remainingBalance: newRemainingBalance,
                    status: newStatus,
                    updatedAt: new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Failed to delete payment'
            });
        }

        const updatedInvoice = await collection.findOne({ _id: new ObjectId(id) });

        console.log(`✅ Payment deleted from invoice ${invoice.invoiceNumber}`);

        res.status(200).json({
            status: 'success',
            data: {
                ...updatedInvoice,
                totalPaid: newTotalPaid,
                remainingBalance: newRemainingBalance
            }
        });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get invoice statistics
exports.getInvoiceStats = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }

        const collection = await InvoiceModel.getCollection();
        const stats = await collection.aggregate([
            {
                $match: {
                    companyId: companyId.toString()
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$total' }
                }
            }
        ]).toArray();

        const totalInvoices = await collection.countDocuments({
            companyId: companyId.toString()
        });

        const totalAmount = await collection.aggregate([
            {
                $match: {
                    companyId: companyId.toString()
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total' },
                    totalPaid: { $sum: '$totalPaid' }
                }
            }
        ]).toArray();

        res.status(200).json({
            status: 'success',
            data: {
                byStatus: stats,
                totalInvoices,
                totalAmount: totalAmount[0]?.total || 0,
                totalPaid: totalAmount[0]?.totalPaid || 0,
                totalOutstanding: (totalAmount[0]?.total || 0) - (totalAmount[0]?.totalPaid || 0)
            }
        });
    } catch (error) {
        console.error('Error getting invoice stats:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
