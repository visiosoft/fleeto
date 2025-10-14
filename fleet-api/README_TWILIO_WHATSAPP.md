# Twilio WhatsApp Expense Management

This integration allows users to submit expenses via WhatsApp using Twilio's WhatsApp Business API. Users can send expense details through WhatsApp messages, and the system will automatically parse and save them to the database.

## Features

- 📱 **WhatsApp Integration**: Submit expenses directly through WhatsApp
- 🤖 **Smart Parsing**: Automatically parse expense details from message templates
- ✅ **Real-time Notifications**: Get confirmation messages and status updates
- 📊 **Admin Dashboard**: Manage and approve expenses through the API
- 🔒 **Secure**: All admin operations require authentication

## Quick Start

### 1. Install Dependencies

```bash
npm install twilio
```

### 2. Environment Setup

Create a `.env` file in the `fleet-api` directory with these variables:

```env
# Database Configuration
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
```

**⚠️ Important:** Never commit your `.env` file to version control. Add it to `.gitignore`.

### 3. Test the Integration

```bash
npm run test-twilio
```

### 4. Start the Server

```bash
npm start
```

## How It Works

### For Users (WhatsApp)

1. **Get Template**: Send `/expense` to receive the expense submission template
2. **Submit Expense**: Use the template format to submit expenses
3. **Get Confirmation**: Receive confirmation with expense ID
4. **Status Updates**: Get notified when expense is approved/rejected

### For Administrators (API)

1. **View Expenses**: Use API endpoints to view all submitted expenses
2. **Approve/Reject**: Update expense status to send notifications
3. **Monitor**: Track expense statistics and trends

## API Endpoints

### Webhook (Public)
- `POST /api/twilio-whatsapp/webhook` - Handles incoming WhatsApp messages

### Management (Authenticated)
- `GET /api/twilio-whatsapp/expenses` - Get all expenses
- `GET /api/twilio-whatsapp/expenses/stats` - Get statistics
- `GET /api/twilio-whatsapp/expenses/:id` - Get single expense
- `PATCH /api/twilio-whatsapp/expenses/:id/status` - Update status
- `DELETE /api/twilio-whatsapp/expenses/:id` - Delete expense
- `POST /api/twilio-whatsapp/send-test` - Send test message

## Expense Templates

### Fuel Expense
```
/expense fuel
Vehicle: ABC-123
Amount: 150.50 AED
Location: ADNOC Station
Date: 2024-01-15
```

### Maintenance Expense
```
/expense maintenance
Vehicle: XYZ-789
Type: Oil Change
Amount: 200.00 AED
Garage: Auto Care
Date: 2024-01-15
```

### Other Expense
```
/expense other
Vehicle: DEF-456
Description: Parking Fee
Amount: 25.00 AED
Date: 2024-01-15
```

## Example Usage

### 1. User submits expense via WhatsApp

User sends:
```
/expense fuel
Vehicle: ABC-123
Amount: 150.50 AED
Location: ADNOC Station
Date: 2024-01-15
```

System responds:
```
✅ Expense Added Successfully!

📋 Details:
• Type: FUEL
• Vehicle: ABC-123
• Amount: 150.50 AED
• Date: 2024-01-15

🆔 Expense ID: 507f1f77bcf86cd799439011
📊 Status: Pending Approval

Your expense has been submitted and is pending approval.
```

### 2. Admin approves expense via API

```bash
curl -X PATCH http://localhost:5000/api/twilio-whatsapp/expenses/507f1f77bcf86cd799439011/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved", "notes": "Approved by manager"}'
```

### 3. User receives approval notification

```
✅ Expense Approved!

📋 Details:
• Type: FUEL
• Amount: 150.50 AED
• Date: Mon Jan 15 2024

🆔 Expense ID: 507f1f77bcf86cd799439011

Your expense has been approved and will be processed for payment.
```

## Database Schema

Expenses are stored with the following structure:

```javascript
{
  _id: ObjectId,
  vehicleId: ObjectId,
  driverId: ObjectId,
  expenseType: String, // 'fuel', 'maintenance', 'other'
  amount: Number,
  date: Date,
  description: String,
  paymentStatus: String, // 'pending', 'approved', 'rejected', 'paid'
  paymentMethod: String, // 'cash', 'bank_transfer', etc.
  vendor: String,
  source: String, // 'whatsapp_twilio'
  whatsappNumber: String,
  rawMessage: String,
  status: String, // 'pending', 'approved', 'rejected'
  createdAt: Date,
  updatedAt: Date
}
```

## Testing

### 1. Test Message Parsing

```bash
npm run test-twilio
```

### 2. Test API Endpoints

Use the provided `test-twilio-api.http` file with your API client.

### 3. Test with Real WhatsApp

1. Set up Twilio WhatsApp sandbox
2. Configure webhook URL
3. Send test messages to your sandbox number

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Check webhook URL in Twilio Console
   - Ensure server is running and accessible
   - Check firewall settings

2. **Message parsing errors**
   - Verify message format matches templates
   - Check for typos in field names
   - Ensure required fields are present

3. **Database errors**
   - Verify MongoDB connection
   - Check if collections exist
   - Ensure proper indexes are created

4. **Authentication errors**
   - Verify JWT token is valid
   - Check token expiration
   - Ensure proper headers are sent

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development`.

## Security Considerations

1. **Webhook Security**: The webhook endpoint is public - implement rate limiting
2. **Data Validation**: All incoming data is validated before processing
3. **Authentication**: Admin endpoints require valid JWT tokens
4. **HTTPS**: Use HTTPS for webhook URLs in production

## Production Deployment

1. **Twilio Production**: Upgrade from sandbox to production WhatsApp Business API
2. **Webhook URL**: Update to your production domain
3. **Rate Limiting**: Implement rate limiting for webhook endpoint
4. **Monitoring**: Set up logging and monitoring for webhook calls
5. **Error Handling**: Implement proper error handling and retry logic

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Twilio documentation
3. Check server logs for error details
4. Test with the provided test scripts
