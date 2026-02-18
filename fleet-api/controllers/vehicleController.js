const { ObjectId } = require('mongodb');
const VehicleModel = require('../models/vehicleModel');
const Vehicle = require('../models/Vehicle');

/**
 * Vehicle Controller - Handles business logic for vehicle operations
 */
const VehicleController = {
  /**
   * Get all vehicles for the company
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllVehicles(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      console.log('Getting vehicles for companyId:', companyId);
      console.log('User object:', JSON.stringify(req.user, null, 2));
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const vehicles = await Vehicle.find({ companyId: companyId });
      console.log('Found vehicles:', vehicles.length);
      res.json(vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * Get a vehicle by ID (company-specific)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getVehicleById(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      res.json(vehicle);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * Create a new vehicle
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createVehicle(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const vehicle = new Vehicle({
        ...req.body,
        companyId: companyId
      });
      await vehicle.save();
      res.status(201).json(vehicle);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Update a vehicle
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateVehicle(req, res) {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      'make', 'model', 'year', 'licensePlate', 'vin',
      'type', 'status', 'mileage', 'lastService',
      'nextServiceDue', 'fuelType', 'fuelCapacity',
      'lastMaintenance', 'nextMaintenance', 'expiryDate',
      'assignedDriver', 'insuranceInfo', 'notes',
      'registrationExpiry', 'currentMileage', 'lastServiceDate'
    ];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      const invalidFields = updates.filter(update => !allowedUpdates.includes(update));
      console.error('Invalid update fields:', invalidFields);
      console.error('Received fields:', updates);
      return res.status(400).json({ 
        message: 'Invalid updates',
        invalidFields: invalidFields,
        receivedFields: updates
      });
    }

    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      updates.forEach(update => vehicle[update] = req.body[update]);
      await vehicle.save();
      res.json(vehicle);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Delete a vehicle
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteVehicle(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const vehicle = await Vehicle.findOneAndDelete({
        _id: req.params.id,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * Get vehicle maintenance records
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getVehicleMaintenance(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      res.json(vehicle.maintenance);
    } catch (error) {
      console.error('Error fetching vehicle maintenance:', error);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * Add maintenance record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addMaintenanceRecord(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      vehicle.maintenance.push(req.body);
      await vehicle.save();
      res.status(201).json(vehicle.maintenance[vehicle.maintenance.length - 1]);
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Update maintenance record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateMaintenanceRecord(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      const maintenanceRecord = vehicle.maintenance.id(req.params.maintenanceId);
      if (!maintenanceRecord) {
        return res.status(404).json({ message: 'Maintenance record not found' });
      }

      Object.assign(maintenanceRecord, req.body);
      await vehicle.save();
      res.json(maintenanceRecord);
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Delete maintenance record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteMaintenanceRecord(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      vehicle.maintenance = vehicle.maintenance.filter(
        record => record._id.toString() !== req.params.maintenanceId
      );

      await vehicle.save();
      res.json({ message: 'Maintenance record deleted successfully' });
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * Get vehicle documents
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getVehicleDocuments(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      res.json(vehicle.documents);
    } catch (error) {
      console.error('Error fetching vehicle documents:', error);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * Add vehicle document
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addVehicleDocument(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      vehicle.documents.push(req.body);
      await vehicle.save();
      res.status(201).json(vehicle.documents[vehicle.documents.length - 1]);
    } catch (error) {
      console.error('Error adding vehicle document:', error);
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Delete vehicle document
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteVehicleDocument(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      vehicle.documents = vehicle.documents.filter(
        doc => doc._id.toString() !== req.params.documentId
      );

      await vehicle.save();
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting vehicle document:', error);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * Search for vehicles based on query parameters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchVehicles(req, res) {
    try {
      // Build query from request parameters
      const query = {};
      
      // Handle make/model search
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        query.$or = [
          { make: { $regex: searchRegex } },
          { model: { $regex: searchRegex } },
          { licensePlate: { $regex: searchRegex } }
        ];
      }
      
      // Handle status filter
      if (req.query.status) {
        query.status = req.query.status;
      }
      
      // Handle year filter
      if (req.query.year) {
        query.year = parseInt(req.query.year);
      }
      
      // Handle mileage range filter
      if (req.query.minMileage || req.query.maxMileage) {
        query.mileage = {};
        if (req.query.minMileage) query.mileage.$gte = parseInt(req.query.minMileage);
        if (req.query.maxMileage) query.mileage.$lte = parseInt(req.query.maxMileage);
      }
      
      const collection = await VehicleModel.getCollection();
      const vehicles = await collection.find(query).toArray();
      
      res.status(200).json(vehicles);
    } catch (error) {
      console.error('Error searching vehicles:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to search vehicles', 
        error: error.message 
      });
    }
  },

  /**
   * Upload document for a vehicle
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

      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      // Create document object
      const document = {
        type: req.body.type || 'other',
        title: req.body.title || req.file.originalname,
        url: `/vehicles/${req.params.id}/${req.file.filename}`,
        uploadDate: new Date(),
        expiryDate: req.body.expiryDate || null
      };

      // Add document to vehicle
      vehicle.documents.push(document);
      await vehicle.save();

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
   * Get all documents for a vehicle
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

      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      res.status(200).json({
        status: 'success',
        documents: vehicle.documents
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
   * Delete a document from a vehicle
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

      const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      // Find the document
      const document = vehicle.documents.id(req.params.documentId);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Delete the physical file
      const filePath = path.join(__dirname, '../../public', document.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove document from array
      document.deleteOne();
      await vehicle.save();

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
   * Serve a vehicle document file (authenticated)
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

      const vehicle = await Vehicle.findOne({
        _id: req.params.vehicleId,
        companyId: companyId
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      // Construct file path
      const filePath = path.join(__dirname, '../../public/vehicles', req.params.vehicleId, req.params.filename);
      
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
  },

  // Set vehicle image from uploaded document
  setVehicleImage: async (req, res) => {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          status: 'error',
          message: 'Image URL is required'
        });
      }

      const vehicle = await Vehicle.findByIdAndUpdate(
        id,
        { image: imageUrl },
        { new: true, runValidators: true }
      );

      if (!vehicle) {
        return res.status(404).json({
          status: 'error',
          message: 'Vehicle not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Vehicle image updated successfully',
        data: vehicle
      });
    } catch (error) {
      console.error('Error setting vehicle image:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to set vehicle image',
        error: error.message
      });
    }
  }
};

module.exports = VehicleController; 