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
      ? vehicles.map((v, index) => `${index + 1}. ${v.licensePlate} (${v.make} ${v.model})`).join('\n')
      : '• No vehicles found';
    
    const driverList = drivers.length > 0
      ? drivers.map((d, index) => `${index + 1}. ${d.firstName} ${d.lastName}`).join('\n')
      : '• No drivers found';

    const template = `📱 *Expense Submission - Easy Mode*

*Available Vehicles:*
${vehicleList}

*Available Drivers:*
${driverList}

*Quick Commands:*
• /fuel - Submit fuel expense
• /maintenance - Submit maintenance expense  
• /other - Submit other expense
• /vehicles - Show vehicles list
• /drivers - Show drivers list
• /help - Show this menu

*Easy Format:*
/fuel
Vehicle: 1
Amount: 150.50 AED
Location: ADNOC Station
Date: 2024-01-15 (optional - defaults to today)

*Just use the number from the list above!*
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
    
    const vehicleList = vehicles.map((v, index) => `${index + 1}. ${v.licensePlate} (${v.make} ${v.model})`).join('\n');
    
    const message = `🚗 *Available Vehicles*\n\n${vehicleList}\n\n*Easy Format:*
/fuel
Vehicle: 1
Amount: 150.50 AED
Location: ADNOC Station

*Just use the number from the list above!*`;
    
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
    
    const driverList = drivers.map((d, index) => `${index + 1}. ${d.firstName} ${d.lastName}`).join('\n');
    
    const message = `👥 *Available Drivers*\n\n${driverList}\n\n*Easy Format:*
/fuel
Vehicle: 1
Amount: 150.50 AED
Location: ADNOC Station

*Just use the number from the list above!*`;
    
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

*Easy Format:*
/fuel
Vehicle: 1
Amount: 150.50 AED
Location: ADNOC Station

*Just use numbers from the vehicles list!*
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
    if (!expenseData.vehicle || !expenseData.amount) {
      return null;
    }
    
    // Set default date if not provided
    if (!expenseData.date) {
      expenseData.date = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
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
      console.log('Processing expense:', expenseData);
      
      // Find vehicle and driver
      const vehicleId = await this.findVehicleId(expenseData.vehicle);
      const driverId = await this.findDriverId(fromNumber);

      console.log('Found vehicleId:', vehicleId);
      console.log('Found driverId:', driverId);

      if (!vehicleId) {
        throw new Error('Vehicle not found. Please check the license plate or number.');
      }

      if (!driverId) {
        console.log('No driver found, using default driver');
        // Use the first driver as default
        const collection = await db.getCollection('drivers');
        const defaultDriver = await collection.findOne({}, { sort: { _id: 1 } });
        if (!defaultDriver) {
          throw new Error('No drivers found in database. Please add a driver first.');
        }
        driverId = defaultDriver._id.toString();
      }

      // Get companyId from the vehicle
      const vehicleCollection = await db.getCollection('vehicles');
      const vehicle = await vehicleCollection.findOne({ _id: new ObjectId(vehicleId) });
      const companyId = vehicle ? vehicle.companyId : '67e8291028f8bad079c0e8bb'; // Default companyId

      // Create expense record
      const expense = {
        vehicleId: vehicleId.toString(),
        driverId: driverId.toString(),
        companyId: companyId,
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

      console.log('Created expense object:', expense);

      // Validate expense data
      const validation = ExpenseModel.validate(expense);
      if (!validation.isValid) {
        console.error('Validation failed:', validation.errors);
        throw new Error(`Validation error: ${validation.errors.join(', ')}`);
      }

      console.log('Validation passed, saving to database...');

      // Save to database
      const collection = await db.getCollection('expenses');
      const result = await collection.insertOne(expense);

      console.log('Expense saved successfully:', result.insertedId);

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
   * Find vehicle ID by license plate or number
   * @param {string} vehicleIdentifier - License plate, vehicle ID, or number from list
   * @returns {Promise<string|null>} Vehicle ID or null
   */
  async findVehicleId(vehicleIdentifier) {
    const collection = await db.getCollection('vehicles');
    
    // Check if it's a number (from the numbered list)
    if (!isNaN(vehicleIdentifier)) {
      const vehicles = await collection.find({}).limit(10).toArray();
      const index = parseInt(vehicleIdentifier) - 1;
      if (index >= 0 && index < vehicles.length) {
        return vehicles[index]._id.toString();
      }
    }
    
    // Check if it's a license plate or ObjectId
    const vehicle = await collection.findOne({
      $or: [
        { licensePlate: { $regex: vehicleIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { _id: ObjectId.isValid(vehicleIdentifier) ? new ObjectId(vehicleIdentifier) : null }
      ]
    });

    return vehicle ? vehicle._id.toString() : null;
  }

  /**
   * Find driver ID by phone number
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<string|null>} Driver ID or null
   */
  async findDriverId(phoneNumber) {
    // Clean phone number - remove whatsapp: prefix and normalize
    const cleanPhone = phoneNumber.replace('whatsapp:', '').replace('+', '');
    const withPlus = `+${cleanPhone}`;
    const withoutPlus = cleanPhone;
    
    const collection = await db.getCollection('drivers');
    
    // Try multiple phone number formats
    const driver = await collection.findOne({
      $or: [
        { contact: withoutPlus },
        { contact: withPlus },
        { contact: phoneNumber },
        { contact: { $regex: withoutPlus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { contact: { $regex: withPlus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { contact: { $regex: phoneNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
      ]
    });

    if (driver) {
      return driver._id.toString();
    }

    // If no driver found, return default driver ID (first driver in database)
    console.log('No driver found for phone number, using default driver');
    const defaultDriver = await collection.findOne({}, { sort: { _id: 1 } });
    return defaultDriver ? defaultDriver._id.toString() : null;
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
          console.log('Trying to parse as expense:', Body);
          const expenseData = this.parseExpenseMessage(Body);
          console.log('Parsed expense data:', expenseData);
          
          if (expenseData) {
            try {
              console.log('Processing expense...');
              const expense = await this.processExpense(expenseData, From);
              console.log('Expense processed successfully, sending confirmation...');
              await this.sendConfirmationMessage(From, expense._id, expenseData);
            } catch (error) {
              console.error('Error processing expense:', error);
              await this.sendErrorMessage(From, error.message);
            }
          } else {
            console.log('Could not parse as expense, sending help message');
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
