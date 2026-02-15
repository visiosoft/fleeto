const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const swaggerDocs = require('./swagger');
const app = express();
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const vehicleRoutes = require('./routes/vehicleRoutes');
const fuelRoutes = require('./routes/fuelRoutes');
const companySettingsRoutes = require('./routes/companyProfileRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const noteRoutes = require('./routes/noteRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const twilioWhatsAppRoutes = require('./routes/twilioWhatsAppRoutes');
const costRoutes = require('./routes/costRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const driverRoutes = require('./routes/driverRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const companyRoutes = require('./routes/companyRoutes');
const letterheadRoutes = require('./routes/letterheadRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const contractRoutes = require('./routes/companyContractRoutes');
const contractTemplateRoutes = require('./routes/contractTemplateRoutes');

// API Routes
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

// MongoDB connection
mongoose.connect('mongodb+srv://devxulfiqar:nSISUpLopruL7S8j@mypaperlessoffice.z5g84.mongodb.net/fleet-management?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Root route for API information
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
    <p class="subtitle">Version 1.0.0 - Development Server</p>
    
    <a href="/api-docs" class="btn">📚 Swagger Documentation</a>
    <a href="/api-docs.json" class="btn" style="background: #64748B;">📄 JSON Spec</a>
    
    <div class="section">
      <h2>🔥 Popular Endpoints</h2>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/auth/login</span>
        <div class="auth">🔓 No auth required - Get JWT token</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles</span>
        <div class="auth">🔐 Auth required - Get all vehicles</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Auth required - Get vehicle by ID</div>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/vehicles</span>
        <div class="auth">🔐 Auth required - Create new vehicle</div>
      </div>
      
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Auth required - Update vehicle</div>
      </div>
      
      <div class="endpoint">
        <span class="method delete">DELETE</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Auth required - Delete vehicle</div>
      </div>
    </div>
    
    <div class="section">
      <h2>📁 Vehicle Document Endpoints</h2>
      
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method post">POST</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/upload-document</span>
        <div class="auth">🔐 Auth required - Upload a document (multipart/form-data with 'document' field)</div>
      </div>
      
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/get-documents</span>
        <div class="auth">🔐 Auth required - Get all documents for a vehicle</div>
      </div>
      
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method delete">DELETE</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/delete-document/<span class="highlight">:documentId</span></span>
        <div class="auth">🔐 Auth required - Delete a specific document</div>
      </div>
      
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles/file/<span class="highlight">:vehicleId</span>/<span class="highlight">:filename</span></span>
        <div class="auth">🔐 Auth required - Download/view a document file</div>
      </div>
      
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/documents</span>
        <div class="auth">🔐 Auth required - Get documents (legacy endpoint)</div>
      </div>
      
      <div class="endpoint" style="border-left-color: #10B981;">
        <span class="method post">POST</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/documents</span>
        <div class="auth">🔐 Auth required - Add document (legacy endpoint)</div>
      </div>
    </div>
    
    <div class="section">
      <h2>👨‍✈️ Driver Document Endpoints</h2>
      
      <div class="endpoint" style="border-left-color: #8B5CF6;">
        <span class="method post">POST</span>
        <span class="path">/api/drivers/<span class="highlight">:id</span>/upload-document</span>
        <div class="auth">🔐 Auth required - Upload driver document</div>
      </div>
      
      <div class="endpoint" style="border-left-color: #8B5CF6;">
        <span class="method get">GET</span>
        <span class="path">/api/drivers/<span class="highlight">:id</span>/get-documents</span>
        <div class="auth">🔐 Auth required - Get all driver documents</div>
      </div>
      
      <div class="endpoint" style="border-left-color: #8B5CF6;">
        <span class="method delete">DELETE</span>
        <span class="path">/api/drivers/<span class="highlight">:id</span>/delete-document/<span class="highlight">:documentId</span></span>
        <div class="auth">🔐 Auth required - Delete driver document</div>
      </div>
      
      <div class="endpoint" style="border-left-color: #8B5CF6;">
        <span class="method get">GET</span>
        <span class="path">/api/drivers/file/<span class="highlight">:driverId</span>/<span class="highlight">:filename</span></span>
        <div class="auth">🔐 Auth required - Download driver document file</div>
      </div>
    </div>
    
    <div class="section">
      <h2>🔧 Vehicle Maintenance Endpoints</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/maintenance</span>
        <div class="auth">🔐 Auth required - Get maintenance records</div>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/maintenance</span>
        <div class="auth">🔐 Auth required - Add maintenance record</div>
      </div>
      
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/maintenance/<span class="highlight">:maintenanceId</span></span>
        <div class="auth">🔐 Auth required - Update maintenance record</div>
      </div>
      
      <div class="endpoint">
        <span class="method delete">DELETE</span>
        <span class="path">/api/vehicles/<span class="highlight">:id</span>/maintenance/<span class="highlight">:maintenanceId</span></span>
        <div class="auth">🔐 Auth required - Delete maintenance record</div>
      </div>
    </div>
    
    <div class="section">
      <h2>📄 Invoice Endpoints (Beta)</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/invoices/beta/stats</span>
        <div class="auth">🔐 Auth required - Get invoice statistics</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/invoices/beta</span>
        <div class="auth">🔐 Auth required - Get all invoices</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/invoices/beta/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Auth required - Get invoice by ID</div>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/invoices/beta</span>
        <div class="auth">🔐 Auth required - Create new invoice</div>
      </div>
      
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/invoices/beta/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Auth required - Update invoice</div>
      </div>
      
      <div class="endpoint">
        <span class="method delete">DELETE</span>
        <span class="path">/api/invoices/beta/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Auth required - Delete invoice</div>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/invoices/beta/<span class="highlight">:id</span>/payments</span>
        <div class="auth">🔐 Auth required - Add payment to invoice</div>
      </div>
    </div>
    
    <div class="section">
      <h2>👥 Driver Endpoints</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/drivers</span>
        <div class="auth">🔐 Auth required - Get all drivers</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/drivers/search</span>
        <div class="auth">🔐 Auth required - Search drivers</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/drivers/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Auth required - Get driver by ID</div>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/drivers</span>
        <div class="auth">🔐 Auth required - Create new driver</div>
      </div>
      
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/api/drivers/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Auth required - Update driver</div>
      </div>
      
      <div class="endpoint">
        <span class="method delete">DELETE</span>
        <span class="path">/api/drivers/<span class="highlight">:id</span></span>
        <div class="auth">🔐 Auth required - Delete driver</div>
      </div>
    </div>
    
    <div class="section">
      <h2>📊 Dashboard Endpoints</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/dashboard/stats</span>
        <div class="auth">🔐 Auth required - Get dashboard statistics</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/dashboard/summary</span>
        <div class="auth">🔐 Auth required - Get dashboard summary</div>
      </div>
    </div>
    
    <div class="section">
      <h2>💰 Other Endpoints</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/receipts</span>
        <div class="auth">🔐 Auth required - Get all receipts</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/costs</span>
        <div class="auth">🔐 Auth required - Get all costs</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/fuel</span>
        <div class="auth">🔐 Auth required - Get all fuel records</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/maintenance</span>
        <div class="auth">🔐 Auth required - Get all maintenance records</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/expenses</span>
        <div class="auth">🔐 Auth required - Get all expenses</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/payroll</span>
        <div class="auth">🔐 Auth required - Get all payroll records</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/notes</span>
        <div class="auth">🔐 Auth required - Get all notes</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/letterheads</span>
        <div class="auth">🔐 Auth required - Get all letterheads</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/contracts</span>
        <div class="auth">🔐 Auth required - Get all contracts</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/users</span>
        <div class="auth">🔐 Auth required - Get all users</div>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/company</span>
        <div class="auth">🔐 Auth required - Get company profile</div>
      </div>
    </div>
    
    <div class="section">
      <h2>📋 All Endpoint Categories</h2>
      <ul style="line-height: 2;">
        <li><strong>Authentication:</strong> /api/auth/* (login, register, logout)</li>
        <li><strong>Vehicles:</strong> /api/vehicles/* (CRUD, documents, maintenance)</li>
        <li><strong>Drivers:</strong> /api/drivers/* (CRUD, documents)</li>
        <li><strong>Invoices:</strong> /api/invoices/beta/* (CRUD, payments, stats)</li>
        <li><strong>Receipts:</strong> /api/receipts/* (CRUD)</li>
        <li><strong>Costs:</strong> /api/costs/* (CRUD, stats)</li>
        <li><strong>Fuel:</strong> /api/fuel/* (CRUD, by vehicle)</li>
        <li><strong>Maintenance:</strong> /api/maintenance/* (CRUD)</li>
        <li><strong>Expenses:</strong> /api/expenses/* (CRUD)</li>
        <li><strong>Payroll:</strong> /api/payroll/* (CRUD)</li>
        <li><strong>Notes:</strong> /api/notes/* (CRUD)</li>
        <li><strong>Letterheads:</strong> /api/letterheads/* (CRUD)</li>
        <li><strong>Contracts:</strong> /api/contracts/* (CRUD)</li>
        <li><strong>Contract Templates:</strong> /api/contract-templates/* (CRUD)</li>
        <li><strong>Company:</strong> /api/company/* (profile, settings)</li>
        <li><strong>Users:</strong> /api/users/* (CRUD)</li>
        <li><strong>Dashboard:</strong> /api/dashboard/* (stats, charts)</li>
        <li><strong>WhatsApp:</strong> /api/twilio-whatsapp/* (send, webhook)</li>
      </ul>
    </div>
    
    <div class="section" style="background: #FEF3C7; padding: 20px; border-radius: 6px; margin-top: 30px;">
      <h3 style="margin-top: 0;">⚠️ Common Mistakes</h3>
      <p><strong>❌ Wrong:</strong> <code>http://localhost:5000/get-documents</code></p>
      <p><strong>❌ Wrong:</strong> <code>http://localhost:5000/api/get-documents</code></p>
      <p><strong>✅ Correct:</strong> <code>http://localhost:5000/api/vehicles/YOUR_ID/get-documents</code></p>
      <p style="margin-bottom: 0;">Replace <code>YOUR_ID</code> with an actual vehicle ID from your database.</p>
    </div>
    
    <div class="section" style="background: #DBEAFE; padding: 20px; border-radius: 6px;">
      <h3 style="margin-top: 0;">🔑 Authentication</h3>
      <p>Most endpoints require a JWT Bearer token:</p>
      <pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto;">Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</pre>
      <p style="margin-bottom: 0;">Get your token by calling <code>POST /api/auth/login</code> first.</p>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #64748B; text-align: center;">
      <p>For complete interactive documentation, visit <a href="/api-docs" style="color: #2563EB;">/api-docs</a></p>
    </div>
  </div>
</body>
</html>
  `);
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    documentation: '/api-docs'
  });
});

const PORT = process.env.PORT || 5000;

// Initialize Swagger
swaggerDocs(app, PORT);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 