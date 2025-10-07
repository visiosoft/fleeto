const http = require('http');

// Test data for different expense types
const testCases = [
  {
    name: 'Fuel Expense',
    data: 'From=whatsapp:+1234567890&Body=/expense fuel%0AVehicle: ABC-123%0AAmount: 150.50 AED%0ALocation: ADNOC Station%0ADate: 2024-01-15'
  },
  {
    name: 'Maintenance Expense',
    data: 'From=whatsapp:+1234567890&Body=/expense maintenance%0AVehicle: XYZ-789%0AType: Oil Change%0AAmount: 200.00 AED%0AGarage: Auto Care%0ADate: 2024-01-15'
  },
  {
    name: 'Other Expense',
    data: 'From=whatsapp:+1234567890&Body=/expense other%0AVehicle: DEF-456%0ADescription: Parking Fee%0AAmount: 25.00 AED%0ADate: 2024-01-15'
  },
  {
    name: 'Help Command',
    data: 'From=whatsapp:+1234567890&Body=/help'
  },
  {
    name: 'Template Command',
    data: 'From=whatsapp:+1234567890&Body=/expense'
  }
];

async function testWebhook(testCase) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/twilio-whatsapp/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(testCase.data)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(testCase.data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Twilio WhatsApp Webhook...\n');

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      const result = await testWebhook(testCase);
      
      if (result.statusCode === 200) {
        console.log(`✅ ${testCase.name} - Success (Status: ${result.statusCode})`);
      } else {
        console.log(`❌ ${testCase.name} - Failed (Status: ${result.statusCode})`);
        console.log(`   Response: ${result.data}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} - Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('🎉 Webhook testing completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up your Twilio credentials in .env file');
  console.log('2. Configure Twilio webhook URL');
  console.log('3. Test with real WhatsApp messages');
}

runTests().catch(console.error);
