const { ObjectId } = require('mongodb');
const db = require('../config/db');

// Daily hours a driver reports: "today I did 7 hours", logged per day so the
// month's total can be pulled straight into a payslip as overtime.

const monthRange = (month, year) => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10) - 1; // incoming month is 1-12
    return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59) };
};

exports.getDriverHours = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ status: 'error', message: 'Company ID not found in user token' });
        }

        const query = {
            companyId: companyId.toString(),
            driverId: req.params.id,
        };

        // Optional ?month=7&year=2026 filter, used by the payroll prefill
        if (req.query.month && req.query.year) {
            const { start, end } = monthRange(req.query.month, req.query.year);
            query.date = { $gte: start, $lte: end };
        }

        const collection = await db.getCollection('driverHours');
        const entries = await collection.find(query).sort({ date: -1 }).toArray();

        const totalHours = entries.reduce((t, e) => t + (parseFloat(e.hours) || 0), 0);

        res.status(200).json({
            status: 'success',
            data: { entries, totalHours, count: entries.length },
        });
    } catch (error) {
        console.error('Error getting driver hours:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.addDriverHours = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ status: 'error', message: 'Company ID not found in user token' });
        }

        const hours = parseFloat(req.body.hours);
        if (!hours || hours <= 0) {
            return res.status(400).json({ status: 'error', message: 'Enter the hours worked' });
        }
        if (hours > 24) {
            return res.status(400).json({ status: 'error', message: 'Hours cannot be more than 24 in a day' });
        }

        const date = req.body.date ? new Date(req.body.date) : new Date();
        date.setHours(12, 0, 0, 0); // noon, so timezone shifts cannot move the day

        const collection = await db.getCollection('driverHours');

        // One row per driver per day: logging the same day again replaces it
        const existing = await collection.findOne({
            companyId: companyId.toString(),
            driverId: req.params.id,
            date: {
                $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                $lte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59),
            },
        });

        const entry = {
            companyId: companyId.toString(),
            driverId: req.params.id,
            driverName: req.body.driverName || '',
            date,
            hours,
            vehicleId: req.body.vehicleId || null,
            vehicleName: req.body.vehicleName || '',
            note: req.body.note || '',
            updatedAt: new Date(),
        };

        if (existing) {
            await collection.updateOne({ _id: existing._id }, { $set: entry });
            return res.status(200).json({
                status: 'success',
                message: 'Hours updated for that day',
                data: { ...entry, _id: existing._id },
            });
        }

        entry.createdAt = new Date();
        const result = await collection.insertOne(entry);
        res.status(201).json({ status: 'success', data: { ...entry, _id: result.insertedId } });
    } catch (error) {
        console.error('Error adding driver hours:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteDriverHours = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const collection = await db.getCollection('driverHours');
        const result = await collection.deleteOne({
            _id: new ObjectId(req.params.entryId),
            companyId: companyId.toString(),
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Entry not found' });
        }
        res.status(200).json({ status: 'success', message: 'Entry deleted' });
    } catch (error) {
        console.error('Error deleting driver hours:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};
