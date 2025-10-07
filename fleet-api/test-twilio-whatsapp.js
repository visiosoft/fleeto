const TwilioWhatsAppService = require('./services/twilioWhatsAppService');

// Test the Twilio WhatsApp service
async function testTwilioWhatsApp() {
  console.log('🧪 Testing Twilio WhatsApp Service...\n');

  // Check environment variables
  const requiredEnvVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these variables in your .env file');
    return;
  }

  console.log('✅ Environment variables configured');

  // Initialize service
  const whatsappService = new TwilioWhatsAppService();
  console.log('✅ Twilio WhatsApp service initialized');

  // Test message parsing
  console.log('\n📝 Testing message parsing...');
  
  const testMessages = [
    '/expense fuel\nVehicle: ABC-123\nAmount: 150.50 AED\nLocation: ADNOC Station\nDate: 2024-01-15',
    '/expense maintenance\nVehicle: XYZ-789\nType: Oil Change\nAmount: 200.00 AED\nGarage: Auto Care\nDate: 2024-01-15',
    '/expense other\nVehicle: DEF-456\nDescription: Parking Fee\nAmount: 25.00 AED\nDate: 2024-01-15',
    'invalid message format',
    '/expense'
  ];

  testMessages.forEach((message, index) => {
    console.log(`\nTest ${index + 1}:`);
    console.log(`Message: ${message}`);
    
    const parsed = whatsappService.parseExpenseMessage(message);
    if (parsed) {
      console.log('✅ Parsed successfully:', parsed);
    } else {
      console.log('❌ Failed to parse (expected for invalid messages)');
    }
  });

  console.log('\n🎉 Twilio WhatsApp service test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up your Twilio WhatsApp sandbox');
  console.log('2. Configure webhook URL in Twilio Console');
  console.log('3. Test with real WhatsApp messages');
  console.log('4. Check the TWILIO_WHATSAPP_SETUP.md file for detailed instructions');
}

// Run the test
testTwilioWhatsApp().catch(console.error);
