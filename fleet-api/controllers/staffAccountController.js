const { ObjectId } = require('mongodb');
const db = require('../config/db');

// Staff cash accounts: money handed to a person (e.g. maintenance manager),
// the purchases they make with it, and the balance still in their hands.
//
// Transaction types:
//   advance  — company gives money to the person  (+ balance)
//   expense  — person spends money on company work (- balance)
//   return   — person hands unspent money back     (- balance)

const asMoney = (v) => Number(v) || 0;

const getBalances = async (companyId, staffIds) => {
    const txCollection = await db.getCollection('staffTransactions');
    const rows = await txCollection.aggregate([
        { $match: { companyId: companyId.toString(), ...(staffIds ? { staffId: { $in: staffIds } } : {}) } },
        { $group: { _id: { staffId: '$staffId', type: '$type' }, total: { $sum: '$amount' } } }
    ]).toArray();

    const totals = {};
    rows.forEach((r) => {
        const id = r._id.staffId;
        if (!totals[id]) totals[id] = { advanced: 0, spent: 0, returned: 0 };
        if (r._id.type === 'advance') totals[id].advanced += r.total;
        else if (r._id.type === 'expense') totals[id].spent += r.total;
        else if (r._id.type === 'return') totals[id].returned += r.total;
    });
    Object.keys(totals).forEach((id) => {
        totals[id].balance = totals[id].advanced - totals[id].spent - totals[id].returned;
    });
    return totals;
};

exports.getAllStaff = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) return res.status(400).json({ status: 'error', message: 'Company ID not found in user token' });

        const collection = await db.getCollection('staffAccounts');
        const staff = await collection
            .find({ companyId: companyId.toString(), isActive: { $ne: false } })
            .sort({ name: 1 })
            .toArray();

        const totals = await getBalances(companyId, staff.map((s) => s._id.toString()));
        const withBalances = staff.map((s) => ({
            ...s,
            ...(totals[s._id.toString()] || { advanced: 0, spent: 0, returned: 0, balance: 0 })
        }));

        res.status(200).json({ status: 'success', data: withBalances });
    } catch (error) {
        console.error('Error getting staff accounts:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.createStaff = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { name, role, phone, notes } = req.body;
        if (!name) return res.status(400).json({ status: 'error', message: 'Name is required' });

        const staff = {
            companyId: companyId.toString(),
            name,
            role: role || '',
            phone: phone || '',
            notes: notes || '',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const collection = await db.getCollection('staffAccounts');
        const result = await collection.insertOne(staff);
        res.status(201).json({ status: 'success', data: { ...staff, _id: result.insertedId, advanced: 0, spent: 0, returned: 0, balance: 0 } });
    } catch (error) {
        console.error('Error creating staff account:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.updateStaff = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { name, role, phone, notes } = req.body;
        const collection = await db.getCollection('staffAccounts');
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(req.params.id), companyId: companyId.toString() },
            { $set: { name, role, phone, notes, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        const updated = result?.value || result;
        if (!updated) return res.status(404).json({ status: 'error', message: 'Staff account not found' });
        res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        console.error('Error updating staff account:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const collection = await db.getCollection('staffAccounts');
        const result = await collection.deleteOne({ _id: new ObjectId(req.params.id), companyId: companyId.toString() });
        if (result.deletedCount === 0) return res.status(404).json({ status: 'error', message: 'Staff account not found' });

        const txCollection = await db.getCollection('staffTransactions');
        await txCollection.deleteMany({ staffId: req.params.id, companyId: companyId.toString() });

        res.status(200).json({ status: 'success', message: 'Staff account deleted' });
    } catch (error) {
        console.error('Error deleting staff account:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Single staff member with full transaction history
exports.getStaffDetail = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const staffId = req.params.id;

        const collection = await db.getCollection('staffAccounts');
        const staff = await collection.findOne({ _id: new ObjectId(staffId), companyId: companyId.toString() });
        if (!staff) return res.status(404).json({ status: 'error', message: 'Staff account not found' });

        const txCollection = await db.getCollection('staffTransactions');
        const transactions = await txCollection
            .find({ staffId, companyId: companyId.toString() })
            .sort({ date: -1, createdAt: -1 })
            .toArray();

        const totals = await getBalances(companyId, [staffId]);
        res.status(200).json({
            status: 'success',
            data: {
                ...staff,
                ...(totals[staffId] || { advanced: 0, spent: 0, returned: 0, balance: 0 }),
                transactions
            }
        });
    } catch (error) {
        console.error('Error getting staff detail:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.addTransaction = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const staffId = req.params.id;
        const { type, amount, description, date, category, vehicleId, expenseId } = req.body;

        if (!['advance', 'expense', 'return'].includes(type)) {
            return res.status(400).json({ status: 'error', message: 'Type must be advance, expense or return' });
        }
        if (!amount || asMoney(amount) <= 0) {
            return res.status(400).json({ status: 'error', message: 'A positive amount is required' });
        }

        const transaction = {
            companyId: companyId.toString(),
            staffId,
            type,
            amount: asMoney(amount),
            description: description || '',
            category: category || '',
            vehicleId: vehicleId || null,
            expenseId: expenseId || null,
            date: date ? new Date(date) : new Date(),
            createdAt: new Date()
        };
        const txCollection = await db.getCollection('staffTransactions');
        const result = await txCollection.insertOne(transaction);

        const totals = await getBalances(companyId, [staffId]);
        res.status(201).json({
            status: 'success',
            data: { ...transaction, _id: result.insertedId },
            balance: totals[staffId]?.balance ?? 0
        });
    } catch (error) {
        console.error('Error adding staff transaction:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const txCollection = await db.getCollection('staffTransactions');
        const result = await txCollection.deleteOne({
            _id: new ObjectId(req.params.txId),
            companyId: companyId.toString()
        });
        if (result.deletedCount === 0) return res.status(404).json({ status: 'error', message: 'Transaction not found' });
        res.status(200).json({ status: 'success', message: 'Transaction deleted' });
    } catch (error) {
        console.error('Error deleting staff transaction:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};
