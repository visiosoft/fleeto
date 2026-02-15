const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Fleet Management API',
      version: '1.0.0',
      description: 'Comprehensive API Documentation for Fleet Management System',
      contact: {
        name: 'API Support',
        email: 'support@fleetmanagement.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.mypaperlessoffice.com',
        description: 'Production server',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Vehicles', description: 'Vehicle management' },
      { name: 'Drivers', description: 'Driver management' },
      { name: 'Invoices', description: 'Invoice management' },
      { name: 'Receipts', description: 'Receipt management' },
      { name: 'Costs', description: 'Cost tracking' },
      { name: 'Fuel', description: 'Fuel management' },
      { name: 'Maintenance', description: 'Maintenance records' },
      { name: 'Dashboard', description: 'Dashboard statistics' },
      { name: 'Company', description: 'Company settings' },
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js'], // files containing annotations
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app, port) {
  // Swagger Page with custom CSS
  const customCss = `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #2563EB; }
  `;
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss,
    customSiteTitle: 'Fleet Management API Docs',
    customfavIcon: '/favicon.ico'
  }));

  // Docs in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('\n====================================');
  console.log('📚 API Documentation Ready!');
  console.log(`📖 Swagger UI: http://localhost:${port}/api-docs`);
  console.log(`📄 JSON Spec: http://localhost:${port}/api-docs.json`);
  console.log('====================================\n');
}

module.exports = swaggerDocs; 