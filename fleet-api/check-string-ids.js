const db = require('./config/db');

async function checkStringIds() {
  try {
    await db.connectToDatabase();
    console.log('Connected to MongoDB');
    
    const collection = await db.getCollection('expenses');
    
    // Get the most recent WhatsApp expense
    const recentExpense = await collection.findOne(
      { source: 'whatsapp_twilio' },
      { sort: { createdAt: -1 } }
    );
    
    if (recentExpense) {
      console.log('Most recent WhatsApp expense:');
      console.log('ID:', recentExpense._id);
      console.log('Vehicle ID type:', typeof recentExpense.vehicleId);
      console.log('Vehicle ID value:', recentExpense.vehicleId);
      console.log('Driver ID type:', typeof recentExpense.driverId);
      console.log('Driver ID value:', recentExpense.driverId);
      console.log('Amount:', recentExpense.amount);
      console.log('Description:', recentExpense.description);
      console.log('Source:', recentExpense.source);
    } else {
      console.log('No WhatsApp expenses found');
    }
    
    await db.closeConnection();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStringIds();
