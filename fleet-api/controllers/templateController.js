const { ObjectId } = require('mongodb');
const db = require('../config/db');

// Message templates sent to clients (WhatsApp / letter), with {{placeholders}}
// filled from the contract, invoice or fine the message is sent against.

const DEFAULT_TEMPLATES = [
    {
        key: 'onboarding_welcome',
        name: 'Onboarding Welcome',
        category: 'Onboarding',
        subject: 'Welcome to {{companyName}}',
        body: 'Dear {{contactPerson}},\n\nWelcome aboard! We are delighted to have {{clientName}} as our client.\n\nYour contract {{contractNumber}} starts on {{startDate}} and runs until {{endDate}}.\n\nFor any assistance, reply to this message any time.\n\nBest regards,\n{{companyName}}'
    },
    {
        key: 'contract_expiry',
        name: 'Contract Expiry',
        category: 'Contract',
        subject: 'Contract {{contractNumber}} expiring on {{endDate}}',
        body: 'Dear {{contactPerson}},\n\nThis is a friendly reminder that your contract {{contractNumber}} for {{vehiclePlate}} expires on {{endDate}}.\n\nPlease let us know how you would like to proceed.\n\nBest regards,\n{{companyName}}'
    },
    {
        key: 'contract_renewal',
        name: 'Contract Renewal',
        category: 'Contract',
        subject: 'Renewal of contract {{contractNumber}}',
        body: 'Dear {{contactPerson}},\n\nWe hope our service has met your expectations. Your contract {{contractNumber}} ends on {{endDate}} and we would be glad to renew it on the same terms.\n\nPlease confirm and we will prepare the renewal documents.\n\nBest regards,\n{{companyName}}'
    },
    {
        key: 'missing_documents',
        name: 'Missing Documents',
        category: 'Documents',
        subject: 'Documents required for contract {{contractNumber}}',
        body: 'Dear {{contactPerson}},\n\nTo complete your file for contract {{contractNumber}}, we still require the following documents:\n\n- Trade licence copy\n- Emirates ID copy\n- Driving licence copy\n\nKindly share them at your earliest convenience.\n\nBest regards,\n{{companyName}}'
    },
    {
        key: 'invoice_reminder',
        name: 'Invoice Reminder',
        category: 'Payment',
        subject: 'Invoice {{invoiceNumber}} — payment due {{dueDate}}',
        body: 'Dear {{contactPerson}},\n\nThis is a polite reminder that invoice {{invoiceNumber}} for AED {{amount}} is due on {{dueDate}}. Outstanding balance: AED {{balance}}.\n\nKindly arrange the payment at your earliest convenience.\n\nBest regards,\n{{companyName}}'
    },
    {
        key: 'payment_received',
        name: 'Payment Received',
        category: 'Payment',
        subject: 'Payment received — invoice {{invoiceNumber}}',
        body: 'Dear {{contactPerson}},\n\nWe confirm receipt of AED {{amount}} against invoice {{invoiceNumber}}. Thank you for your prompt payment.\n\nBest regards,\n{{companyName}}'
    },
    {
        key: 'fine_notice',
        name: 'Fine Notice',
        category: 'Fines',
        subject: 'Traffic fine — vehicle {{vehiclePlate}}',
        body: 'Dear {{contactPerson}},\n\nA traffic fine of AED {{amount}} has been registered against vehicle {{vehiclePlate}}.\n\nKindly settle this amount or advise us to settle it on your behalf.\n\nBest regards,\n{{companyName}}'
    },
    {
        key: 'maintenance_due',
        name: 'Maintenance Due',
        category: 'Maintenance',
        subject: 'Scheduled maintenance for {{vehiclePlate}}',
        body: 'Dear {{contactPerson}},\n\nVehicle {{vehiclePlate}} is due for scheduled maintenance on {{dueDate}}.\n\nPlease let us know a convenient time so we can arrange it with minimum disruption.\n\nBest regards,\n{{companyName}}'
    },
    {
        key: 'general_reminder',
        name: 'General Reminder',
        category: 'Reminders',
        subject: 'Reminder from {{companyName}}',
        body: 'Dear {{contactPerson}},\n\n[Write your message here]\n\nBest regards,\n{{companyName}}'
    }
];

// Seeds the default library the first time a company opens templates
const seedDefaults = async (companyId) => {
    const collection = await db.getCollection('messageTemplates');
    const count = await collection.countDocuments({ companyId: companyId.toString() });
    if (count > 0) return;
    const now = new Date();
    await collection.insertMany(DEFAULT_TEMPLATES.map((t) => ({
        ...t,
        companyId: companyId.toString(),
        isDefault: true,
        createdAt: now,
        updatedAt: now
    })));
};

exports.getAllTemplates = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) return res.status(400).json({ status: 'error', message: 'Company ID not found in user token' });

        await seedDefaults(companyId);
        const collection = await db.getCollection('messageTemplates');
        const templates = await collection
            .find({ companyId: companyId.toString() })
            .sort({ category: 1, name: 1 })
            .toArray();
        res.status(200).json({ status: 'success', data: templates });
    } catch (error) {
        console.error('Error getting templates:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { name, category, subject, body } = req.body;
        if (!name || !body) return res.status(400).json({ status: 'error', message: 'Name and body are required' });

        const template = {
            companyId: companyId.toString(),
            name,
            category: category || 'General',
            subject: subject || '',
            body,
            isDefault: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const collection = await db.getCollection('messageTemplates');
        const result = await collection.insertOne(template);
        res.status(201).json({ status: 'success', data: { ...template, _id: result.insertedId } });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { name, category, subject, body } = req.body;
        const collection = await db.getCollection('messageTemplates');
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(req.params.id), companyId: companyId.toString() },
            { $set: { name, category, subject, body, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        const updated = result?.value || result;
        if (!updated) return res.status(404).json({ status: 'error', message: 'Template not found' });
        res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const collection = await db.getCollection('messageTemplates');
        const result = await collection.deleteOne({ _id: new ObjectId(req.params.id), companyId: companyId.toString() });
        if (result.deletedCount === 0) return res.status(404).json({ status: 'error', message: 'Template not found' });
        res.status(200).json({ status: 'success', message: 'Template deleted' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Log of messages actually sent, so you can see what went to whom
exports.logSentMessage = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { templateId, templateName, channel, recipient, message, contractId, invoiceId } = req.body;
        const log = {
            companyId: companyId.toString(),
            templateId: templateId || null,
            templateName: templateName || '',
            channel: channel || 'whatsapp',
            recipient: recipient || {},
            message: message || '',
            contractId: contractId || null,
            invoiceId: invoiceId || null,
            sentAt: new Date()
        };
        const collection = await db.getCollection('messageLog');
        const result = await collection.insertOne(log);
        res.status(201).json({ status: 'success', data: { ...log, _id: result.insertedId } });
    } catch (error) {
        console.error('Error logging message:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getMessageLog = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const collection = await db.getCollection('messageLog');
        const logs = await collection
            .find({ companyId: companyId.toString() })
            .sort({ sentAt: -1 })
            .limit(100)
            .toArray();
        res.status(200).json({ status: 'success', data: logs });
    } catch (error) {
        console.error('Error getting message log:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};
