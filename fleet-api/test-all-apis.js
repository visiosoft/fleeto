const axios = require('axios');
const jwt = require('jsonwebtoken');
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Create a test token
const testCompanyId = '507f1f77bcf86cd799439011';
const testUserId = '507f191e810c19729de860ea';

const testToken = jwt.sign(
  {
    userId: testUserId,
    companyId: testCompanyId,
    email: 'test@fleet.com',
    role: 'admin'
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('\n🔐 Test JWT Token Generated:');
console.log(testToken);
console.log('\n');

const endpoints = [
  // Dashboard endpoints
  { method: 'GET', path: '/dashboard/active-counts', requiresAuth: true },
  { method: 'GET', path: '/dashboard/active-vehicles', requiresAuth: true },
  { method: 'GET', path: '/dashboard/active-drivers', requiresAuth: true },
  { method: 'GET', path: '/dashboard/fuel/current-month', requiresAuth: true },
  { method: 'GET', path: '/dashboard/maintenance/current-month', requiresAuth: true },
  { method: 'GET', path: '/dashboard/contracts/stats', requiresAuth: true },
  
  // Other endpoints
  { method: 'GET', path: '/vehicles', requiresAuth: true },
  { method: 'GET', path: '/drivers', requiresAuth: true },
  { method: 'GET', path: '/expenses', requiresAuth: true },
  { method: 'GET', path: '/fuel', requiresAuth: true },
  { method: 'GET', path: '/maintenance', requiresAuth: true },
  { method: 'GET', path: '/payroll/entries', requiresAuth: true },
  { method: 'GET', path: '/invoices', requiresAuth: true },
  { method: 'GET', path: '/receipts', requiresAuth: true },
  { method: 'GET', path: '/companies', requiresAuth: true },
  { method: 'GET', path: '/letterheads', requiresAuth: true },
  { method: 'GET', path: '/contracts', requiresAuth: true },
  { method: 'GET', path: '/contract-templates', requiresAuth: true },
  { method: 'GET', path: '/costs/monthly', requiresAuth: true },
  { method: 'GET', path: '/costs/yearly', requiresAuth: true },
  { method: 'GET', path: '/costs/by-category', requiresAuth: true },
];

async function testEndpoint(endpoint) {
  try {
    const config = {
      method: endpoint.method,
      url: `${BASE_URL}${endpoint.path}`,
      headers: endpoint.requiresAuth ? { Authorization: `Bearer ${testToken}` } : {}
    };

    const response = await axios(config);
    return {
      endpoint: endpoint.path,
      status: response.status,
      success: true,
      data: response.data?.status || 'ok',
      message: response.data?.message || 'Success'
    };
  } catch (error) {
    const status = error.response?.status || 'ERROR';
    const message = error.response?.data?.message || error.message;
    const errorType = error.response?.data?.error || 'Unknown error';
    
    return {
      endpoint: endpoint.path,
      status,
      success: false,
      message,
      errorType
    };
  }
}

async function runTests() {
  console.log('🚀 Testing Fleet Management API Endpoints\n');
  console.log('=' .repeat(80));
  
  const results = {
    passed: [],
    failed: [],
    authErrors: [],
    serverErrors: []
  };

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    
    // Print result
    const statusIcon = result.success ? '✅' : '❌';
    const statusCode = result.status;
    
    console.log(`${statusIcon} [${statusCode}] ${endpoint.method} ${result.endpoint}`);
    
    if (!result.success) {
      console.log(`   Error: ${result.message}`);
      if (result.errorType) {
        console.log(`   Type: ${result.errorType}`);
      }
      
      // Categorize errors
      if (statusCode === 401 || statusCode === 403) {
        results.authErrors.push(result);
      } else if (statusCode === 500 || statusCode === 'ERROR') {
        results.serverErrors.push(result);
      } else {
        results.failed.push(result);
      }
    } else {
      results.passed.push(result);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${results.passed.length}`);
  console.log(`   🔒 Auth Errors: ${results.authErrors.length}`);
  console.log(`   ⚠️  Other Failures: ${results.failed.length}`);
  console.log(`   💥 Server Errors (500): ${results.serverErrors.length}`);
  
  if (results.serverErrors.length > 0) {
    console.log('\n🔥 Endpoints returning 500 errors:');
    results.serverErrors.forEach(err => {
      console.log(`   - ${err.endpoint}`);
      console.log(`     Error: ${err.message}`);
      if (err.errorType) {
        console.log(`     Detail: ${err.errorType}`);
      }
    });
  }
  
  if (results.authErrors.length > 0) {
    console.log('\n🔒 Authentication/Authorization issues:');
    results.authErrors.forEach(err => {
      console.log(`   - [${err.status}] ${err.endpoint}: ${err.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

// Run the tests
runTests().catch(error => {
  console.error('Test suite failed:', error.message);
  process.exit(1);
});
