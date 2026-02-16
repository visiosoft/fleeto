/**
 * Script to add companyId to expenses that are missing it
 * Run this with: node fix-expenses-companyId.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fleet-management';

async function fixExpenses() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const expenses = db.collection('expenses');
    const vehicles = db.collection('vehicles');
    
    // Find expenses without companyId
    const expensesWithoutCompanyId = await expenses.find({
      companyId: { $exists: false }
    }).toArray();
    
    console.log(`Found ${expensesWithoutCompanyId.length} expenses without companyId`);
    
    let updated = 0;
    let failed = 0;
    
    for (const expense of expensesWithoutCompanyId) {
      try {
        // Get the vehicle to find its companyId
        const vehicle = await vehicles.findOne({ _id: { $oid: expense.vehicleId } });
        
        if (!vehicle) {
          // Try without $oid
          const vehicleById = await vehicles.findOne({ 
            _id: require('mongodb').ObjectId.isValid(expense.vehicleId) 
              ? new require('mongodb').ObjectId(expense.vehicleId)
              : expense.vehicleId 
          });
          
          if (vehicleById && vehicleById.companyId) {
            // Update expense with companyId
            await expenses.updateOne(
              { _id: expense._id },
              { $set: { companyId: vehicleById.companyId } }
            );
            console.log(`✓ Updated expense ${expense._id} with companyId ${vehicleById.companyId}`);
            updated++;
          } else {
            console.log(`✗ Could not find vehicle ${expense.vehicleId} for expense ${expense._id}`);
            failed++;
          }
        } else if (vehicle.companyId) {
          // Update expense with companyId
          await expenses.updateOne(
            { _id: expense._id },
            { $set: { companyId: vehicle.companyId } }
          );
          console.log(`✓ Updated expense ${expense._id} with companyId ${vehicle.companyId}`);
          updated++;
        } else {
          console.log(`✗ Vehicle ${expense.vehicleId} has no companyId`);
          failed++;
        }
      } catch (err) {
        console.error(`Error processing expense ${expense._id}:`, err.message);
        failed++;
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total expenses processed: ${expensesWithoutCompanyId.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed: ${failed}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

fixExpenses();
