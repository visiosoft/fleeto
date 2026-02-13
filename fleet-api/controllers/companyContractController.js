const { CompanyContract, CONTRACT_STATUS } = require('../models/companyContract');

// Get all company contracts
exports.getAllContracts = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        const contracts = await CompanyContract.find({ companyId: companyId });
        res.status(200).json(contracts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get unique companies for dropdown
exports.getUniqueCompanies = async (req, res) => {
    try {
        const companies = await CompanyContract.distinct('companyName');
        res.status(200).json(companies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get contract statuses
exports.getContractStatuses = async (req, res) => {
    try {
        res.status(200).json(Object.values(CONTRACT_STATUS));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a specific contract by ID
exports.getContractById = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        const contract = await CompanyContract.findOne({ _id: req.params.id, companyId: companyId });
        if (!contract) {
            return res.status(404).json({ message: 'Contract not found' });
        }
        res.status(200).json(contract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new contract
exports.createContract = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        const newContract = new CompanyContract({
            companyName: req.body.companyName,
            tradeLicenseNo: req.body.tradeLicenseNo,
            vehicleName: req.body.vehicleName,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            amount: req.body.amount,
            status: req.body.status || CONTRACT_STATUS.PENDING,
            documents: req.body.documents || [],
            notes: req.body.notes,
            companyId: companyId
        });
        const savedContract = await newContract.save();
        res.status(201).json(savedContract);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update contract status
exports.updateContractStatus = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        const { status } = req.body;
        if (!Object.values(CONTRACT_STATUS).includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const updatedContract = await CompanyContract.findOneAndUpdate(
            { _id: req.params.id, companyId: companyId },
            { status },
            { new: true }
        );
        
        if (!updatedContract) {
            return res.status(404).json({ message: 'Contract not found' });
        }
        res.status(200).json(updatedContract);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a contract
exports.updateContract = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        const updatedContract = await CompanyContract.findOneAndUpdate(
            { _id: req.params.id, companyId: companyId },
            req.body,
            { new: true }
        );
        if (!updatedContract) {
            return res.status(404).json({ message: 'Contract not found' });
        }
        res.status(200).json(updatedContract);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a contract
exports.deleteContract = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        const deletedContract = await CompanyContract.findOneAndDelete({ _id: req.params.id, companyId: companyId });
        if (!deletedContract) {
            return res.status(404).json({ message: 'Contract not found' });
        }
        res.status(200).json({ message: 'Contract deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get contracts by company name
exports.getContractsByCompany = async (req, res) => {
    try {
        const contracts = await CompanyContract.find({
            companyName: { $regex: new RegExp(req.params.companyName, 'i') }
        });
        res.status(200).json(contracts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get contracts by trade license number
exports.getContractByTradeLicense = async (req, res) => {
    try {
        const contract = await CompanyContract.findOne({
            tradeLicenseNo: req.params.tradeLicenseNo
        });
        if (!contract) {
            return res.status(404).json({ message: 'Contract not found' });
        }
        res.status(200).json(contract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get contracts by status
exports.getContractsByStatus = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        const contracts = await CompanyContract.find({
            status: req.params.status,
            companyId: companyId
        });
        res.status(200).json(contracts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get expiring contracts (within next 30 days)
exports.getExpiringContracts = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const contracts = await CompanyContract.find({
            endDate: {
                $gte: new Date(),
                $lte: thirtyDaysFromNow
            },
            status: CONTRACT_STATUS.ACTIVE,
            companyId: companyId
        });
        res.status(200).json(contracts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get contract statistics
exports.getContractStats = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        const stats = await CompanyContract.aggregate([
            { $match: { companyId: companyId } },
            {
                $group: {
                    _id: null,
                    totalContracts: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    averageAmount: { $avg: '$amount' },
                    activeContracts: {
                        $sum: {
                            $cond: [{ $eq: ['$status', CONTRACT_STATUS.ACTIVE] }, 1, 0]
                        }
                    }
                }
            }
        ]);
        res.status(200).json(stats[0] || { totalContracts: 0, totalAmount: 0, averageAmount: 0, activeContracts: 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 