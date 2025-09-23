const { ObjectId } = require('mongodb');
const db = require('../config/db');
const { validateObjectId } = require('../utils/validation');

// Get all letterheads for a company
exports.getAllLetterheads = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        console.log(`Fetching letterheads for company ID: ${companyId}`);
        
        const collection = await db.getCollection('letterheads');
        const letterheads = await collection.find({
            companyId: companyId.toString(),
            isActive: true
        })
        .sort({ isDefault: -1, createdAt: -1 })
        .toArray();
        
        console.log(`Found ${letterheads.length} letterheads for company ${companyId}`);
        
        res.status(200).json({
            status: 'success',
            data: letterheads
        });
    } catch (error) {
        console.error('Error getting all letterheads:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get single letterhead by ID
exports.getLetterheadById = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        if (!validateObjectId(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid letterhead ID'
            });
        }
        
        const collection = await db.getCollection('letterheads');
        const letterhead = await collection.findOne({
            _id: new ObjectId(id),
            companyId: companyId.toString(),
            isActive: true
        });
        
        if (!letterhead) {
            return res.status(404).json({
                status: 'error',
                message: 'Letterhead not found'
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: letterhead
        });
    } catch (error) {
        console.error('Error getting letterhead by ID:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Create new letterhead
exports.createLetterhead = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        console.log(`Creating letterhead for company ID: ${companyId}`);
        
        const {
            name,
            description,
            isDefault,
            header,
            footer,
            styling,
            margins
        } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Name is required'
            });
        }

        // If this is set as default, ensure no other letterhead is default
        if (isDefault) {
            const collection = await db.getCollection('letterheads');
            await collection.updateMany(
                { 
                    companyId: companyId.toString(),
                    isActive: true
                },
                { isDefault: false }
            );
        }

        const letterhead = {
            companyId: companyId.toString(),
            name,
            description: description || '',
            isDefault: isDefault || false,
            header: {
                logo: header?.logo || '',
                companyName: header?.companyName || '',
                tagline: header?.tagline || '',
                address: {
                    street: header?.address?.street || '',
                    city: header?.address?.city || '',
                    state: header?.address?.state || '',
                    zipCode: header?.address?.zipCode || '',
                    country: header?.address?.country || ''
                },
                contact: {
                    phone: header?.contact?.phone || '',
                    email: header?.contact?.email || '',
                    website: header?.contact?.website || ''
                }
            },
            footer: {
                text: footer?.text || '',
                includePageNumbers: footer?.includePageNumbers !== false,
                includeDate: footer?.includeDate !== false
            },
            styling: {
                primaryColor: styling?.primaryColor || '#1976d2',
                secondaryColor: styling?.secondaryColor || '#424242',
                fontFamily: styling?.fontFamily || 'Arial, sans-serif',
                fontSize: styling?.fontSize || 12,
                logoSize: {
                    width: styling?.logoSize?.width || 150,
                    height: styling?.logoSize?.height || 60
                }
            },
            margins: {
                top: margins?.top || 1,
                bottom: margins?.bottom || 1,
                left: margins?.left || 1,
                right: margins?.right || 1
            },
            customText: req.body.customText || '',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const collection = await db.getCollection('letterheads');
        const result = await collection.insertOne(letterhead);
        
        const createdLetterhead = await collection.findOne({ _id: result.insertedId });
        
        console.log(`Created letterhead with ID: ${result.insertedId}`);
        
        res.status(201).json({
            status: 'success',
            data: createdLetterhead
        });
    } catch (error) {
        console.error('Error creating letterhead:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Update letterhead
exports.updateLetterhead = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        if (!validateObjectId(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid letterhead ID'
            });
        }
        
        const {
            name,
            description,
            isDefault,
            header,
            footer,
            styling,
            margins
        } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Name is required'
            });
        }

        // If this is set as default, ensure no other letterhead is default
        if (isDefault) {
            const collection = await db.getCollection('letterheads');
            await collection.updateMany(
                { 
                    companyId: companyId.toString(),
                    _id: { $ne: new ObjectId(id) },
                    isActive: true
                },
                { isDefault: false }
            );
        }

        const updateData = {
            name,
            description: description || '',
            isDefault: isDefault || false,
            header: {
                logo: header?.logo || '',
                companyName: header?.companyName || '',
                tagline: header?.tagline || '',
                address: {
                    street: header?.address?.street || '',
                    city: header?.address?.city || '',
                    state: header?.address?.state || '',
                    zipCode: header?.address?.zipCode || '',
                    country: header?.address?.country || ''
                },
                contact: {
                    phone: header?.contact?.phone || '',
                    email: header?.contact?.email || '',
                    website: header?.contact?.website || ''
                }
            },
            footer: {
                text: footer?.text || '',
                includePageNumbers: footer?.includePageNumbers !== false,
                includeDate: footer?.includeDate !== false
            },
            styling: {
                primaryColor: styling?.primaryColor || '#1976d2',
                secondaryColor: styling?.secondaryColor || '#424242',
                fontFamily: styling?.fontFamily || 'Arial, sans-serif',
                fontSize: styling?.fontSize || 12,
                logoSize: {
                    width: styling?.logoSize?.width || 150,
                    height: styling?.logoSize?.height || 60
                }
            },
            margins: {
                top: margins?.top || 1,
                bottom: margins?.bottom || 1,
                left: margins?.left || 1,
                right: margins?.right || 1
            },
            customText: req.body.customText || '',
            updatedAt: new Date()
        };

        const collection = await db.getCollection('letterheads');
        const result = await collection.updateOne(
            {
                _id: new ObjectId(id),
                companyId: companyId.toString(),
                isActive: true
            },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Letterhead not found'
            });
        }
        
        const updatedLetterhead = await collection.findOne({ _id: new ObjectId(id) });
        
        console.log(`Updated letterhead with ID: ${id}`);
        
        res.status(200).json({
            status: 'success',
            data: updatedLetterhead
        });
    } catch (error) {
        console.error('Error updating letterhead:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Delete letterhead (soft delete)
exports.deleteLetterhead = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        if (!validateObjectId(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid letterhead ID'
            });
        }
        
        const collection = await db.getCollection('letterheads');
        const result = await collection.updateOne(
            {
                _id: new ObjectId(id),
                companyId: companyId.toString(),
                isActive: true
            },
            { 
                $set: { 
                    isActive: false,
                    updatedAt: new Date()
                } 
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Letterhead not found'
            });
        }
        
        console.log(`Deleted letterhead with ID: ${id}`);
        
        res.status(200).json({
            status: 'success',
            message: 'Letterhead deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting letterhead:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Set default letterhead
exports.setDefaultLetterhead = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        if (!validateObjectId(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid letterhead ID'
            });
        }
        
        const collection = await db.getCollection('letterheads');
        
        // First, set all letterheads to not default
        await collection.updateMany(
            { 
                companyId: companyId.toString(),
                isActive: true
            },
            { isDefault: false }
        );
        
        // Then set the selected one as default
        const result = await collection.updateOne(
            {
                _id: new ObjectId(id),
                companyId: companyId.toString(),
                isActive: true
            },
            { 
                $set: { 
                    isDefault: true,
                    updatedAt: new Date()
                } 
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Letterhead not found'
            });
        }
        
        const updatedLetterhead = await collection.findOne({ _id: new ObjectId(id) });
        
        console.log(`Set letterhead ${id} as default for company ${companyId}`);
        
        res.status(200).json({
            status: 'success',
            data: updatedLetterhead
        });
    } catch (error) {
        console.error('Error setting default letterhead:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get default letterhead
exports.getDefaultLetterhead = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID not found in user token'
            });
        }
        
        const collection = await db.getCollection('letterheads');
        const letterhead = await collection.findOne({
            companyId: companyId.toString(),
            isDefault: true,
            isActive: true
        });
        
        if (!letterhead) {
            return res.status(404).json({
                status: 'error',
                message: 'No default letterhead found'
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: letterhead
        });
    } catch (error) {
        console.error('Error getting default letterhead:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
