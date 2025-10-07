const db = require('./config/db');

async function fixCompanyId() {
  try {
    await db.connectToDatabase();
    console.log('Connected to MongoDB');
    
    const expensesCollection = await db.getCollection('expenses');
    const vehiclesCollection = await db.getCollection('vehicles');
    
    // Get the companyId from vehicles
    const vehicle = await vehiclesCollection.findOne({});
    const companyId = vehicle ? vehicle.companyId : '67e8291028f8bad079c0e8bb';
    console.log('Using companyId:', companyId);
    
    // Update all expenses that don't have companyId
    const result = await expensesCollection.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: companyId } }
    );
    
    console.log(`Updated ${result.modifiedCount} expenses with companyId`);
    
    // Verify the update
    const expensesWithCompanyId = await expensesCollection.countDocuments({ companyId: { $exists: true } });
    const totalExpenses = await expensesCollection.countDocuments({});
    
    console.log(`Total expenses: ${totalExpenses}`);
    console.log(`Expenses with companyId: ${expensesWithCompanyId}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.closeConnection();
  }
}

fixCompanyId();
