# Twilio WhatsApp Integration Setup

This document explains how to set up Twilio WhatsApp integration for expense management.

## Prerequisites

1. Twilio Account (sign up at https://www.twilio.com)
2. WhatsApp Business Account
3. Twilio WhatsApp Sandbox (for testing) or Production WhatsApp Business API

## Environment Variables

Add these environment variables to your `.env` file:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_NUMBER=process.env.TWILIO_WHATSAPP_NUMBER

# WhatsApp Webhook URL (for production)
WHATSAPP_WEBHOOK_URL=https://yourdomain.com/api/twilio-whatsapp/webhook
```

## Setup Steps

### 1. Twilio Console Setup

1. Log in to your Twilio Console
2. Go to Messaging > Try it out > Send a WhatsApp message
3. Follow the instructions to set up WhatsApp Sandbox
4. Note down your sandbox number (e.g., +14155238886)

### 2. Webhook Configuration

1. In Twilio Console, go to Messaging > Settings > WhatsApp sandbox settings
2. Set the webhook URL to: `https://yourdomain.com/api/twilio-whatsapp/webhook`
3. Set HTTP method to POST

### 3. Production Setup (Optional)

For production, you'll need:
1. WhatsApp Business Account verification
2. Twilio WhatsApp Business API approval
3. Update webhook URL to your production domain

## API Endpoints

### Webhook Endpoint
- **POST** `/api/twilio-whatsapp/webhook` - Handles incoming WhatsApp messages

### Management Endpoints (Requires Authentication)
- **GET** `/api/twilio-whatsapp/expenses` - Get all expenses
- **GET** `/api/twilio-whatsapp/expenses/stats` - Get expense statistics
- **GET** `/api/twilio-whatsapp/expenses/:id` - Get single expense
- **PATCH** `/api/twilio-whatsapp/expenses/:id/status` - Update expense status
- **DELETE** `/api/twilio-whatsapp/expenses/:id` - Delete expense
- **POST** `/api/twilio-whatsapp/send-test` - Send test message

## Usage

### For Users (WhatsApp)

1. Send `/expense` to get the expense template
2. Send `/help` for help information
3. Submit expenses using the template format:

```
/expense fuel
Vehicle: ABC-123
Amount: 150.50 AED
Location: ADNOC Station
Date: 2024-01-15
```

### For Administrators (API)

1. Use the management endpoints to view and manage expenses
2. Approve/reject expenses to send notifications to users
3. Monitor expense statistics and trends

## Expense Templates

### Fuel Expense
```
/expense fuel
Vehicle: [License Plate]
Amount: [Amount] AED
Location: [Station Name]
Date: [YYYY-MM-DD]
```

### Maintenance Expense
```
/expense maintenance
Vehicle: [License Plate]
Type: [Service Type]
Amount: [Amount] AED
Garage: [Garage Name]
Date: [YYYY-MM-DD]
```

### Other Expense
```
/expense other
Vehicle: [License Plate]
Description: [Description]
Amount: [Amount] AED
Date: [YYYY-MM-DD]
```

## Testing

1. Start your server: `npm start`
2. Send a test message using the Twilio Console
3. Check the webhook logs for incoming messages
4. Use the test endpoint to send messages programmatically

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**: Check webhook URL configuration in Twilio Console
2. **Authentication errors**: Verify Twilio credentials in environment variables
3. **Message parsing errors**: Check message format matches the expected templates
4. **Database errors**: Ensure MongoDB connection is working and collections exist

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Security Notes

1. The webhook endpoint is public - implement rate limiting in production
2. Validate all incoming data from Twilio
3. Use HTTPS for webhook URLs in production
4. Regularly rotate Twilio auth tokens
