const db = require('../config/db');

const RtaFinesController = {
  /**
   * Get total fines from rta_total collection
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTotalFines(req, res) {
    try {
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      console.log(`Fetching total fines for company ID: ${companyId}`);
      
      const rtaTotalCollection = await db.getCollection('rta_total');
      const totalFines = await rtaTotalCollection.findOne({ 
        type: 'total_fines'
      });

      if (!totalFines) {
        return res.status(200).json({
          status: 'success',
          data: {
            type: 'total_fines',
            total_amount: 'Pay all AED 0',
            last_updated: new Date()
          }
        });
      }

      res.status(200).json({
        status: 'success',
        data: totalFines
      });
    } catch (error) {
      console.error('Error getting total fines:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to retrieve total fines', 
        error: error.message 
      });
    }
  },

  /**
   * Get all fines from rta_fines collection
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllFines(req, res) {
    try {
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      console.log(`Fetching all fines for company ID: ${companyId}`);
      
      const rtaFinesCollection = await db.getCollection('rta_fines');
      const fines = await rtaFinesCollection
        .find({})
        .sort({ created_at: -1 })
        .toArray();

      res.status(200).json({
        status: 'success',
        data: {
          fines: fines,
          count: fines.length
        }
      });
    } catch (error) {
      console.error('Error getting fines:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to retrieve fines', 
        error: error.message 
      });
    }
  },

  /**
   * Get fines by vehicle
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFinesByVehicle(req, res) {
    try {
      const companyId = req.user.companyId;
      const { vehicleInfo } = req.params;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      console.log(`Fetching fines for vehicle: ${vehicleInfo}`);
      
      const rtaFinesCollection = await db.getCollection('rta_fines');
      const fines = await rtaFinesCollection
        .find({ vehicle_info: vehicleInfo })
        .sort({ created_at: -1 })
        .toArray();

      res.status(200).json({
        status: 'success',
        data: {
          fines: fines,
          count: fines.length
        }
      });
    } catch (error) {
      console.error('Error getting fines by vehicle:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to retrieve fines by vehicle', 
        error: error.message 
      });
    }
  }
};

module.exports = RtaFinesController;
