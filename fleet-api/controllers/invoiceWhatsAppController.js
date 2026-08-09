const { ObjectId } = require('mongodb');
const db = require('../config/db');
const TwilioWhatsAppService = require('../services/twilioWhatsAppService');

const whatsapp = new TwilioWhatsAppService();

// Get upcoming invoices based on active contracts
// Generates virtual invoices for contracts that are due this month but have no invoice yet
exports.getUpcoming = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) return res.status(400).json({ status: 'error', message: 'Company ID not found' });

        const database = await db.getDb();
        const contracts = await database.collection('contracts').find({
            companyId: companyId.toString(),
            status: 'Active',
        }).toArray();

        const invoices = await database.collection('invoices').find({
            companyId: companyId.toString(),
        }).toArray();

        const now = new Date();
        const upcoming = [];

        for (const contract of contracts) {
            const start = new Date(contract.startDate);
            const end = new Date(contract.endDate);
            if (now > end) continue;

            const monthlyAmount = contract.amount || contract.value || 0;
            if (monthlyAmount <= 0) continue;

            // Calculate months completed since contract start
            const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

            // Show only the current billing period invoice
            for (let offset = 0; offset <= 0; offset++) {
                const targetMonth = new Date(start.getFullYear(), start.getMonth() + monthsElapsed + offset, 1);
                if (targetMonth > end) break;
                if (targetMonth < start) continue;

                const monthCompleted = (targetMonth.getFullYear() - start.getFullYear()) * 12 + (targetMonth.getMonth() - start.getMonth()) + 1;

                // Check if invoice already exists for this contract+month
                const existing = invoices.find(inv => {
                    if (!inv.contractId) return false;
                    const cid = inv.contractId.toString();
                    if (cid !== contract._id.toString()) return false;
                    const invDate = new Date(inv.issueDate || inv.createdAt);
                    return invDate.getMonth() === targetMonth.getMonth() && invDate.getFullYear() === targetMonth.getFullYear();
                });

                upcoming.push({
                    contractId: contract._id,
                    companyName: contract.companyName,
                    vehicleName: contract.vehicleName,
                    contactPhone: contract.contactPhone,
                    contactPerson: contract.contactPerson,
                    amount: monthlyAmount,
                    monthCompleted,
                    dueDate: new Date(targetMonth.getFullYear(), targetMonth.getMonth(), start.getDate()).toISOString(),
                    month: targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    invoiceExists: !!existing,
                    invoiceId: existing?._id || null,
                    invoiceStatus: existing?.status || null,
                    sentAt: existing?.sentAt || null,
                });
            }
        }

        // Sort by dueDate ascending
        upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        res.json({ status: 'success', data: upcoming });
    } catch (error) {
        console.error('Error getting upcoming invoices:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Send invoice via WhatsApp to client's contactPhone
exports.sendViaWhatsApp = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) return res.status(400).json({ status: 'error', message: 'Company ID not found' });

        const { invoiceId } = req.params;
        const database = await db.getDb();

        const invoice = await database.collection('invoices').findOne({
            _id: new ObjectId(invoiceId),
            companyId: companyId.toString(),
        });
        if (!invoice) return res.status(404).json({ status: 'error', message: 'Invoice not found' });

        // Get contract for client phone
        let contract = null;
        if (invoice.contractId) {
            contract = await database.collection('contracts').findOne({
                _id: new ObjectId(invoice.contractId.toString()),
            });
        }

        const phone = contract?.contactPhone;
        if (!phone) return res.status(400).json({ status: 'error', message: 'No client phone number found on contract' });

        const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone.startsWith('+') ? phone : '+' + phone}`;
        const amount = invoice.total || invoice.totalAmount || 0;
        const invNum = invoice.invoiceNumber || 'N/A';
        const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

        const message = `📄 *Invoice #${invNum}*\n\n` +
            `Dear ${contract.contactPerson || contract.companyName || 'Client'},\n\n` +
            `Your invoice is ready:\n` +
            `💰 Amount: *AED ${amount.toLocaleString()}*\n` +
            `📅 Due Date: *${dueDate}*\n\n` +
            `Please arrange payment at your earliest convenience.\n\n` +
            `Thank you,\nEfficient Move`;

        await whatsapp.sendMessage(to, message);

        // Mark invoice as sent
        await database.collection('invoices').updateOne(
            { _id: new ObjectId(invoiceId) },
            { $set: { status: 'sent', sentAt: new Date(), updatedAt: new Date() } }
        );

        res.json({ status: 'success', message: 'Invoice sent via WhatsApp' });
    } catch (error) {
        console.error('Error sending invoice via WhatsApp:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Send payment reminder via WhatsApp
exports.sendReminder = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) return res.status(400).json({ status: 'error', message: 'Company ID not found' });

        const { invoiceId } = req.params;
        const database = await db.getDb();

        const invoice = await database.collection('invoices').findOne({
            _id: new ObjectId(invoiceId),
            companyId: companyId.toString(),
        });
        if (!invoice) return res.status(404).json({ status: 'error', message: 'Invoice not found' });

        let contract = null;
        if (invoice.contractId) {
            contract = await database.collection('contracts').findOne({
                _id: new ObjectId(invoice.contractId.toString()),
            });
        }

        const phone = contract?.contactPhone;
        if (!phone) return res.status(400).json({ status: 'error', message: 'No client phone number found on contract' });

        const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone.startsWith('+') ? phone : '+' + phone}`;
        const amount = invoice.total || invoice.totalAmount || 0;
        const balance = amount - (invoice.totalPaid || 0);
        const invNum = invoice.invoiceNumber || 'N/A';
        const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

        const message = `⏰ *Payment Reminder*\n\n` +
            `Dear ${contract.contactPerson || contract.companyName || 'Client'},\n\n` +
            `This is a friendly reminder for:\n` +
            `📄 Invoice #${invNum}\n` +
            `💰 Balance Due: *AED ${balance.toLocaleString()}*\n` +
            `📅 Due Date: *${dueDate}*\n\n` +
            `Kindly arrange payment at your earliest.\n\n` +
            `Thank you,\nEfficient Move`;

        await whatsapp.sendMessage(to, message);

        // Track reminder
        await database.collection('invoices').updateOne(
            { _id: new ObjectId(invoiceId) },
            { $set: { lastReminderAt: new Date(), updatedAt: new Date() }, $inc: { reminderCount: 1 } }
        );

        res.json({ status: 'success', message: 'Reminder sent via WhatsApp' });
    } catch (error) {
        console.error('Error sending reminder:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};
