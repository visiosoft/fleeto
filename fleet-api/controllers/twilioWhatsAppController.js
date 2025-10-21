const TwilioWhatsAppService = require('../services/twilioWhatsAppService');
const { ObjectId } = require('mongodb');
const db = require('../config/db');

class TwilioWhatsAppController {
  constructor() {
    this.whatsappService = new TwilioWhatsAppService();
  }

  /**
   * Handle incoming webhook from Twilio
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleWebhook(req, res) {
    const whatsappService = new TwilioWhatsAppService();
    await whatsappService.handleWebhook(req, res);
  }

  /**
   * Handle payment received webhook from Twilio
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleReceivedPayment(req, res) {
    try {
      const whatsappService = new TwilioWhatsAppService();
      await whatsappService.processReceivedPayment(req, res);
    } catch (error) {
      console.error('Error handling received payment:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process received payment'
      });
    }
  }

  /**
   * Get all Twilio WhatsApp expenses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTwilioExpenses(req, res) {
    try {
      const { companyId } = req.user;
      const { status = 'all', page = 1, limit = 10 } = req.query;

      const collection = await db.getCollection('expenses');
      const skip = (page - 1) * limit;

      // Build query
      const query = {
        companyId: companyId.toString(),
        source: 'whatsapp_twilio'
      };

      if (status !== 'all') {
        query.status = status;
      }

      // Get expenses with pagination
      const expenses = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      // Get total count
      const total = await collection.countDocuments(query);

      // Populate vehicle and driver info
      const populatedExpenses = await Promise.all(
        expenses.map(async (expense) => {
          const vehicle = await db.getCollection('vehicles').findOne({ _id: expense.vehicleId });
          const driver = await db.getCollection('drivers').findOne({ _id: expense.driverId });
          
          return {
            ...expense,
            vehicle: vehicle ? {
              _id: vehicle._id,
              licensePlate: vehicle.licensePlate,
              make: vehicle.make,
              model: vehicle.model
            } : null,
            driver: driver ? {
              _id: driver._id,
              firstName: driver.firstName,
              lastName: driver.lastName,
              contact: driver.contact
            } : null
          };
        })
      );

      res.json({
        status: 'success',
        data: {
          expenses: populatedExpenses,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching Twilio WhatsApp expenses:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch Twilio WhatsApp expenses'
      });
    }
  }

  /**
   * Get single Twilio WhatsApp expense
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTwilioExpense(req, res) {
    try {
      const { id } = req.params;
      const { companyId } = req.user;

      const collection = await db.getCollection('expenses');
      const expense = await collection.findOne({
        _id: new ObjectId(id),
        companyId: companyId.toString(),
        source: 'whatsapp_twilio'
      });

      if (!expense) {
        return res.status(404).json({
          status: 'error',
          message: 'Twilio WhatsApp expense not found'
        });
      }

      // Populate vehicle and driver info
      const vehicle = await db.getCollection('vehicles').findOne({ _id: expense.vehicleId });
      const driver = await db.getCollection('drivers').findOne({ _id: expense.driverId });

      const populatedExpense = {
        ...expense,
        vehicle: vehicle ? {
          _id: vehicle._id,
          licensePlate: vehicle.licensePlate,
          make: vehicle.make,
          model: vehicle.model
        } : null,
        driver: driver ? {
          _id: driver._id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          contact: driver.contact
        } : null
      };

      res.json({
        status: 'success',
        data: populatedExpense
      });
    } catch (error) {
      console.error('Error fetching Twilio WhatsApp expense:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch Twilio WhatsApp expense'
      });
    }
  }

  /**
   * Update expense status (approve/reject)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateExpenseStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const { companyId } = req.user;

      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status. Must be approved, rejected, or pending'
        });
      }

      const collection = await db.getCollection('expenses');
      const result = await collection.updateOne(
        {
          _id: new ObjectId(id),
          companyId: companyId.toString(),
          source: 'whatsapp_twilio'
        },
        {
          $set: {
            status,
            notes: notes || '',
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Twilio WhatsApp expense not found'
        });
      }

      // Send notification to driver if status changed
      const expense = await collection.findOne({ _id: new ObjectId(id) });
      if (expense && expense.whatsappNumber) {
        await this.sendStatusNotification(expense.whatsappNumber, status, expense);
      }

      res.json({
        status: 'success',
        message: `Expense ${status} successfully`
      });
    } catch (error) {
      console.error('Error updating expense status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update expense status'
      });
    }
  }

  /**
   * Get expense statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getExpenseStats(req, res) {
    try {
      const { companyId } = req.user;
      const collection = await db.getCollection('expenses');

      const stats = await collection.aggregate([
        {
          $match: {
            companyId: companyId.toString(),
            source: 'whatsapp_twilio'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            approved: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            },
            pendingAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
            },
            approvedAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] }
            }
          }
        }
      ]).toArray();

      const result = stats[0] || {
        total: 0,
        totalAmount: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        pendingAmount: 0,
        approvedAmount: 0
      };

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Error fetching expense stats:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch expense statistics'
      });
    }
  }

  /**
   * Get monthly expenses grouped by month with totals and counts
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getMonthlyExpenses(req, res) {
    try {
      const { companyId } = req.user;
      const { year } = req.query;
      const collection = await db.getCollection('expenses');
      
      const pipeline = [
        {
          $match: {
            companyId: companyId.toString(),
            source: 'whatsapp_twilio',
            date: {
              $gte: new Date(year || new Date().getFullYear(), 0, 1),
              $lt: new Date((year || new Date().getFullYear()) + 1, 0, 1)
            }
          }
        },
        {
          $group: {
            _id: {
              month: { $month: '$date' },
              year: { $year: '$date' }
            },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            month: '$_id.month',
            year: '$_id.year',
            totalAmount: 1,
            count: 1
          }
        },
        { $sort: { month: 1 } }
      ];

      const monthlyExpenses = await collection.aggregate(pipeline).toArray();
      
      // Calculate yearly total
      const yearlyTotal = monthlyExpenses.reduce((total, month) => total + month.totalAmount, 0);
      
      res.status(200).json({
        status: 'success',
        data: {
          monthlyExpenses,
          yearlyTotal
        }
      });
    } catch (error) {
      console.error('Error getting monthly expenses:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to retrieve monthly expenses', 
        error: error.message 
      });
    }
  }

  /**
   * Delete Twilio WhatsApp expense
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteTwilioExpense(req, res) {
    try {
      const { id } = req.params;
      const { companyId } = req.user;

      const collection = await db.getCollection('expenses');
      const result = await collection.deleteOne({
        _id: new ObjectId(id),
        companyId: companyId.toString(),
        source: 'whatsapp_twilio'
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Twilio WhatsApp expense not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Twilio WhatsApp expense deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting Twilio WhatsApp expense:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete Twilio WhatsApp expense'
      });
    }
  }

  /**
   * Send status notification to driver
   * @param {string} whatsappNumber - Driver's WhatsApp number
   * @param {string} status - New status
   * @param {Object} expense - Expense details
   */
  async sendStatusNotification(whatsappNumber, status, expense) {
    try {
      const whatsappService = new TwilioWhatsAppService();
      let message = '';
      const emoji = status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳';
      
      switch (status) {
        case 'approved':
          message = `${emoji} *Expense Approved!*

📋 *Details:*
• Type: ${expense.expenseType.toUpperCase()}
• Amount: ${expense.amount} AED
• Date: ${expense.date.toDateString()}

🆔 *Expense ID:* ${expense._id}

Your expense has been approved and will be processed for payment.`;
          break;
        case 'rejected':
          message = `${emoji} *Expense Rejected*

📋 *Details:*
• Type: ${expense.expenseType.toUpperCase()}
• Amount: ${expense.amount} AED
• Date: ${expense.date.toDateString()}

🆔 *Expense ID:* ${expense._id}

Your expense has been rejected. Please contact your manager for more information.`;
          break;
        case 'pending':
          message = `${emoji} *Expense Status Updated*

📋 *Details:*
• Type: ${expense.expenseType.toUpperCase()}
• Amount: ${expense.amount} AED
• Date: ${expense.date.toDateString()}

🆔 *Expense ID:* ${expense._id}

Your expense status has been updated to pending.`;
          break;
      }

      await whatsappService.sendMessage(whatsappNumber, message);
    } catch (error) {
      console.error('Error sending status notification:', error);
    }
  }

  /**
   * Send test message
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async sendTestMessage(req, res) {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        return res.status(400).json({
          status: 'error',
          message: 'Phone number and message are required'
        });
      }

      const whatsappService = new TwilioWhatsAppService();
      const response = await whatsappService.sendMessage(to, message);

      res.json({
        status: 'success',
        message: 'Test message sent successfully',
        messageSid: response.sid
      });
    } catch (error) {
      console.error('Error sending test message:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send test message'
      });
    }
  }

  /**
   * Test expense retrieval without sending WhatsApp messages
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async testExpenseRetrieval(req, res) {
    try {
      const { whatsappNumber, command = '/expenses' } = req.body;

      if (!whatsappNumber) {
        return res.status(400).json({
          status: 'error',
          message: 'WhatsApp number is required'
        });
      }

      const whatsappService = new TwilioWhatsAppService();
      await whatsappService.testExpenseRetrieval(whatsappNumber, command);

      res.json({
        status: 'success',
        message: 'Test completed - check console logs for output',
        whatsappNumber,
        command
      });
    } catch (error) {
      console.error('Error testing expense retrieval:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to test expense retrieval'
      });
    }
  }
}

module.exports = new TwilioWhatsAppController();
