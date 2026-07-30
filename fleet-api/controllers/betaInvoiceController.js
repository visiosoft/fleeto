const { ObjectId } = require('mongodb');
const InvoiceModel = require('../models/invoiceModel');
const ContractModel = require('../models/Contract');
const { BRAND, brandCss, brandHeaderHtml, brandFooterHtml } = require('../utils/brandTemplate');

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

// Generate invoice PDF
exports.generatePdf = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const id = req.params.id;

        if (!companyId) {
            return res.status(400).json({ status: 'error', message: 'Company ID not found' });
        }

        const collection = await InvoiceModel.getCollection();
        const invoices = await collection.aggregate([
            { $match: { _id: new ObjectId(id), companyId: companyId.toString() } },
            {
                $lookup: {
                    from: 'contracts',
                    let: { contractId: '$contractId' },
                    pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$contractId'] } } }],
                    as: 'contract'
                }
            },
            { $unwind: { path: '$contract', preserveNullAndEmptyArrays: true } }
        ]).toArray();

        if (!invoices.length) {
            return res.status(404).json({ status: 'error', message: 'Invoice not found' });
        }

        const invoice = invoices[0];
        const { totalPaid, remainingBalance } = calculatePaymentTotals(invoice);
        const contract = invoice.contract || {};

        const formatDate = (d) => {
            if (!d) return '';
            const date = new Date(d);
            return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        };

        const fmtNum = (n) => Number(n || 0).toFixed(2);

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Bricolage Grotesque', serif; color: #333; }

  /* === BRAND HEADER/FOOTER === */
  ${brandCss}

  /* === BODY === */
  .body { padding: 36px 40px 20px; }

  /* === INVOICE TITLE + COMPANY INFO === */
  .title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
  .title-left h2 { font-size: 28px; font-weight: 800; color: #232B38; text-transform: uppercase; }
  .title-left .inv-num { font-size: 13px; color: #666; margin-top: 2px; }
  .company-info { text-align: right; font-size: 12px; color: #555; line-height: 1.7; }
  .company-info .name { font-size: 15px; font-weight: 700; color: #222; }

  /* === BILL TO + DATES === */
  .bill-section { display: flex; justify-content: space-between; border-top: 2px solid #eee; border-bottom: 2px solid #eee; padding: 16px 0; margin-bottom: 24px; }
  .bill-to { }
  .bill-to .label { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .bill-to .client-name { font-size: 18px; font-weight: 700; color: #222; }
  .bill-to .client-detail { font-size: 12px; color: #666; margin-top: 2px; }
  .dates { text-align: right; }
  .dates .date-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .dates .date-value { font-size: 15px; font-weight: 700; color: #222; margin-bottom: 8px; }

  /* === TABLE === */
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  thead td { font-size: 12px; font-weight: 700; color: #333; padding: 10px 0; border-bottom: 2px solid #333; }
  thead td:nth-child(2) { text-align: center; }
  thead td:nth-child(3) { text-align: right; }
  thead td:last-child { text-align: right; }
  tbody td { padding: 14px 0; font-size: 13px; color: #444; border-bottom: 1px solid #eee; }
  tbody td:nth-child(2) { text-align: center; }
  tbody td:nth-child(3) { text-align: right; }
  tbody td:last-child { text-align: right; }

  /* === TOTALS === */
  .totals { display: flex; justify-content: flex-end; margin-top: 12px; margin-bottom: 32px; }
  .totals-box { width: 300px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #555; }
  .totals-row.total-main { border-top: 2px solid #333; padding-top: 10px; margin-top: 4px; }
  .totals-row.total-main span:first-child { font-size: 16px; font-weight: 700; color: #222; }
  .totals-row.total-main span:last-child { font-size: 18px; font-weight: 800; color: #222; }
  .totals-row.paid span { color: #888; }
  .totals-row.balance span:first-child { font-weight: 700; color: #c0392b; }
  .totals-row.balance span:last-child { font-weight: 700; color: #c0392b; }

  /* === BANK DETAILS === */
  .bank-details { text-align: center; margin: 24px 0; padding: 20px; border-top: 1px solid #eee; }
  .bank-details .company-legal { font-size: 12px; font-weight: 700; color: #333; text-transform: uppercase; margin-bottom: 8px; }
  .bank-details p { font-size: 12px; color: #666; line-height: 1.8; }

  /* === NOTES === */
  .notes { margin: 0 0 24px; padding: 14px 16px; background: #fafafa; border-left: 3px solid #35A3EF; border-radius: 4px; }
  .notes h4 { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .notes p { font-size: 12px; color: #555; line-height: 1.6; white-space: pre-line; }

</style></head><body>
  ${brandHeaderHtml}

  <div class="body">
    <!-- INVOICE TITLE + COMPANY -->
    <div class="title-row">
      <div class="title-left">
        <h2>Invoice</h2>
        <div class="inv-num">#${invoice.invoiceNumber}</div>
      </div>
      <div class="company-info">
        <div class="name">${BRAND.shortName}</div>
        <div>${BRAND.subName}</div>
        <div>${BRAND.city}</div>
        <div>${BRAND.phone}</div>
      </div>
    </div>

    <!-- BILL TO + DATES -->
    <div class="bill-section">
      <div class="bill-to">
        <div class="label">Bill To</div>
        <div class="client-name">${contract.companyName || 'Client'}</div>
        ${contract.contactPerson ? `<div class="client-detail">${contract.contactPerson}</div>` : ''}
        ${contract.contactEmail ? `<div class="client-detail">${contract.contactEmail}</div>` : ''}
        ${contract.tradeLicenseNo ? `<div class="client-detail">License No: ${contract.tradeLicenseNo}</div>` : ''}
      </div>
      <div class="dates">
        <div class="date-label">Issue Date</div>
        <div class="date-value">${formatDate(invoice.issueDate)}</div>
        <div class="date-label">Due Date</div>
        <div class="date-value">${formatDate(invoice.dueDate)}</div>
      </div>
    </div>

    <!-- LINE ITEMS TABLE -->
    <table>
      <thead><tr><td>Description</td><td>Qty</td><td>Unit Price</td><td>Amount</td></tr></thead>
      <tbody>
        ${(invoice.items || []).map(item => `
          <tr>
            <td>${item.description || ''}</td>
            <td>${item.quantity || 1}</td>
            <td>${fmtNum(item.unitPrice)}</td>
            <td>${fmtNum(item.amount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- TOTALS -->
    <div class="totals">
      <div class="totals-box">
        <div class="totals-row"><span>Subtotal:</span><span>AED ${fmtNum(invoice.subtotal)}</span></div>
        ${invoice.includeVat !== false && invoice.tax > 0 ? `<div class="totals-row"><span>VAT (5%):</span><span>AED ${fmtNum(invoice.tax)}</span></div>` : ''}
        <div class="totals-row total-main"><span>Total:</span><span>AED ${fmtNum(invoice.total)}</span></div>
        <div class="totals-row paid"><span>Paid:</span><span>AED ${fmtNum(totalPaid)}</span></div>
        <div class="totals-row balance"><span>Balance Due:</span><span>AED ${fmtNum(remainingBalance)}</span></div>
      </div>
    </div>

    ${invoice.notes ? `
    <div class="notes">
      <h4>Notes</h4>
      <p>${invoice.notes}</p>
    </div>` : ''}

    <!-- BANK DETAILS -->
    <div class="bank-details">
      <div class="company-legal">${BRAND.name}</div>
      <p>Account Holder: Sardar Basharat Safdar<br>Bank Name: Mashreq Bank<br>Account Number: 019120198982<br>IBAN: AE710330000019120198982</p>
    </div>
  </div>

  ${brandFooterHtml}
</body></html>`;

        let puppeteer;
        try {
            puppeteer = require('puppeteer');
        } catch (e) {
            return res.status(500).json({ status: 'error', message: 'PDF generation not available - puppeteer not installed' });
        }

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Get invoice HTML for client-side PDF generation
exports.getInvoiceHtml = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const id = req.params.id;

        if (!companyId) {
            return res.status(400).json({ status: 'error', message: 'Company ID not found' });
        }

        const collection = await InvoiceModel.getCollection();
        const invoices = await collection.aggregate([
            { $match: { _id: new ObjectId(id), companyId: companyId.toString() } },
            {
                $lookup: {
                    from: 'contracts',
                    let: { contractId: '$contractId' },
                    pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$contractId'] } } }],
                    as: 'contract'
                }
            },
            { $unwind: { path: '$contract', preserveNullAndEmptyArrays: true } }
        ]).toArray();

        if (!invoices.length) {
            return res.status(404).json({ status: 'error', message: 'Invoice not found' });
        }

        const invoice = invoices[0];
        const { totalPaid, remainingBalance } = calculatePaymentTotals(invoice);

        res.status(200).json({
            status: 'success',
            data: { ...invoice, totalPaid, remainingBalance }
        });
    } catch (error) {
        console.error('Error getting invoice HTML:', error);
        res.status(500).json({ status: 'error', message: error.message });
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
