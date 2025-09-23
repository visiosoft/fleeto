const express = require('express');
const app = express();

// Test the letterhead routes
try {
  const letterheadRoutes = require('./routes/letterheadRoutes');
  console.log('✅ Letterhead routes loaded successfully');
  
  app.use('/api/letterheads', letterheadRoutes);
  console.log('✅ Letterhead routes registered successfully');
  
  // Test if routes are accessible
  const routes = letterheadRoutes.stack || [];
  console.log('📋 Available routes:');
  routes.forEach((route, index) => {
    if (route.route) {
      const methods = Object.keys(route.route.methods);
      const path = route.route.path;
      console.log(`  ${index + 1}. ${methods.join(', ').toUpperCase()} ${path}`);
    }
  });
  
} catch (error) {
  console.error('❌ Error loading letterhead routes:', error.message);
  console.error(error.stack);
}
