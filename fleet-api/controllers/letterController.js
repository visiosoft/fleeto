const { ObjectId } = require('mongodb');
const db = require('../config/db');

// Letters written on the company letterhead, optionally linked to a contract
exports.getAllLetters = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ status: 'error', message: 'Company ID not found in user token' });
        }
        const collection = await db.getCollection('letters');
        const letters = await collection
            .find({ companyId: companyId.toString() })
            .sort({ createdAt: -1 })
            .toArray();
        res.status(200).json({ status: 'success', data: letters });
    } catch (error) {
        console.error('Error getting letters:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.createLetter = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ status: 'error', message: 'Company ID not found in user token' });
        }
        const { subject, body, contractId, recipient, letterDate } = req.body;
        if (!subject || !body) {
            return res.status(400).json({ status: 'error', message: 'Subject and body are required' });
        }
        const letter = {
            companyId: companyId.toString(),
            subject,
            body,
            contractId: contractId || null,
            recipient: {
                companyName: recipient?.companyName || '',
                contactPerson: recipient?.contactPerson || '',
                email: recipient?.email || '',
                phone: recipient?.phone || '',
                address: recipient?.address || '',
            },
            letterDate: letterDate || new Date().toISOString().split('T')[0],
            createdBy: req.user.userId || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const collection = await db.getCollection('letters');
        const result = await collection.insertOne(letter);
        res.status(201).json({ status: 'success', data: { ...letter, _id: result.insertedId } });
    } catch (error) {
        console.error('Error creating letter:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.updateLetter = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const { subject, body, contractId, recipient, letterDate } = req.body;
        const collection = await db.getCollection('letters');
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id), companyId: companyId.toString() },
            { $set: { subject, body, contractId: contractId || null, recipient, letterDate, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        const updated = result?.value || result;
        if (!updated) return res.status(404).json({ status: 'error', message: 'Letter not found' });
        res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        console.error('Error updating letter:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteLetter = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const collection = await db.getCollection('letters');
        const result = await collection.deleteOne({ _id: new ObjectId(id), companyId: companyId.toString() });
        if (result.deletedCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Letter not found' });
        }
        res.status(200).json({ status: 'success', message: 'Letter deleted' });
    } catch (error) {
        console.error('Error deleting letter:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};
