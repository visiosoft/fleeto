const db = require('./config/db');

async function checkExpenses() {
  try {
    await db.connectToDatabase();
    console.log('Connected to MongoDB');
    
    // Check all expenses
    const collection = await db.getCollection('expenses');
    const allExpenses = await collection.find({}).sort({ createdAt: -1 }).limit(10).toArray();
    
    console.log(`\nFound ${allExpenses.length} total expenses:`);
    console.log('=====================================');
    
    allExpenses.forEach((expense, index) => {
      console.log(`\n${index + 1}. Expense ID: ${expense._id}`);
      console.log(`   Type: ${expense.expenseType || 'N/A'}`);
      console.log(`   Amount: ${expense.amount || 'N/A'} AED`);
      console.log(`   Vehicle: ${expense.vehicleId || 'N/A'}`);
      console.log(`   Driver: ${expense.driverId || 'N/A'}`);
      console.log(`   Description: ${expense.description || 'N/A'}`);
      console.log(`   Status: ${expense.status || 'N/A'}`);
      console.log(`   Source: ${expense.source || 'N/A'}`);
      console.log(`   Company ID: ${expense.companyId || 'N/A'}`);
      console.log(`   Created: ${expense.createdAt || 'N/A'}`);
      console.log(`   WhatsApp Number: ${expense.whatsappNumber || 'N/A'}`);
    });
    
    // Check for expenses with companyId
    const expensesWithCompanyId = allExpenses.filter(e => e.companyId);
    console.log(`\n\nExpenses with companyId: ${expensesWithCompanyId.length}`);
    if (expensesWithCompanyId.length > 0) {
      console.log('Sample companyId:', expensesWithCompanyId[0].companyId);
    }
    
    // Check specifically for Twilio WhatsApp expenses
    const twilioExpenses = await collection.find({ source: 'whatsapp_twilio' }).sort({ createdAt: -1 }).toArray();
    console.log(`\n\nTwilio WhatsApp expenses: ${twilioExpenses.length}`);
    
    // Check for any WhatsApp expenses
    const whatsappExpenses = await collection.find({ 
      $or: [
        { source: 'whatsapp' },
        { source: 'whatsapp_twilio' },
        { whatsappNumber: { $exists: true } }
      ]
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`WhatsApp expenses (any source): ${whatsappExpenses.length}`);
    
    // Check drivers
    const driversCollection = await db.getCollection('drivers');
    const drivers = await driversCollection.find({}).toArray();
    console.log(`\n\nDrivers found: ${drivers.length}`);
    drivers.forEach((d, i) => {
      console.log(`${i+1}. ${d.firstName} ${d.lastName} - Contact: ${d.contact}`);
    });
    
    // Check vehicles for companyId
    const vehiclesCollection = await db.getCollection('vehicles');
    const vehicles = await vehiclesCollection.find({}).limit(3).toArray();
    console.log(`\n\nVehicles found: ${vehicles.length}`);
    vehicles.forEach((v, i) => {
      console.log(`${i+1}. ${v.make} ${v.model} (${v.licensePlate}) - Company ID: ${v.companyId || 'N/A'}`);
    });
    
    if (allExpenses.length === 0) {
      console.log('No expenses found in database.');
    }
    
    await db.closeConnection();
  } catch (error) {
    console.error('Error checking expenses:', error);
  }
}

checkExpenses();
