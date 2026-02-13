const { ObjectId } = require('mongodb');
const db = require('../config/db');

const ContractTemplateController = {
  /**
   * Get all contract templates
   */
  async getAllTemplates(req, res) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      const collection = await db.getCollection('contractTemplates');
      const templates = await collection.find({
        companyId: companyId.toString()
      }).toArray();

      res.status(200).json({
        status: 'success',
        data: templates
      });
    } catch (error) {
      console.error('Error getting contract templates:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve contract templates',
        error: error.message
      });
    }
  },

  /**
   * Get a contract template by ID
   */
  async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid template ID format'
        });
      }

      const collection = await db.getCollection('contractTemplates');
      const template = await collection.findOne({
        _id: new ObjectId(id),
        companyId: companyId.toString()
      });

      if (!template) {
        return res.status(404).json({
          status: 'error',
          message: 'Contract template not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: template
      });
    } catch (error) {
      console.error('Error getting contract template:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve contract template',
        error: error.message
      });
    }
  },

  /**
   * Create a new contract template
   */
  async createTemplate(req, res) {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      const { name, content } = req.body;

      if (!name || !content) {
        return res.status(400).json({
          status: 'error',
          message: 'Name and content are required'
        });
      }

      const templateData = {
        name,
        content,
        companyId: companyId.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const collection = await db.getCollection('contractTemplates');
      const result = await collection.insertOne(templateData);

      res.status(201).json({
        status: 'success',
        message: 'Contract template created successfully',
        data: {
          _id: result.insertedId,
          ...templateData
        }
      });
    } catch (error) {
      console.error('Error creating contract template:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create contract template',
        error: error.message
      });
    }
  },

  /**
   * Update a contract template
   */
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid template ID format'
        });
      }

      const { name, content } = req.body;
      const updateData = {
        updatedAt: new Date()
      };

      if (name) updateData.name = name;
      if (content) updateData.content = content;

      const collection = await db.getCollection('contractTemplates');
      const result = await collection.findOneAndUpdate(
        {
          _id: new ObjectId(id),
          companyId: companyId.toString()
        },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({
          status: 'error',
          message: 'Contract template not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Contract template updated successfully',
        data: result.value
      });
    } catch (error) {
      console.error('Error updating contract template:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update contract template',
        error: error.message
      });
    }
  },

  /**
   * Delete a contract template
   */
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid template ID format'
        });
      }

      const collection = await db.getCollection('contractTemplates');
      const result = await collection.deleteOne({
        _id: new ObjectId(id),
        companyId: companyId.toString()
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Contract template not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Contract template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting contract template:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete contract template',
        error: error.message
      });
    }
  }
};

module.exports = ContractTemplateController;
