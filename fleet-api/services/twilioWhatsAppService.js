const twilio = require('twilio');
const ExpenseModel = require('../models/expenseModel');
const { ObjectId } = require('mongodb');
const db = require('../config/db');

class TwilioWhatsAppService {
  constructor() {
    // Get Twilio credentials from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    // Test mode - set to true to prevent sending real WhatsApp messages
    this.testMode = process.env.WHATSAPP_TEST_MODE === 'true' || !accountSid || !authToken || !whatsappNumber;
    
    console.log('🔧 Configuration check:');
    console.log('  - WHATSAPP_TEST_MODE:', process.env.WHATSAPP_TEST_MODE);
    console.log('  - TWILIO_ACCOUNT_SID:', accountSid ? 'SET' : 'NOT SET');
    console.log('  - TWILIO_AUTH_TOKEN:', authToken ? 'SET' : 'NOT SET');
    console.log('  - TWILIO_WHATSAPP_NUMBER:', whatsappNumber ? 'SET' : 'NOT SET');
    console.log('  - Test Mode:', this.testMode);

    if (!accountSid || !authToken || !whatsappNumber) {
      console.warn('⚠️  Twilio environment variables not set. Running in TEST MODE.');
      console.warn('Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in your .env file');
      this.client = null;
      this.fromNumber = null;
      this.isConfigured = false;
    } else {
      this.client = twilio(accountSid, authToken);
      this.fromNumber = whatsappNumber;
      this.isConfigured = true;
    }

    if (this.testMode) {
      console.log('🧪 TEST MODE: WhatsApp messages will be logged but not sent');
    }
  }

  /**
   * Send a WhatsApp message
   * @param {string} to - Recipient number (e.g., 'whatsapp:+1234567890')
   * @param {string} message - Message content
   * @returns {Promise<Object>} Twilio message response
   */
  async sendMessage(to, message) {
    try {
      // Ensure proper phone number format
      if (to && !to.startsWith('whatsapp:+')) {
        to = to.replace('whatsapp:', 'whatsapp:+').replace('whatsapp: ', 'whatsapp:+');
      }
      
      if (this.testMode || !this.isConfigured) {
        console.log('📱 [TEST MODE] WhatsApp message would be sent to:', to);
        console.log('📱 [TEST MODE] Message:');
        console.log('─'.repeat(50));
        console.log(message);
        console.log('─'.repeat(50));
        console.log('✅ [TEST MODE] Message processed successfully');
        return { sid: 'test-message-id', status: 'sent' };
      }

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
Description: ADNOC Station

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
    const helpMessage = `📱 *Fleet Management Help*

*Submit Expenses:*
• /fuel - Submit fuel expense
• /maintenance - Submit maintenance expense  
• /other - Submit other expense

*View Expenses:*
• /expenses - Show current month expenses
• /expenses-all - Show all your expenses
• /monthly - Show current month expenses
• /yearly - Show current year expenses
• /expenses-jan - Show January expenses
• /expenses-2024-01 - Show specific month/year

*Payment Tracking:*
• /payments - Show all payments for current month
• /payments [contract] [amount] [description] - Record payment received
• /invoice [invoice_number] - Show invoice details and payment status

*Other Commands:*
• /vehicles - Show available vehicles
• /drivers - Show available drivers
• /help - Show this help message

*Simple Format:*
/fuel
Vehicle: ABC-123
Amount: 150.50 AED
Location: ADNOC Station

*Payment Format:*
/payments CONTRACT001 5000 Monthly service payment
/payments INV-001 2500 Equipment maintenance

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
    console.log('Split lines:', lines);

    // Check if message starts with expense command
    const firstLine = lines[0].toLowerCase();
    console.log('First line:', firstLine);
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

    console.log('Detected expense type:', expenseType);

    if (!expenseType || !['fuel', 'maintenance', 'other'].includes(expenseType)) {
      console.log('Invalid expense type, returning null');
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
    console.log('Expense data before validation:', expenseData);
    if (!expenseData.vehicle || !expenseData.amount) {
      console.log('Missing required fields - vehicle:', !!expenseData.vehicle, 'amount:', !!expenseData.amount);
      return null;
    }

    // Set default date if not provided
    if (!expenseData.date) {
      expenseData.date = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
      console.log('Set default date:', expenseData.date);
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
      console.log('Looking for vehicle:', expenseData.vehicle);
      const vehicleId = await this.findVehicleId(expenseData.vehicle);
      console.log('Found vehicle ID:', vehicleId);

      console.log('Looking for driver:', fromNumber);
      // Set driver ID as "1" instead of looking it up
      const driverId = "1";
      console.log('Using driver ID:', driverId);

      // If no vehicle found, create a default vehicle
      let finalVehicleId = vehicleId;
      if (!finalVehicleId) {
        finalVehicleId = await this.createDefaultVehicle(expenseData.vehicle);
      }

      // Use the fixed driver ID
      const finalDriverId = driverId;

      // Create expense record
      const expense = {
        vehicleId: finalVehicleId.toString(), // Convert to string
        driverId: finalDriverId.toString(), // Convert to string
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
        companyId: '67e8291028f8bad079c0e8bb',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate expense data
      const validation = ExpenseModel.validate(expense);
      if (!validation.isValid) {
        throw new Error(`Validation error: ${validation.errors.join(', ')}`);
      }

      // Save to database using ExpenseModel
      const collection = await ExpenseModel.getCollection();
      const preparedExpense = ExpenseModel.prepareData(expense);
      const result = await collection.insertOne(preparedExpense);

      console.log('✅ Expense saved successfully:', result.insertedId);

      return {
        _id: result.insertedId,
        ...preparedExpense
      };
    } catch (error) {
      console.error('Error processing expense:', error);
      throw error;
    }
  }

  /**
   * Find vehicle ID by license plate or vehicle number
   * @param {string} vehicleIdentifier - License plate, vehicle ID, or vehicle number
   * @returns {Promise<string|null>} Vehicle ID or null
   */
  async findVehicleId(vehicleIdentifier) {
    console.log('🔍 Looking for vehicle with identifier:', vehicleIdentifier);
    const collection = await db.getCollection('vehicles');

    // Escape special regex characters in the identifier
    const escapedIdentifier = vehicleIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Try different matching strategies
    const vehicle = await collection.findOne({
      $or: [
        { licensePlate: { $regex: escapedIdentifier, $options: 'i' } },
        { _id: ObjectId.isValid(vehicleIdentifier) ? new ObjectId(vehicleIdentifier) : null },
        // Handle numeric IDs (convert to string and match)
        { _id: ObjectId.isValid(vehicleIdentifier.toString()) ? new ObjectId(vehicleIdentifier.toString()) : null },
        // Handle numeric vehicle references (like "1", "2", "3")
        { vehicleNumber: parseInt(vehicleIdentifier) },
        { vehicleNumber: vehicleIdentifier }
      ]
    });

    console.log('🚗 Direct vehicle match found:', vehicle ? vehicle._id.toString() : 'None');

    // If no vehicle found and identifier is numeric, try to get vehicle by index
    if (!vehicle && !isNaN(vehicleIdentifier)) {
      console.log('📊 Trying index-based lookup for numeric identifier:', vehicleIdentifier);
      const vehicles = await collection.find({}).sort({ createdAt: 1 }).toArray();
      console.log('📋 Total vehicles found:', vehicles.length);
      console.log('📋 Vehicle list:', vehicles.map((v, index) => ({ 
        index: index + 1, 
        id: v._id.toString(), 
        licensePlate: v.licensePlate, 
        createdAt: v.createdAt 
      })));
      
      const vehicleIndex = parseInt(vehicleIdentifier) - 1; // Convert to 0-based index
      console.log('🎯 Looking for vehicle at index:', vehicleIndex, '(1-based input:', vehicleIdentifier, ')');
      
      if (vehicleIndex >= 0 && vehicleIndex < vehicles.length) {
        const selectedVehicle = vehicles[vehicleIndex];
        console.log('✅ Selected vehicle:', selectedVehicle._id.toString(), selectedVehicle.licensePlate);
        return selectedVehicle._id.toString();
      } else {
        console.log('❌ Vehicle index out of range:', vehicleIndex, 'Total vehicles:', vehicles.length);
      }
    }

    const result = vehicle ? vehicle._id.toString() : null;
    console.log('🔍 Final vehicle ID result:', result);
    return result;
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

    // Escape special regex characters
    const escapedCleanPhone = cleanPhone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedPhoneNumber = phoneNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedPhoneWithPlus = `+${cleanPhone}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const driver = await collection.findOne({
      $or: [
        { contact: { $regex: escapedCleanPhone } },
        { contact: { $regex: escapedPhoneNumber } },
        { contact: { $regex: escapedPhoneWithPlus } }
      ]
    });

    return driver ? driver._id : null;
  }

  /**
   * Create a default driver for a phone number
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<string>} Driver ID
   */
  async createDefaultDriver(phoneNumber) {
    const collection = await db.getCollection('drivers');

    const cleanPhone = phoneNumber.replace('whatsapp:', '');

    const defaultDriver = {
      name: `Driver ${cleanPhone}`,
      contact: cleanPhone,
      licenseNumber: 'N/A',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(defaultDriver);
    console.log('Created default driver for:', cleanPhone);

    return result.insertedId.toString();
  }

  /**
   * Create a default vehicle for a vehicle identifier
   * @param {string} vehicleIdentifier - Vehicle identifier
   * @returns {Promise<string>} Vehicle ID
   */
  async createDefaultVehicle(vehicleIdentifier) {
    const collection = await db.getCollection('vehicles');

    const defaultVehicle = {
      licensePlate: vehicleIdentifier,
      make: 'Unknown',
      model: 'Unknown',
      year: new Date().getFullYear(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(defaultVehicle);
    console.log('Created default vehicle for:', vehicleIdentifier);

    return result.insertedId.toString();
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
        return `${expenseData.location}`;
      case 'maintenance':
        return `${expenseData.serviceType} at ${expenseData.garage}`;
      case 'other':
        return expenseData.description;
      default:
        return 'WhatsApp expense';
    }
  }

  /**
   * Send expenses list for a specific WhatsApp number (shows current month by default)
   * @param {string} to - Recipient number
   */
  async sendExpensesList(to) {
    try {
      // Get current month expenses by default
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const expenses = await this.getExpensesForWhatsAppNumber(to, startOfMonth, endOfMonth);
      
      const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (expenses.length === 0) {
        await this.sendMessage(to, `📅 *${monthName} Expenses*\n\nNo expenses found for this month.`);
        return;
      }

      const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const statusCounts = expenses.reduce((acc, expense) => {
        acc[expense.status] = (acc[expense.status] || 0) + 1;
        return acc;
      }, {});

      let message = `📅 *${monthName} Expenses*\n\n`;
      message += `💰 *Total Amount:* ${totalAmount.toFixed(2)} AED\n`;
      message += `📋 *Total Expenses:* ${expenses.length}\n\n`;

      message += `*Expenses:*\n`;
      expenses.slice(0, 10).forEach((expense, index) => {
        const date = new Date(expense.date).toLocaleDateString();
        message += `${index + 1}. ${expense.expenseType.toUpperCase()}\n`;
        message += `   💰 ${expense.amount} AED - ${date}\n`;
        message += `   🚗 ${expense.vehicle || 'N/A'}\n\n`;
      });

      if (expenses.length > 10) {
        message += `... and ${expenses.length - 10} more expenses\n\n`;
      }

      message += `*More Commands:*\n`;
      message += `• /monthly - Current month (same as /expenses)\n`;
      message += `• /yearly - Current year\n`;
      message += `• /expenses-jan - Specific month\n`;
      message += `• /expenses-all - All expenses`;

      await this.sendMessage(to, message);
    } catch (error) {
      console.error('Error sending expenses list:', error);
      await this.sendErrorMessage(to, 'Failed to retrieve expenses');
    }
  }

  /**
   * Send all expenses for a specific WhatsApp number
   * @param {string} to - Recipient number
   */
  async sendAllExpenses(to) {
    try {
      const expenses = await this.getExpensesForWhatsAppNumber(to);
      
      if (expenses.length === 0) {
        await this.sendMessage(to, '📊 *All Your Expenses*\n\nNo expenses found.');
        return;
      }

      const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const recentExpenses = expenses.slice(0, 10); // Show last 10 expenses

      let message = `📊 *All Your Expenses Summary*\n\n`;
      message += `💰 *Total Amount:* ${totalAmount.toFixed(2)} AED\n`;
      message += `📋 *Total Expenses:* ${expenses.length}\n\n`;
      message += `*Recent Expenses:*\n`;

      recentExpenses.forEach((expense, index) => {
        const date = new Date(expense.date).toLocaleDateString();
        const status = expense.status === 'approved' ? '✅' : expense.status === 'rejected' ? '❌' : '⏳';
        message += `${index + 1}. ${status} ${expense.expenseType.toUpperCase()}\n`;
        message += `   💰 ${expense.amount} AED - ${date}\n`;
        message += `   🚗 ${expense.vehicle || 'N/A'}\n\n`;
      });

      if (expenses.length > 10) {
        message += `... and ${expenses.length - 10} more expenses\n\n`;
      }

      message += `*Commands:*\n`;
      message += `• /expenses - Current month\n`;
      message += `• /monthly - Current month\n`;
      message += `• /yearly - Current year\n`;
      message += `• /expenses-jan - Specific month`;

      await this.sendMessage(to, message);
    } catch (error) {
      console.error('Error sending all expenses:', error);
      await this.sendErrorMessage(to, 'Failed to retrieve all expenses');
    }
  }

  /**
   * Send monthly expenses for current month
   * @param {string} to - Recipient number
   */
  async sendMonthlyExpenses(to) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const expenses = await this.getExpensesForWhatsAppNumber(to, startOfMonth, endOfMonth);
      
      const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (expenses.length === 0) {
        await this.sendMessage(to, `📅 *${monthName} Expenses*\n\nNo expenses found for this month.`);
        return;
      }

      const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const statusCounts = expenses.reduce((acc, expense) => {
        acc[expense.status] = (acc[expense.status] || 0) + 1;
        return acc;
      }, {});

      let message = `📅 *${monthName} Expenses*\n\n`;
      message += `💰 *Total Amount:* ${totalAmount.toFixed(2)} AED\n`;
      message += `📋 *Total Expenses:* ${expenses.length}\n\n`;
      message += `*Status Breakdown:*\n`;
      message += `✅ Approved: ${statusCounts.approved || 0}\n`;
      message += `⏳ Pending: ${statusCounts.pending || 0}\n`;
      message += `❌ Rejected: ${statusCounts.rejected || 0}\n\n`;

      message += `*Expenses:*\n`;
      expenses.slice(0, 10).forEach((expense, index) => {
        const date = new Date(expense.date).toLocaleDateString();
        const status = expense.status === 'approved' ? '✅' : expense.status === 'rejected' ? '❌' : '⏳';
        message += `${index + 1}. ${status} ${expense.expenseType.toUpperCase()}\n`;
        message += `   💰 ${expense.amount} AED - ${date}\n`;
        message += `   🚗 ${expense.vehicle || 'N/A'}\n`;
        if (expense.description) {
          message += `   📝 ${expense.description}\n`;
        }
        message += `\n`;
      });

      if (expenses.length > 10) {
        message += `... and ${expenses.length - 10} more expenses`;
      }

      await this.sendMessage(to, message);
    } catch (error) {
      console.error('Error sending monthly expenses:', error);
      await this.sendErrorMessage(to, 'Failed to retrieve monthly expenses');
    }
  }

  /**
   * Send yearly expenses for current year
   * @param {string} to - Recipient number
   */
  async sendYearlyExpenses(to) {
    try {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

      const expenses = await this.getExpensesForWhatsAppNumber(to, startOfYear, endOfYear);
      
      const year = now.getFullYear();
      
      if (expenses.length === 0) {
        await this.sendMessage(to, `📅 *${year} Expenses*\n\nNo expenses found for this year.`);
        return;
      }

      const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Group by month
      const monthlyTotals = {};
      expenses.forEach(expense => {
        const month = new Date(expense.date).toLocaleDateString('en-US', { month: 'short' });
        monthlyTotals[month] = (monthlyTotals[month] || 0) + expense.amount;
      });

      let message = `📅 *${year} Expenses Summary*\n\n`;
      message += `💰 *Total Amount:* ${totalAmount.toFixed(2)} AED\n`;
      message += `📋 *Total Expenses:* ${expenses.length}\n\n`;
      message += `*Monthly Breakdown:*\n`;

      Object.entries(monthlyTotals)
        .sort((a, b) => new Date(`2024-${a[0]}-01`) - new Date(`2024-${b[0]}-01`))
        .forEach(([month, amount]) => {
          message += `• ${month}: ${amount.toFixed(2)} AED\n`;
        });

      message += `\n*Top Expense Types:*\n`;
      const typeTotals = {};
      expenses.forEach(expense => {
        typeTotals[expense.expenseType] = (typeTotals[expense.expenseType] || 0) + expense.amount;
      });

      Object.entries(typeTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([type, amount]) => {
          message += `• ${type.toUpperCase()}: ${amount.toFixed(2)} AED\n`;
        });

      await this.sendMessage(to, message);
    } catch (error) {
      console.error('Error sending yearly expenses:', error);
      await this.sendErrorMessage(to, 'Failed to retrieve yearly expenses');
    }
  }

  /**
   * Send expenses for a specific month
   * @param {string} to - Recipient number
   * @param {string} monthParam - Month parameter (e.g., 'jan', '2024-01')
   */
  async sendExpensesForMonth(to, monthParam) {
    try {
      let startDate, endDate, monthName;
      
      // Parse month parameter
      if (monthParam.match(/^\d{4}-\d{2}$/)) {
        // Format: 2024-01
        const [year, month] = monthParam.split('-');
        startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else {
        // Format: jan, feb, etc.
        const monthNames = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
          'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        
        const monthIndex = monthNames[monthParam.toLowerCase()];
        if (monthIndex === undefined) {
          await this.sendMessage(to, `❌ Invalid month format. Use: jan, feb, mar, etc. or 2024-01, 2024-02, etc.`);
          return;
        }
        
        const now = new Date();
        startDate = new Date(now.getFullYear(), monthIndex, 1);
        endDate = new Date(now.getFullYear(), monthIndex + 1, 0, 23, 59, 59);
        monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }

      const expenses = await this.getExpensesForWhatsAppNumber(to, startDate, endDate);
      
      if (expenses.length === 0) {
        await this.sendMessage(to, `📅 *${monthName} Expenses*\n\nNo expenses found for this month.`);
        return;
      }

      const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      let message = `📅 *${monthName} Expenses*\n\n`;
      message += `💰 *Total Amount:* ${totalAmount.toFixed(2)} AED\n`;
      message += `📋 *Total Expenses:* ${expenses.length}\n\n`;

      message += `*Expenses:*\n`;
      expenses.forEach((expense, index) => {
        const date = new Date(expense.date).toLocaleDateString();
        const status = expense.status === 'approved' ? '✅' : expense.status === 'rejected' ? '❌' : '⏳';
        message += `${index + 1}. ${status} ${expense.expenseType.toUpperCase()}\n`;
        message += `   💰 ${expense.amount} AED - ${date}\n`;
        message += `   🚗 ${expense.vehicle || 'N/A'}\n\n`;
      });

      await this.sendMessage(to, message);
    } catch (error) {
      console.error('Error sending expenses for month:', error);
      await this.sendErrorMessage(to, 'Failed to retrieve expenses for the specified month');
    }
  }

  /**
   * Get expenses for a specific WhatsApp number with optional date range
   * @param {string} whatsappNumber - WhatsApp number
   * @param {Date} startDate - Start date (optional)
   * @param {Date} endDate - End date (optional)
   * @returns {Promise<Array>} Array of expenses
   */
  async getExpensesForWhatsAppNumber(whatsappNumber, startDate = null, endDate = null) {
    try {
      const collection = await db.getCollection('expenses');
      
      const query = {
        whatsappNumber: whatsappNumber,
        source: 'whatsapp_twilio'
      };

      // Add date range if provided
      if (startDate && endDate) {
        query.date = {
          $gte: startDate,
          $lte: endDate
        };
      }

      const expenses = await collection
        .find(query)
        .sort({ date: -1 })
        .toArray();

      // Populate vehicle information
      const populatedExpenses = await Promise.all(
        expenses.map(async (expense) => {
          let vehicleInfo = 'Unknown Vehicle';
          if (expense.vehicleId) {
            try {
              console.log('🔍 Looking up vehicle for expense:', expense._id);
              console.log('🔍 VehicleId:', expense.vehicleId, 'Type:', typeof expense.vehicleId);
              
              // Convert string to ObjectId if needed
              let vehicleId;
              if (typeof expense.vehicleId === 'string') {
                if (ObjectId.isValid(expense.vehicleId)) {
                  vehicleId = new ObjectId(expense.vehicleId);
                } else {
                  console.log('❌ Invalid ObjectId string:', expense.vehicleId);
                  return { ...expense, vehicle: 'Invalid Vehicle ID' };
                }
              } else {
                vehicleId = expense.vehicleId;
              }
              
              const vehiclesCollection = await db.getCollection('vehicles');
              const vehicle = await vehiclesCollection.findOne({ _id: vehicleId });
              console.log('🚗 Found vehicle:', vehicle);
              
              if (vehicle) {
                vehicleInfo = vehicle.licensePlate || `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Unknown Vehicle';
                console.log('✅ Vehicle info:', vehicleInfo);
              } else {
                console.log('❌ No vehicle found with ID:', vehicleId);
              }
            } catch (error) {
              console.error('❌ Error fetching vehicle:', error);
              console.error('VehicleId:', expense.vehicleId, 'Type:', typeof expense.vehicleId);
            }
          } else {
            console.log('❌ No vehicleId in expense:', expense._id);
          }

          return {
            ...expense,
            vehicle: vehicleInfo
          };
        })
      );

      return populatedExpenses;
    } catch (error) {
      console.error('Error getting expenses for WhatsApp number:', error);
      return [];
    }
  }

  /**
   * Test expense retrieval without sending WhatsApp messages
   * @param {string} whatsappNumber - WhatsApp number to test
   * @param {string} command - Command to test
   */
  async testExpenseRetrieval(whatsappNumber, command = '/expenses') {
    console.log(`🧪 Testing expense retrieval for ${whatsappNumber} with command: ${command}`);
    
    try {
      switch (command.toLowerCase()) {
        case '/expenses':
          await this.sendExpensesList(whatsappNumber);
          break;
        case '/expenses-all':
          await this.sendAllExpenses(whatsappNumber);
          break;
        case '/monthly':
          await this.sendMonthlyExpenses(whatsappNumber);
          break;
        case '/yearly':
          await this.sendYearlyExpenses(whatsappNumber);
          break;
        default:
          if (command.startsWith('/expenses-')) {
            const monthParam = command.replace('/expenses-', '');
            await this.sendExpensesForMonth(whatsappNumber, monthParam);
          } else {
            await this.sendHelpMessage(whatsappNumber);
          }
          break;
      }
    } catch (error) {
      console.error('❌ Error in test expense retrieval:', error);
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

      // Check if this is a multi-line expense message (contains \n)
      if (Body.includes('\n')) {
        // Try to parse as expense
        console.log('Attempting to parse multi-line message:', Body);
        const expenseData = this.parseExpenseMessage(Body);
        console.log('Parsed expense data:', expenseData);

        if (expenseData) {
          try {
            console.log('Processing expense data:', expenseData);
            const expense = await this.processExpense(expenseData, From);
            await this.sendConfirmationMessage(From, expense._id, expenseData);
          } catch (error) {
            console.error('Error processing expense:', error);
            await this.sendErrorMessage(From, error.message);
          }
        } else {
          console.log('Failed to parse expense message, sending help');
          // Send help message for invalid format
          await this.sendHelpMessage(From);
        }
      } else {
        // Handle single-line commands
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

          case '/expenses':
            await this.sendExpensesList(From);
            break;

          case '/expenses-all':
            await this.sendAllExpenses(From);
            break;

          case '/monthly':
            await this.sendMonthlyExpenses(From);
            break;

          case '/yearly':
            await this.sendYearlyExpenses(From);
            break;

          case '/payments':
            // Handle payment commands
            if (Body.trim() === '/payments') {
              // Show monthly payments summary
              await this.sendMonthlyPaymentSummary(From);
            } else {
              // Handle payment received command
              const paymentData = this.parsePaymentMessage(Body);
              if (paymentData) {
                const paymentRecord = await this.savePaymentRecord(paymentData, From);
                if (paymentRecord) {
                  const confirmationMessage = this.generatePaymentConfirmationMessage(paymentRecord);
                  await this.sendMessage(From, confirmationMessage);
                }
              } else {
                await this.sendMessage(From, '❌ Invalid payment format. Please use: /payments [contract_number] [amount] [description] or just /payments for monthly summary');
              }
            }
            break;

          case '/invoice':
            // Handle invoice details command
            const invoiceNumber = Body.replace('/invoice', '').trim();
            if (invoiceNumber) {
              await this.sendInvoiceDetails(From, invoiceNumber);
            } else {
              await this.sendMessage(From, '❌ Please provide invoice number. Use: /invoice [invoice_number]');
            }
            break;

          default:
            // Check if it's a month-specific command (e.g., /expenses-jan, /expenses-2024-01)
            if (command.startsWith('/expenses-')) {
              const monthParam = command.replace('/expenses-', '');
              await this.sendExpensesForMonth(From, monthParam);
            } else {
              // Send help message for unknown commands
              await this.sendHelpMessage(From);
            }
            break;
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).send('Error');
    }
  }

  /**
   * Process received payment webhook
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processReceivedPayment(req, res) {
    try {
      const { From, Body } = req.body;
      
      if (!From || !Body) {
        console.log('Missing From or Body in received payment webhook');
        return res.status(400).send('Missing required fields');
      }

      console.log(`💰 Payment received from ${From}: ${Body}`);

      // Parse the payment message
      const paymentData = this.parsePaymentMessage(Body);
      
      if (!paymentData) {
        await this.sendMessage(From, '❌ Invalid payment format. Please use: /received [contract_number] [amount] [description]');
        return res.status(200).send('OK');
      }

      // Save payment record
      const paymentRecord = await this.savePaymentRecord(paymentData, From);
      
      if (paymentRecord) {
        // Send confirmation message
        const confirmationMessage = this.generatePaymentConfirmationMessage(paymentRecord);
        await this.sendMessage(From, confirmationMessage);
        
        // Send monthly payment summary if requested
        if (paymentData.requestSummary) {
          await this.sendMonthlyPaymentSummary(From);
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Error processing received payment:', error);
      res.status(500).send('Error');
    }
  }

  /**
   * Parse payment message to extract payment details
   * @param {string} message - Payment message
   * @returns {Object|null} Parsed payment data or null if invalid
   */
  parsePaymentMessage(message) {
    try {
      // Expected format: /payments [contract_number] [amount] [description] [optional: /summary]
      const parts = message.trim().split(' ');
      
      if (parts.length < 4 || parts[0] !== '/payments') {
        return null;
      }

      const contractNumber = parts[1];
      const amount = parseFloat(parts[2]);
      const description = parts.slice(3).join(' ').trim();

      if (isNaN(amount) || amount <= 0) {
        return null;
      }

      return {
        contractNumber,
        amount,
        description,
        paymentDate: new Date()
      };
    } catch (error) {
      console.error('Error parsing payment message:', error);
      return null;
    }
  }

  /**
   * Save payment record to invoice database
   * @param {Object} paymentData - Payment data
   * @param {string} whatsappNumber - WhatsApp number
   * @returns {Object|null} Saved payment record
   */
  async savePaymentRecord(paymentData, whatsappNumber) {
    try {
      const collection = await db.getCollection('invoices');
      
      // Find invoice by contract number or invoice number
      const invoice = await collection.findOne({
        $or: [
          { invoiceNumber: paymentData.contractNumber },
          { 'contract.contractNumber': paymentData.contractNumber }
        ]
      });

      if (!invoice) {
        console.log(`❌ Invoice not found for contract: ${paymentData.contractNumber}`);
        return null;
      }

      // Create payment record
      const paymentRecord = {
        amount: paymentData.amount,
        paymentMethod: 'bank_transfer', // Default method
        transactionId: `WHATSAPP_${Date.now()}`,
        notes: paymentData.description,
        date: paymentData.paymentDate,
        whatsappNumber: whatsappNumber,
        source: 'whatsapp_twilio'
      };

      // Add payment to invoice
      if (!invoice.payments) {
        invoice.payments = [];
      }
      invoice.payments.push(paymentRecord);
      
      // Calculate total paid amount
      const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Update invoice status based on payment
      if (totalPaid >= invoice.total) {
        invoice.status = 'paid';
      } else if (totalPaid > 0) {
        invoice.status = 'sent'; // Partially paid
      }

      await collection.updateOne(
        { _id: invoice._id },
        { 
          $set: { 
            payments: invoice.payments,
            status: invoice.status,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Payment record saved to invoice: ${invoice._id}`);
      return { 
        ...paymentRecord, 
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.total,
        totalPaid: totalPaid,
        remainingAmount: invoice.total - totalPaid
      };
    } catch (error) {
      console.error('Error saving payment record:', error);
      return null;
    }
  }

  /**
   * Generate payment confirmation message
   * @param {Object} paymentRecord - Payment record
   * @returns {string} Confirmation message
   */
  generatePaymentConfirmationMessage(paymentRecord) {
    const date = paymentRecord.date.toLocaleDateString();
    const time = paymentRecord.date.toLocaleTimeString();
    
    return `✅ *Payment Received Successfully!*

📋 *Invoice Details:*
• Invoice: ${paymentRecord.invoiceNumber}
• Contract: ${paymentRecord.contractNumber}
• Payment Amount: ${paymentRecord.amount} AED
• Description: ${paymentRecord.notes}
• Date: ${date} at ${time}

💰 *Payment Summary:*
• Total Invoice Amount: ${paymentRecord.totalAmount} AED
• Total Paid: ${paymentRecord.totalPaid} AED
• Remaining Amount: ${paymentRecord.remainingAmount} AED

🆔 *Invoice ID:* ${paymentRecord._id}
📝 *Transaction ID:* ${paymentRecord.transactionId}

Your payment has been recorded and applied to the invoice.`;
  }

  /**
   * Send monthly payment summary from invoices
   * @param {string} to - Recipient number
   */
  async sendMonthlyPaymentSummary(to) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const collection = await db.getCollection('invoices');
      
      // Get all invoices with payments in current month
      const invoices = await collection.find({
        'payments': {
          $elemMatch: {
            date: {
              $gte: startOfMonth,
              $lte: endOfMonth
            }
          }
        }
      }).sort({ updatedAt: -1 }).toArray();

      const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (invoices.length === 0) {
        // If no payments this month, show all invoices for context
        const allInvoices = await collection.find({})
          .sort({ updatedAt: -1 })
          .limit(10)
          .toArray();

        if (allInvoices.length === 0) {
          await this.sendMessage(to, `📅 *${monthName} Payments*\n\nNo invoices found in the system.`);
          return;
        }

        let message = `📅 *${monthName} Payments*\n\n`;
        message += `No payments received this month.\n\n`;
        message += `*Recent Invoices:*\n`;
        
        allInvoices.forEach((invoice, index) => {
          const totalPaid = invoice.payments ? invoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
          const remaining = invoice.total - totalPaid;
          const status = remaining <= 0 ? '✅ PAID' : remaining < invoice.total ? '⏳ PARTIAL' : '❌ PENDING';
          
          message += `${index + 1}. ${status} ${invoice.invoiceNumber}\n`;
          message += `   📋 Contract: ${invoice.contractId?.contractNumber || 'N/A'}\n`;
          message += `   💰 Total: ${invoice.total.toFixed(2)} AED\n`;
          message += `   💳 Paid: ${totalPaid.toFixed(2)} AED\n`;
          if (remaining > 0) {
            message += `   ⏳ Remaining: ${remaining.toFixed(2)} AED\n`;
          }
          message += `\n`;
        });

        await this.sendMessage(to, message);
        return;
      }

      // Extract all payments from invoices for current month
      const allPayments = [];
      const paidInvoices = [];
      const pendingInvoices = [];

      invoices.forEach(invoice => {
        const invoicePayments = invoice.payments.filter(payment => 
          payment.date >= startOfMonth && payment.date <= endOfMonth
        );

        if (invoicePayments.length > 0) {
          invoicePayments.forEach(payment => {
            allPayments.push({
              ...payment,
              invoiceNumber: invoice.invoiceNumber,
              contractNumber: invoice.contractId?.contractNumber || 'N/A',
              totalAmount: invoice.total,
              invoiceStatus: invoice.status
            });
          });

          // Calculate totals for this invoice
          const totalPaid = invoice.payments ? invoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
          const remaining = invoice.total - totalPaid;

          if (remaining <= 0) {
            paidInvoices.push({
              invoiceNumber: invoice.invoiceNumber,
              contractNumber: invoice.contractId?.contractNumber || 'N/A',
              totalAmount: invoice.total,
              totalPaid: totalPaid,
              status: 'PAID'
            });
          } else {
            pendingInvoices.push({
              invoiceNumber: invoice.invoiceNumber,
              contractNumber: invoice.contractId?.contractNumber || 'N/A',
              totalAmount: invoice.total,
              totalPaid: totalPaid,
              remaining: remaining,
              status: 'PARTIAL'
            });
          }
        }
      });

      // Sort payments by date descending
      allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

      const totalAmount = allPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalPaidAmount = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.remaining, 0);
      
      let message = `📅 *${monthName} Payment Summary*\n\n`;
      message += `💰 *Total Received:* ${totalAmount.toFixed(2)} AED\n`;
      message += `📋 *Total Payments:* ${allPayments.length}\n`;
      message += `📄 *Invoices with Payments:* ${invoices.length}\n\n`;

      message += `✅ *Fully Paid Invoices:* ${paidInvoices.length}\n`;
      message += `💰 *Total Paid Amount:* ${totalPaidAmount.toFixed(2)} AED\n\n`;

      message += `⏳ *Partially Paid Invoices:* ${pendingInvoices.length}\n`;
      message += `💰 *Remaining Amount:* ${totalPendingAmount.toFixed(2)} AED\n\n`;
      
      message += `*Recent Payments:*\n`;
      allPayments.slice(0, 10).forEach((payment, index) => {
        const date = new Date(payment.date).toLocaleDateString();
        const source = payment.source === 'whatsapp_twilio' ? '📱' : '💳';
        const status = payment.invoiceStatus === 'paid' ? '✅' : '⏳';
        message += `${index + 1}. ${source} ${status} ${payment.amount} AED\n`;
        message += `   📄 Invoice: ${payment.invoiceNumber}\n`;
        message += `   📋 Contract: ${payment.contractNumber}\n`;
        if (payment.notes) {
          message += `   📝 ${payment.notes}\n`;
        }
        message += `   📅 ${date}\n\n`;
      });

      if (allPayments.length > 10) {
        message += `... and ${allPayments.length - 10} more payments`;
      }

      await this.sendMessage(to, message);
    } catch (error) {
      console.error('Error sending monthly payment summary:', error);
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
      await this.sendMessage(to, `❌ Error retrieving payment summary: ${error.message}`);
    }
  }

  /**
   * Send invoice details and payment status
   * @param {string} to - Recipient number
   * @param {string} invoiceNumber - Invoice number
   */
  async sendInvoiceDetails(to, invoiceNumber) {
    try {
      const collection = await db.getCollection('invoices');
      
      const invoice = await collection.findOne({ invoiceNumber });

      if (!invoice) {
        await this.sendMessage(to, `❌ Invoice not found: ${invoiceNumber}`);
        return;
      }

      // Calculate payment totals
      const totalPaid = invoice.payments ? invoice.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
      const remainingAmount = invoice.total - totalPaid;
      const paymentCount = invoice.payments ? invoice.payments.length : 0;

      // Get WhatsApp payments
      const whatsappPayments = invoice.payments ? invoice.payments.filter(payment => 
        payment.source === 'whatsapp_twilio'
      ) : [];

      let message = `📄 *Invoice Details*\n\n`;
      message += `🆔 *Invoice Number:* ${invoice.invoiceNumber}\n`;
      message += `📋 *Contract:* ${invoice.contractId?.contractNumber || 'N/A'}\n`;
      message += `📅 *Issue Date:* ${invoice.issueDate.toLocaleDateString()}\n`;
      message += `📅 *Due Date:* ${invoice.dueDate.toLocaleDateString()}\n`;
      message += `📊 *Status:* ${invoice.status.toUpperCase()}\n\n`;

      message += `💰 *Amount Details:*\n`;
      message += `• Subtotal: ${invoice.subtotal.toFixed(2)} AED\n`;
      message += `• Tax: ${invoice.tax.toFixed(2)} AED\n`;
      message += `• Total: ${invoice.total.toFixed(2)} AED\n`;
      message += `• Paid: ${totalPaid.toFixed(2)} AED\n`;
      message += `• Remaining: ${remainingAmount.toFixed(2)} AED\n\n`;

      message += `📋 *Payment Summary:*\n`;
      message += `• Total Payments: ${paymentCount}\n`;
      message += `• WhatsApp Payments: ${whatsappPayments.length}\n\n`;

      if (invoice.payments && invoice.payments.length > 0) {
        message += `*Recent Payments:*\n`;
        invoice.payments.slice(-5).forEach((payment, index) => {
          const date = new Date(payment.date).toLocaleDateString();
          const source = payment.source === 'whatsapp_twilio' ? '📱' : '💳';
          message += `${index + 1}. ${source} ${payment.amount} AED\n`;
          message += `   📅 ${date}\n`;
          if (payment.notes) {
            message += `   📝 ${payment.notes}\n`;
          }
          message += `\n`;
        });
      }

      if (invoice.notes) {
        message += `📝 *Notes:* ${invoice.notes}\n`;
      }

      await this.sendMessage(to, message);
    } catch (error) {
      console.error('Error sending invoice details:', error);
      await this.sendMessage(to, '❌ Error retrieving invoice details');
    }
  }

}

module.exports = TwilioWhatsAppService;
