const express = require('express');
const cors = require('cors');
const { ObjectId } = require('mongodb');
require('dotenv').config();

// Import database configuration
const db = require('./config/db');

// Import Swagger
const swaggerDocs = require('./swagger');

// Import middleware
const { authenticate } = require('./middleware/auth');

// Import routes
const vehicleRoutes = require('./routes/vehicleRoutes');
const fuelRoutes = require('./routes/fuelRoutes');
const companySettingsRoutes = require('./routes/companyProfileRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const contractRoutes = require('./routes/companyContractRoutes');
const contractTemplateRoutes = require('./routes/contractTemplateRoutes');
const driverRoutes = require('./routes/driverRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const costRoutes = require('./routes/costRoutes');
const noteRoutes = require('./routes/noteRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const companyRoutes = require('./routes/companyRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const letterheadRoutes = require('./routes/letterheadRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const twilioWhatsAppRoutes = require('./routes/twilioWhatsAppRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route - API Documentation Homepage
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fleet Management API</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #2563EB; margin: 0 0 10px; }
    h2 { color: #1E293B; font-size: 20px; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; }
    .subtitle { color: #64748B; margin-bottom: 30px; }
    .btn { display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 6px; margin-right: 10px; font-weight: 600; }
    .btn:hover { background: #1D4ED8; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(500px, 1fr)); gap: 10px; }
    .endpoint { background: #f8fafc; padding: 12px 15px; border-radius: 6px; border-left: 4px solid #2563EB; }
    .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; margin-right: 10px; min-width: 50px; text-align: center; }
    .get { background: #10B981; color: white; }
    .post { background: #3B82F6; color: white; }
    .put { background: #F59E0B; color: white; }
    .delete { background: #EF4444; color: white; }
    .path { font-family: 'Courier New', monospace; color: #0F172A; font-weight: 600; font-size: 13px; }
    .auth { color: #64748B; font-size: 12px; margin-top: 4px; }
    .highlight { background: #FEF3C7; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚗 Fleet Management API</h1>
    <p class="subtitle">Complete API Reference - Version 1.0.0</p>
    
    <a href="/api-docs" class="btn">📚 Interactive Swagger Docs</a>
    <a href="/api-docs.json" class="btn" style="background: #64748B;">📄 OpenAPI Spec</a>
    
    <h2>🔐 Authentication</h2>
    <div class="grid">
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/auth/login</span>
        <div class="auth">🔓 Public - Login and get JWT token</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/auth/register</span>
        <div class="auth">🔓 Public - Register new user</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/auth/me</span>
        <div class="auth">🔐 Protected - Get current user</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/health</span>
        <div class="auth">🔓 Public - API health check</div>
      </div>
    </div>

    <h2>🚙 Vehicles</h2>
    <div class="grid">
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles</span>
        <div class="auth">🔐 Get all vehicles</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Get vehicle by ID</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/vehicles</span>
        <div class="auth">🔐 Create new vehicle</div>
      </div>
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Update vehicle</div>
      </div>
      <div class="endpoint">
        <span class="method delete">DELETE</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Delete vehicle</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles/search</span>
        <div class="auth">🔐 Search vehicles</div>
      </div>
    </div>

    <h2>📁 Vehicle Documents</h2>
    <div class="grid">
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method post">POST</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/upload-document</span>
        <div class="auth">🔐 Upload document (multipart/form-data)</div>
      </div>
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/get-documents</span>
        <div class="auth">🔐 Get all vehicle documents</div>
      </div>
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method delete">DELETE</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/delete-document/<span class="highlight">:docId</span></span>
        <div class="auth">🔐 Delete document</div>
      </div>
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles/file/<span class="highlight">:vehicleId</span>/<span class="highlight">:filename</span></span>
        <div class="auth">🔐 Download/view file</div>
      </div>
    </div>

    <h2>🔧 Vehicle Maintenance</h2>
    <div class="grid">
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/maintenance</span>
        <div class="auth">🔐 Get all maintenance records</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/maintenance</span>
        <div class="auth">🔐 Create maintenance record</div>
      </div>
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/maintenance/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Update maintenance record</div>
      </div>
      <div class="endpoint">
        <span class="method delete">DELETE</span>
        <span class="path">/api/maintenance/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Delete maintenance record</div>
      </div>
    </div>

    <h2>👨‍✈️ Drivers</h2>
    <div class="grid">
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/drivers</span>
        <div class="auth">🔐 Get all drivers</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/drivers/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Get driver by ID</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/drivers</span>
        <div class="auth">🔐 Create new driver</div>
      </div>
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/drivers/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Update driver</div>
      </div>
      <div class="endpoint">
        <span class="method delete">DELETE</span>
        <span class="path">/api/drivers/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Delete driver</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/drivers/search</span>
        <div class="auth">🔐 Search drivers</div>
      </div>
      <div class="endpoint" style="border-left-color: #8B5CF6;">
        <span class="method post">POST</span>
        <span class="path">/api/drivers/<span class="highlight">:id</span>/upload-document</span>
        <div class="auth">🔐 Upload driver document</div>
      </div>
      <div class="endpoint" style="border-left-color: #8B5CF6;">
        <span class="method get">GET</span>
        <span class="path">/api/drivers/<span class="highlight">:id</span>/get-documents</span>
        <div class="auth">🔐 Get driver documents</div>
      </div>
    </div>

    <h2>📄 Invoices (Beta)</h2>
    <div class="grid">
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/invoices/beta</span>
        <div class="auth">🔐 Get all invoices</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/invoices/beta/stats</span>
        <div class="auth">🔐 Get invoice statistics</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/invoices/beta/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Get invoice by ID</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/invoices/beta</span>
        <div class="auth">🔐 Create invoice</div>
      </div>
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/invoices/beta/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Update invoice</div>
      </div>
      <div class="endpoint">
        <span class="method delete">DELETE</span>
        <span class="path">/api/invoices/beta/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Delete invoice</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/invoices/beta/<span class="highlight">:id</span>/payments</span>
        <div class="auth">🔐 Add payment</div>
      </div>
    </div>

    <h2>⛽ Fuel Management</h2>
    <div class="grid">
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/fuel</span>
        <div class="auth">🔐 Get all fuel records</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/fuel</span>
        <div class="auth">🔐 Create fuel record</div>
      </div>
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/fuel/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Update fuel record</div>
      </div>
      <div class="endpoint">
        <span class="method delete">DELETE</span>
        <span class="path">/api/fuel/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Delete fuel record</div>
      </div>
    </div>

    <h2>💰 Financial</h2>
    <div class="grid">
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/costs</span>
        <div class="auth">🔐 Get all costs</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/expenses</span>
        <div class="auth">🔐 Get all expenses</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/receipts</span>
        <div class="auth">🔐 Get all receipts</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/payroll</span>
        <div class="auth">🔐 Get all payroll records</div>
      </div>
    </div>

    <h2>📋 Other Resources</h2>
    <div class="grid">
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/notes</span>
        <div class="auth">🔐 Get all notes</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/letterheads</span>
        <div class="auth">🔐 Get all letterheads</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/contracts</span>
        <div class="auth">🔐 Get all contracts</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/contract-templates</span>
        <div class="auth">🔐 Get contract templates</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/users</span>
        <div class="auth">🔐 Get all users</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/companies</span>
        <div class="auth">🔐 Get all companies</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/company</span>
        <div class="auth">🔐 Get company profile</div>
      </div>
    </div>

    <h2>📊 Dashboard & Analytics</h2>
    <div class="grid">
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/dashboard/stats</span>
        <div class="auth">🔐 Get dashboard statistics</div>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/dashboard/summary</span>
        <div class="auth">🔐 Get dashboard summary</div>
      </div>
    </div>

    <h2>💬 Communication</h2>
    <div class="grid">
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/twilio-whatsapp/send</span>
        <div class="auth">🔐 Send WhatsApp message</div>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/twilio-whatsapp/webhook</span>
        <div class="auth">🔓 WhatsApp webhook (Twilio)</div>
      </div>
    </div>
    
    <div style="background: #EFF6FF; padding: 25px; border-radius: 8px; margin-top: 40px; border-left: 4px solid #2563EB;">
      <h3 style="margin-top: 0; color: #1E40AF;">🔑 How to Authenticate</h3>
      <p style="margin: 10px 0;"><strong>1. Login to get token:</strong></p>
      <pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto; border: 1px solid #DBEAFE;">POST /api/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}</pre>
      <p style="margin: 15px 0 10px;"><strong>2. Use token in subsequent requests:</strong></p>
      <pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto; border: 1px solid #DBEAFE;">Authorization: Bearer YOUR_JWT_TOKEN_HERE</pre>
    </div>
    
    <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #E5E7EB; text-align: center;">
      <p style="color: #64748B; margin-bottom: 15px;">📚 For interactive testing and detailed schemas, visit:</p>
      <a href="/api-docs" style="color: #2563EB; font-weight: 600; font-size: 18px; text-decoration: none;">Swagger Interactive Documentation →</a>
      <p style="color: #94A3B8; margin-top: 20px; font-size: 14px;">Total: 80+ endpoints | All require authentication except login & health check</p>
    </div>
  </div>
</body>
</html>
  `);
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await db.connectToDatabase();
    res.status(200).json({ status: 'ok', message: 'API server is running and connected to MongoDB' });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/company', companySettingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/twilio-whatsapp', twilioWhatsAppRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/letterheads', letterheadRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/contract-templates', contractTemplateRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Generic API routes for other collections
const COLLECTIONS = db.COLLECTIONS;
delete COLLECTIONS.drivers; // We have a dedicated route for drivers
delete COLLECTIONS.expenses; // We have a dedicated route for expenses
delete COLLECTIONS.receipts; // We have a dedicated route for receipts

Object.entries(COLLECTIONS).forEach(([key, collectionName]) => {
  // Get all documents
  app.get(`/api/${collectionName}`, authenticate, async (req, res) => {
    try {
      // Get company ID from authenticated user
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const collection = await db.getCollection(collectionName);
      const result = await collection.find({ 
        companyId: companyId.toString() 
      }).toArray();
      
      res.status(200).json(result);
    } catch (error) {
      console.error(`Error getting all ${collectionName}:`, error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  // Get document by ID
  app.get(`/api/${collectionName}/:id`, authenticate, async (req, res) => {
    try {
      // Get company ID from authenticated user
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const id = req.params.id;
      const collection = await db.getCollection(collectionName);
      const result = await collection.findOne({ 
        _id: new ObjectId(id),
        companyId: companyId.toString()
      });
      
      if (!result) {
        return res.status(404).json({ status: 'error', message: `${key} not found` });
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error(`Error getting ${key} by ID:`, error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  // Create new document
  app.post(`/api/${collectionName}`, authenticate, async (req, res) => {
    try {
      // Get company ID from authenticated user
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const newDoc = {
        ...req.body,
        companyId: companyId.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const collection = await db.getCollection(collectionName);
      const result = await collection.insertOne(newDoc);
      
      res.status(201).json({
        status: 'success',
        _id: result.insertedId,
        ...newDoc
      });
    } catch (error) {
      console.error(`Error creating ${key}:`, error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  // Update document
  app.put(`/api/${collectionName}/:id`, authenticate, async (req, res) => {
    try {
      // Get company ID from authenticated user
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const id = req.params.id;
      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };
      
      // Ensure companyId cannot be changed
      delete updateData.companyId;
      
      const collection = await db.getCollection(collectionName);
      
      // First check if document exists and belongs to this company
      const existingDoc = await collection.findOne({
        _id: new ObjectId(id),
        companyId: companyId.toString()
      });
      
      if (!existingDoc) {
        return res.status(404).json({ 
          status: 'error', 
          message: `${key} not found or access denied` 
        });
      }
      
      const result = await collection.updateOne(
        { _id: new ObjectId(id), companyId: companyId.toString() },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ status: 'error', message: `${key} not found` });
      }
      
      const updatedDoc = await collection.findOne({ _id: new ObjectId(id) });
      res.status(200).json(updatedDoc);
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  // Delete document
  app.delete(`/api/${collectionName}/:id`, authenticate, async (req, res) => {
    try {
      // Get company ID from authenticated user
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      const id = req.params.id;
      const collection = await db.getCollection(collectionName);
      
      // Check if document exists and belongs to this company
      const existingDoc = await collection.findOne({
        _id: new ObjectId(id),
        companyId: companyId.toString()
      });
      
      if (!existingDoc) {
        return res.status(404).json({ 
          status: 'error', 
          message: `${key} not found or access denied` 
        });
      }
      
      const result = await collection.deleteOne({ 
        _id: new ObjectId(id),
        companyId: companyId.toString()
      });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ status: 'error', message: `${key} not found` });
      }
      
      res.status(200).json({ status: 'success', message: `${key} deleted successfully` });
    } catch (error) {
      console.error(`Error deleting ${key}:`, error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  // Search documents
  app.get(`/api/${collectionName}/search`, authenticate, async (req, res) => {
    try {
      // Get company ID from authenticated user
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }
      
      // Convert query params to MongoDB query
      const query = {
        // Always filter by company ID
        companyId: companyId.toString()
      };
      
      // Remove non-filter parameters
      const { page, limit, sort, ...filters } = req.query;
      
      // Build the query from the remaining filters
      Object.entries(filters).forEach(([key, value]) => {
        // Handle special query operators like gt, lt, etc.
        if (key.includes('_')) {
          const [field, operator] = key.split('_');
          query[field] = query[field] || {};
          
          switch (operator) {
            case 'gt':
              query[field]['$gt'] = Number(value);
              break;
            case 'lt':
              query[field]['$lt'] = Number(value);
              break;
            case 'gte':
              query[field]['$gte'] = Number(value);
              break;
            case 'lte':
              query[field]['$lte'] = Number(value);
              break;
            default:
              query[key] = value;
          }
        } else {
          // Use regex for string fields to enable partial matches
          if (typeof value === 'string') {
            query[key] = { $regex: value, $options: 'i' };
          } else {
            query[key] = value;
          }
        }
      });
      
      const collection = await db.getCollection(collectionName);
      const result = await collection.find(query).toArray();
      res.status(200).json(result);
    } catch (error) {
      console.error(`Error searching ${collectionName}:`, error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    documentation: '/api-docs',
    requestedPath: req.path
  });
});

// Initialize Swagger Documentation
swaggerDocs(app, PORT);

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to database FIRST
    await db.connectToDatabase();
    console.log('Database connection established');
    
    // Then start the server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
        server.close();
        app.listen(PORT + 1, () => {
          console.log(`Server is running on port ${PORT + 1}`);
          console.log(`API Documentation: http://localhost:${PORT + 1}/api-docs`);
        });
      } else {
        console.error('Server error:', err);
      }
    });
    
    // Handle server shutdown
    process.on('SIGINT', async () => {
      console.log('Server shutting down...');
      await db.closeConnection();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = app;
