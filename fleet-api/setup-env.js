#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables for Twilio WhatsApp integration...\n');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. Please update it manually with your Twilio credentials.');
  console.log('Required variables:');
  console.log('  - TWILIO_ACCOUNT_SID');
  console.log('  - TWILIO_AUTH_TOKEN');
  console.log('  - TWILIO_WHATSAPP_NUMBER');
  process.exit(0);
}

// Create .env.example if it doesn't exist
const envExampleContent = `# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_NUMBER=process.env.TWILIO_WHATSAPP_NUMBER

# WhatsApp Webhook URL (for production)
WHATSAPP_WEBHOOK_URL=https://yourdomain.com/api/twilio-whatsapp/webhook
`;

if (!fs.existsSync(envExamplePath)) {
  fs.writeFileSync(envExamplePath, envExampleContent);
  console.log('✅ Created .env.example file');
}

// Create .env file
fs.writeFileSync(envPath, envExampleContent);
console.log('✅ Created .env file with template values');
console.log('\n📝 Next steps:');
console.log('1. Update .env file with your actual Twilio credentials');
console.log('2. Get your credentials from: https://console.twilio.com/');
console.log('3. Run: npm run test-twilio');
console.log('\n⚠️  Remember: Never commit .env file to version control!');
