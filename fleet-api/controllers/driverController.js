const { ObjectId } = require('mongodb');
const DriverModel = require('../models/driverModel');

/**
 * Driver Controller - Handles business logic for driver operations
 */
const DriverController = {
  /**
   * Get all drivers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllDrivers(req, res) {
    try {
      // Get company ID from authenticated user
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      console.log(`Fetching drivers for company ID: ${companyId}`);
      
      const collection = await DriverModel.getCollection();
      
      // Filter drivers by company ID
      const drivers = await collection.find({ 
        companyId: companyId.toString() 
      }).toArray();
      
      console.log(`Found ${drivers.length} drivers for company ID: ${companyId}`);
      
      res.status(200).json(drivers);
    } catch (error) {
      console.error('Error getting all drivers:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to retrieve drivers', 
        error: error.message 
      });
    }
  },

  /**
   * Get a driver by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDriverById(req, res) {
    try {
      const { id } = req.params;
      
      // Get company ID from authenticated user
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Invalid driver ID format' 
        });
      }
      
      const collection = await DriverModel.getCollection();
      const driver = await collection.findOne({ 
        _id: new ObjectId(id),
        companyId: companyId.toString() 
      });
      
      if (!driver) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Driver not found' 
        });
      }
      
      res.status(200).json(driver);
    } catch (error) {
      console.error(`Error getting driver by ID:`, error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to retrieve driver', 
        error: error.message 
      });
    }
  },

  /**
   * Create a new driver
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createDriver(req, res) {
    try {
      const driverData = req.body;
      
      // Get company ID from authenticated user
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      // Add company ID to driver data
      driverData.companyId = companyId.toString();
      
      // Validate driver data
      const validation = DriverModel.validate(driverData);
      if (!validation.isValid) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Invalid driver data', 
          errors: validation.errors 
        });
      }
      
      // Prepare data for insertion
      const preparedData = DriverModel.prepareData(driverData);
      
      const collection = await DriverModel.getCollection();
      const result = await collection.insertOne(preparedData);
      
      res.status(201).json({
        status: 'success',
        message: 'Driver created successfully',
        _id: result.insertedId,
        driver: { _id: result.insertedId, ...preparedData }
      });
    } catch (error) {
      console.error('Error creating driver:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to create driver', 
        error: error.message 
      });
    }
  },

  /**
   * Update a driver
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateDriver(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Get company ID from authenticated user
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Invalid driver ID format' 
        });
      }
      
      // Check if driver exists and belongs to this company
      const collection = await DriverModel.getCollection();
      const existingDriver = await collection.findOne({ 
        _id: new ObjectId(id),
        companyId: companyId.toString()
      });
      
      if (!existingDriver) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Driver not found' 
        });
      }
      
      // Prepare data for update
      const preparedData = DriverModel.prepareData({
        ...existingDriver,
        ...updateData,
        companyId: companyId.toString() // Ensure company ID remains the same
      });
      
      // Remove _id field from update data
      delete preparedData._id;
      
      const result = await collection.updateOne(
        { _id: new ObjectId(id), companyId: companyId.toString() },
        { $set: preparedData }
      );
      
      if (result.modifiedCount === 0) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'No changes were made to the driver' 
        });
      }
      
      // Get the updated driver
      const updatedDriver = await collection.findOne({ _id: new ObjectId(id) });
      
      res.status(200).json({
        status: 'success',
        message: 'Driver updated successfully',
        driver: updatedDriver
      });
    } catch (error) {
      console.error('Error updating driver:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to update driver', 
        error: error.message 
      });
    }
  },

  /**
   * Delete a driver
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteDriver(req, res) {
    try {
      const { id } = req.params;
      
      // Get company ID from authenticated user
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Invalid driver ID format' 
        });
      }
      
      const collection = await DriverModel.getCollection();
      const result = await collection.deleteOne({ 
        _id: new ObjectId(id),
        companyId: companyId.toString()
      });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Driver not found' 
        });
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Driver deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting driver:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to delete driver', 
        error: error.message 
      });
    }
  },

  /**
   * Search for drivers based on query parameters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchDrivers(req, res) {
    try {
      // Get company ID from authenticated user
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      // Build query from request parameters
      const query = {
        // Always filter by company ID
        companyId: companyId.toString()
      };
      
      // Handle name search (first or last name)
      if (req.query.name) {
        const nameRegex = new RegExp(req.query.name, 'i');
        query.$or = [
          { firstName: { $regex: nameRegex } },
          { lastName: { $regex: nameRegex } }
        ];
      }
      
      // Handle status filter
      if (req.query.status) {
        query.status = req.query.status;
      }
      
      // Handle license filter
      if (req.query.licenseNumber) {
        query.licenseNumber = req.query.licenseNumber;
      }
      
      // Handle rating filter
      if (req.query.minRating) {
        query.rating = { $gte: Number(req.query.minRating) };
      }
      
      // Handle vehicle assignment
      if (req.query.assignedVehicle) {
        if (ObjectId.isValid(req.query.assignedVehicle)) {
          query.assignedVehicle = new ObjectId(req.query.assignedVehicle);
        } else {
          query.assignedVehicle = req.query.assignedVehicle;
        }
      }
      
      console.log('Search drivers with query:', query);
      
      const collection = await DriverModel.getCollection();
      const drivers = await collection.find(query).toArray();
      
      console.log(`Found ${drivers.length} drivers matching search criteria for company ${companyId}`);
      
      res.status(200).json(drivers);
    } catch (error) {
      console.error('Error searching drivers:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to search drivers', 
        error: error.message 
      });
    }
  },

  /**
   * Upload document for a driver
   * @param {Object} req - Express request object (with file from multer)
   * @param {Object} res - Express response object
   */
  async uploadDocument(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No file uploaded'
        });
      }

      const collection = await DriverModel.getCollection();
      const driver = await collection.findOne({
        _id: new ObjectId(req.params.id),
        companyId: companyId.toString()
      });

      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      // Create document object
      const document = {
        _id: new ObjectId(),
        type: req.body.type || 'other',
        title: req.body.title || req.file.originalname,
        url: `/drivers/${req.params.id}/${req.file.filename}`,
        uploadDate: new Date(),
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null
      };

      // Initialize documents array if it doesn't exist
      if (!driver.documents) {
        driver.documents = [];
      }

      // Add document to driver
      driver.documents.push(document);
      
      await collection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { documents: driver.documents } }
      );

      res.status(200).json({
        status: 'success',
        message: 'Document uploaded successfully',
        document: document
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to upload document',
        error: error.message
      });
    }
  },

  /**
   * Get all documents for a driver
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDocuments(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      const collection = await DriverModel.getCollection();
      const driver = await collection.findOne({
        _id: new ObjectId(req.params.id),
        companyId: companyId.toString()
      });

      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      res.status(200).json({
        status: 'success',
        documents: driver.documents || []
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch documents',
        error: error.message
      });
    }
  },

  /**
   * Delete a document from a driver
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteDocument(req, res) {
    try {
      const companyId = req.user?.companyId;
      const fs = require('fs');
      const path = require('path');
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      const collection = await DriverModel.getCollection();
      const driver = await collection.findOne({
        _id: new ObjectId(req.params.id),
        companyId: companyId.toString()
      });

      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      // Find the document
      const docIndex = driver.documents?.findIndex(
        doc => doc._id.toString() === req.params.documentId
      );
      
      if (docIndex === -1 || !driver.documents) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const document = driver.documents[docIndex];

      // Delete the physical file
      const filePath = path.join(__dirname, '../../public', document.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove document from array
      driver.documents.splice(docIndex, 1);
      
      await collection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { documents: driver.documents } }
      );

      res.status(200).json({
        status: 'success',
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete document',
        error: error.message
      });
    }
  },

  /**
   * Serve a driver document file (authenticated)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async serveDocument(req, res) {
    try {
      const companyId = req.user?.companyId;
      const fs = require('fs');
      const path = require('path');
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      const collection = await DriverModel.getCollection();
      const driver = await collection.findOne({
        _id: new ObjectId(req.params.driverId),
        companyId: companyId.toString()
      });

      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      // Construct file path
      const filePath = path.join(__dirname, '../../public/drivers', req.params.driverId, req.params.filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Send the file
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error serving document:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to serve document',
        error: error.message
      });
    }
  }
};

module.exports = DriverController; 