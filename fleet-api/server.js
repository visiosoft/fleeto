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
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #2563EB; margin: 0 0 10px; }
    .subtitle { color: #64748B; margin-bottom: 30px; }
    .btn { display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 6px; margin-right: 10px; font-weight: 600; }
    .btn:hover { background: #1D4ED8; }
    .section { margin: 30px 0; }
    .endpoint { background: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #2563EB; }
    .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; margin-right: 10px; }
    .get { background: #10B981; color: white; }
    .post { background: #3B82F6; color: white; }
    .put { background: #F59E0B; color: white; }
    .delete { background: #EF4444; color: white; }
    .path { font-family: monospace; color: #0F172A; font-weight: 600; }
    .auth { color: #64748B; font-size: 14px; margin-top: 5px; }
    .highlight { background: #FEF3C7; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚗 Fleet Management API</h1>
    <p class="subtitle">Version 1.0.0 - Server Running</p>
    
    <a href="/api-docs" class="btn">📚 Swagger Documentation</a>
    <a href="/api-docs.json" class="btn" style="background: #64748B;">📄 JSON Spec</a>
    
    <div class="section">
      <h2>📁 Vehicle Document Endpoints</h2>
      
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method post">POST</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/upload-document</span>
        <div class="auth">🔐 Auth required - Upload vehicle document (multipart/form-data)</div>
      </div>
      
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/get-documents</span>
        <div class="auth">🔐 Auth required - Get all vehicle documents</div>
      </div>
      
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method delete">DELETE</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/delete-document/<span class="highlight">:documentId</span></span>
        <div class="auth">🔐 Auth required - Delete document</div>
      </div>
      
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles/file/<span class="highlight">:vehicleId</span>/<span class="highlight">:filename</span></span>
        <div class="auth">🔐 Auth required - Download/view document file</div>
      </div>
    </div>
    
    <div class="section">
      <h2>🔥 Popular Endpoints</h2>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/auth/login</span>
        <div class="auth">🔓 No auth - Get JWT token</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/health</span>
        <div class="auth">🔓 No auth - Health check</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles</span>
        <div class="auth">🔐 Auth required - All vehicles</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/drivers</span>
        <div class="auth">🔐 Auth required - All drivers</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/invoices/beta</span>
        <div class="auth">🔐 Auth required - All invoices</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/dashboard/stats</span>
        <div class="auth">🔐 Auth required - Dashboard statistics</div>
      </div>
    </div>
    
    <div class="section" style="background: #FEF3C7; padding: 20px; border-radius: 6px;">
      <h3 style="margin-top: 0;">🔑 Authentication</h3>
      <p>Get your token first:</p>
      <pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto;">POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}</pre>
      <p>Then use it in requests:</p>
      <pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto;">Authorization: Bearer YOUR_JWT_TOKEN</pre>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #64748B; text-align: center;">
      <p>Complete documentation: <a href="/api-docs" style="color: #2563EB; font-weight: 600;">/api-docs</a></p>
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
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/letterheads', letterheadRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/twilio-whatsapp', twilioWhatsAppRoutes);

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

// Initialize Swagger Documentation
swaggerDocs(app, PORT);

// Start the server with error handling
const server = app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await db.connectToDatabase();
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    server.close();
    app.listen(PORT + 1, async () => {
      console.log(`Server is running on port ${PORT + 1}`);
      await db.connectToDatabase();
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
