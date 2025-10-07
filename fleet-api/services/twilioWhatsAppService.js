const twilio = require('twilio');
const ExpenseModel = require('../models/expenseModel');
const { ObjectId } = require('mongodb');
const db = require('../config/db');

class TwilioWhatsAppService {
  constructor() {
    // Hardcoded Twilio credentials for testing
    // Replace these with your actual Twilio credentials from Twilio Console
    const accountSid = process.env.TWILIO_ACCOUNT_SID || 'process.env.TWILIO_ACCOUNT_SID';
    const authToken = process.env.TWILIO_AUTH_TOKEN || 'process.env.TWILIO_AUTH_TOKEN';
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'process.env.TWILIO_WHATSAPP_NUMBER';
    
    this.client = twilio(accountSid, authToken);
    this.fromNumber = whatsappNumber;
  }

  /**
   * Send a WhatsApp message
   * @param {string} to - Recipient number (e.g., 'whatsapp:+1234567890')
   * @param {string} message - Message content
   * @returns {Promise<Object>} Twilio message response
   */
  async sendMessage(to, message) {
    try {
      const response = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to
      });
      console.log('WhatsApp message sent:', response.sid);
      return response;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Send expense template to user
   * @param {string} to - Recipient number
   */
  async sendExpenseTemplate(to) {
    // Get available vehicles and drivers
    const vehicles = await this.getAvailableVehicles();
    const drivers = await this.getAvailableDrivers();
    
    const vehicleList = vehicles.length > 0 
      ? vehicles.map(v => `• ${v.licensePlate} (${v.make} ${v.model})`).join('\n')
      : '• No vehicles found';
    
    const driverList = drivers.length > 0
      ? drivers.map(d => `• ${d.firstName} ${d.lastName} (${d.contact})`).join('\n')
      : '• No drivers found';

    const template = `📱 *Expense Submission - Simple Mode*

*Available Vehicles:*
${vehicleList}

*Available Drivers:*
${driverList}

*Quick Commands:*
• /fuel - Submit fuel expense
• /maintenance - Submit maintenance expense  
• /other - Submit other expense
• /help - Show this menu

*Example:*
/fuel
Vehicle: ABC-123
Amount: 150.50 AED
Location: ADNOC Station

Type any command to get started!`;

    await this.sendMessage(to, template);
  }

  /**
   * Get available vehicles from database
   * @returns {Promise<Array>} List of vehicles
   */
  async getAvailableVehicles() {
    try {
      const collection = await db.getCollection('vehicles');
      const vehicles = await collection.find({}).limit(10).toArray();
      return vehicles.map(v => ({
        _id: v._id,
        licensePlate: v.licensePlate,
        make: v.make,
        model: v.model
      }));
    } catch (error) {
      console.error('Error getting vehicles:', error);
      return [];
    }
  }

  /**
   * Get available drivers from database
   * @returns {Promise<Array>} List of drivers
   */
  async getAvailableDrivers() {
    try {
      const collection = await db.getCollection('drivers');
      const drivers = await collection.find({}).limit(10).toArray();
      return drivers.map(d => ({
        _id: d._id,
        firstName: d.firstName,
        lastName: d.lastName,
        contact: d.contact
      }));
    } catch (error) {
      console.error('Error getting drivers:', error);
      return [];
    }
  }

  /**
   * Send vehicles list
   * @param {string} to - Recipient number
   */
  async sendVehiclesList(to) {
    const vehicles = await this.getAvailableVehicles();
    
    if (vehicles.length === 0) {
      await this.sendMessage(to, '🚗 *Available Vehicles*\n\nNo vehicles found in the system.');
      return;
    }
    
    const vehicleList = vehicles.map(v => `• ${v.licensePlate} (${v.make} ${v.model})`).join('\n');
    
    const message = `🚗 *Available Vehicles*\n\n${vehicleList}\n\n*To submit an expense:*
/fuel
Vehicle: ABC-123
Amount: 150.50 AED
Location: ADNOC Station`;
    
    await this.sendMessage(to, message);
  }

  /**
   * Send drivers list
   * @param {string} to - Recipient number
   */
  async sendDriversList(to) {
    const drivers = await this.getAvailableDrivers();
    
    if (drivers.length === 0) {
      await this.sendMessage(to, '👥 *Available Drivers*\n\nNo drivers found in the system.');
      return;
    }
    
    const driverList = drivers.map(d => `• ${d.firstName} ${d.lastName} (${d.contact})`).join('\n');
    
    const message = `👥 *Available Drivers*\n\n${driverList}\n\n*To submit an expense:*
/fuel
Vehicle: ABC-123
Amount: 150.50 AED
Location: ADNOC Station`;
    
    await this.sendMessage(to, message);
  }

  /**
   * Send help message
   * @param {string} to - Recipient number
   */
  async sendHelpMessage(to) {
    const helpMessage = `📱 *Expense Management Help*

*Quick Commands:*
• /fuel - Submit fuel expense
• /maintenance - Submit maintenance expense  
• /other - Submit other expense
• /vehicles - Show available vehicles
• /drivers - Show available drivers
• /help - Show this help message

*Simple Format:*
/fuel
Vehicle: ABC-123
Amount: 150.50 AED
Location: ADNOC Station

Type any command to get started!`;

    await this.sendMessage(to, helpMessage);
  }

  /**
   * Send confirmation message after successful expense creation
   * @param {string} to - Recipient number
   * @param {string} expenseId - Created expense ID
   * @param {Object} expenseData - Parsed expense data
   */
  async sendConfirmationMessage(to, expenseId, expenseData) {
    const message = `✅ *Expense Added Successfully!*

📋 *Details:*
• Type: ${expenseData.type.toUpperCase()}
• Vehicle: ${expenseData.vehicle}
• Amount: ${expenseData.amount} AED
• Date: ${expenseData.date}

🆔 *Expense ID:* ${expenseId}
📊 *Status:* Pending Approval

Your expense has been submitted and is pending approval.`;

    await this.sendMessage(to, message);
  }

  /**
   * Send error message
   * @param {string} to - Recipient number
   * @param {string} errorMessage - Error description
   */
  async sendErrorMessage(to, errorMessage = 'There was an error processing your expense. Please check the format and try again.') {
    const message = `❌ *Error Processing Expense*

${errorMessage}

Type /expense to see the correct format or /help for more information.`;

    await this.sendMessage(to, message);
  }

  /**
   * Parse expense message from WhatsApp
   * @param {string} messageText - Raw message text
   * @returns {Object|null} Parsed expense data or null if invalid
   */
  parseExpenseMessage(messageText) {
    const lines = messageText.split('\n').map(line => line.trim()).filter(line => line);
    
    // Check if message starts with expense command
    const firstLine = lines[0].toLowerCase();
    let expenseType = null;
    
    if (firstLine.startsWith('/fuel')) {
      expenseType = 'fuel';
    } else if (firstLine.startsWith('/maintenance')) {
      expenseType = 'maintenance';
    } else if (firstLine.startsWith('/other')) {
      expenseType = 'other';
    } else if (firstLine.startsWith('/expense')) {
      const parts = firstLine.split(' ');
      expenseType = parts[1];
    }
    
    if (!expenseType || !['fuel', 'maintenance', 'other'].includes(expenseType)) {
      return null;
    }

    const expenseData = { type: expenseType };
    
    // Parse the remaining lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const colonIndex = line.indexOf(':');
      
      if (colonIndex === -1) continue;
      
      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();
      
      switch (key) {
        case 'vehicle':
          expenseData.vehicle = value;
          break;
        case 'amount':
          const amount = parseFloat(value.replace(/[^\d.]/g, ''));
          if (!isNaN(amount)) {
            expenseData.amount = amount;
          }
          break;
        case 'location':
          expenseData.location = value;
          break;
        case 'garage':
          expenseData.garage = value;
          break;
        case 'type':
          expenseData.serviceType = value;
          break;
        case 'description':
          expenseData.description = value;
          break;
        case 'date':
          expenseData.date = value;
          break;
      }
    }

    // Validate required fields
    if (!expenseData.vehicle || !expenseData.amount || !expenseData.date) {
      return null;
    }

    // Type-specific validation
    if (expenseType === 'fuel' && !expenseData.location) {
      return null;
    }
    if (expenseType === 'maintenance' && (!expenseData.serviceType || !expenseData.garage)) {
      return null;
    }
    if (expenseType === 'other' && !expenseData.description) {
      return null;
    }

    return expenseData;
  }

  /**
   * Process expense from WhatsApp message
   * @param {Object} expenseData - Parsed expense data
   * @param {string} fromNumber - Sender's phone number
   * @returns {Promise<Object>} Created expense
   */
  async processExpense(expenseData, fromNumber) {
    try {
      // Find vehicle and driver
      const vehicleId = await this.findVehicleId(expenseData.vehicle);
      const driverId = await this.findDriverId(fromNumber);

      if (!vehicleId) {
        throw new Error('Vehicle not found. Please check the license plate.');
      }

      if (!driverId) {
        throw new Error('Driver not found. Please ensure your phone number is registered.');
      }

      // Create expense record
      const expense = {
        vehicleId: vehicleId,
        driverId: driverId,
        expenseType: this.mapExpenseType(expenseData.type),
        amount: expenseData.amount,
        date: new Date(expenseData.date),
        description: this.buildDescription(expenseData),
        paymentStatus: 'pending',
        paymentMethod: 'cash',
        vendor: expenseData.location || expenseData.garage || 'Unknown',
        source: 'whatsapp_twilio',
        whatsappNumber: fromNumber,
        rawMessage: JSON.stringify(expenseData),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate expense data
      const validation = ExpenseModel.validate(expense);
      if (!validation.isValid) {
        throw new Error(`Validation error: ${validation.errors.join(', ')}`);
      }

      // Save to database
      const collection = await db.getCollection('expenses');
      const result = await collection.insertOne(expense);

      return {
        _id: result.insertedId,
        ...expense
      };
    } catch (error) {
      console.error('Error processing expense:', error);
      throw error;
    }
  }

  /**
   * Find vehicle ID by license plate
   * @param {string} vehicleIdentifier - License plate or vehicle ID
   * @returns {Promise<string|null>} Vehicle ID or null
   */
  async findVehicleId(vehicleIdentifier) {
    const collection = await db.getCollection('vehicles');
    
    const vehicle = await collection.findOne({
      $or: [
        { licensePlate: { $regex: vehicleIdentifier, $options: 'i' } },
        { _id: ObjectId.isValid(vehicleIdentifier) ? new ObjectId(vehicleIdentifier) : null }
      ]
    });

    return vehicle ? vehicle._id : null;
  }

  /**
   * Find driver ID by phone number
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<string|null>} Driver ID or null
   */
  async findDriverId(phoneNumber) {
    // Clean phone number
    const cleanPhone = phoneNumber.replace('whatsapp:', '').replace('+', '');
    
    const collection = await db.getCollection('drivers');
    
    const driver = await collection.findOne({
      $or: [
        { contact: { $regex: cleanPhone } },
        { contact: { $regex: phoneNumber } },
        { contact: { $regex: `+${cleanPhone}` } }
      ]
    });

    return driver ? driver._id : null;
  }

  /**
   * Map expense type
   * @param {string} type - Raw type
   * @returns {string} Mapped type
   */
  mapExpenseType(type) {
    const typeMap = {
      'fuel': 'fuel',
      'maintenance': 'maintenance',
      'other': 'other'
    };
    return typeMap[type] || 'other';
  }

  /**
   * Build description from expense data
   * @param {Object} expenseData - Parsed expense data
   * @returns {string} Description
   */
  buildDescription(expenseData) {
    switch (expenseData.type) {
      case 'fuel':
        return `Fuel expense at ${expenseData.location}`;
      case 'maintenance':
        return `${expenseData.serviceType} at ${expenseData.garage}`;
      case 'other':
        return expenseData.description;
      default:
        return 'WhatsApp expense';
    }
  }

  /**
   * Handle incoming webhook from Twilio
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleWebhook(req, res) {
    try {
      const { From, Body } = req.body;
      
      console.log('Received WhatsApp message:', { From, Body });

      const command = Body.toLowerCase().trim();

      // Handle different commands
      switch (command) {
        case '/expense':
        case '/fuel':
        case '/maintenance':
        case '/other':
          await this.sendExpenseTemplate(From);
          break;
          
        case '/help':
          await this.sendHelpMessage(From);
          break;
          
        case '/vehicles':
          await this.sendVehiclesList(From);
          break;
          
        case '/drivers':
          await this.sendDriversList(From);
          break;
          
        default:
          // Try to parse as expense
          const expenseData = this.parseExpenseMessage(Body);
          
          if (expenseData) {
            try {
              const expense = await this.processExpense(expenseData, From);
              await this.sendConfirmationMessage(From, expense._id, expenseData);
            } catch (error) {
              await this.sendErrorMessage(From, error.message);
            }
          } else {
            // Send help message for invalid format
            await this.sendHelpMessage(From);
          }
          break;
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).send('Error');
    }
  }
}

module.exports = TwilioWhatsAppService;
