# WhatsApp Expense Integration

This integration allows users to submit expenses via WhatsApp using structured message templates. The bot automatically processes these messages and creates expense records in the system.

## Features

- **Automated Processing**: Bot automatically parses WhatsApp messages and creates expense records
- **Template-Based**: Uses structured message templates for consistent data entry
- **Real-time Notifications**: Sends confirmation messages back to users
- **Admin Dashboard**: Web interface to view, approve, and manage WhatsApp expenses
- **Bot Management**: Start/stop/restart the WhatsApp bot from the web interface

## Message Templates

### Fuel Expense
```
🚗 FUEL EXPENSE
Vehicle: [License Plate]
Amount: [Amount] AED
Location: [Station Name]
Date: [YYYY-MM-DD]
```

### Maintenance Expense
```
🔧 MAINTENANCE EXPENSE
Vehicle: [License Plate]
Type: [Service Type]
Amount: [Amount] AED
Garage: [Garage Name]
Date: [YYYY-MM-DD]
```

### Other Expense
```
💰 OTHER EXPENSE
Vehicle: [License Plate]
Description: [Description]
Amount: [Amount] AED
Date: [YYYY-MM-DD]
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install whatsapp-web.js qrcode-terminal
```

### 2. Start the WhatsApp Bot
```bash
npm run whatsapp
```

### 3. Scan QR Code
- A QR code will appear in the terminal
- Scan it with your WhatsApp mobile app
- The bot will be ready once connected

### 4. Access the Web Interface
- Navigate to `/whatsapp-expenses` in the web application
- View and manage expenses submitted via WhatsApp

## API Endpoints

### Bot Management
- `GET /api/whatsapp/bot/status` - Get bot status
- `POST /api/whatsapp/bot/start` - Start the bot
- `POST /api/whatsapp/bot/stop` - Stop the bot
- `POST /api/whatsapp/bot/restart` - Restart the bot
- `POST /api/whatsapp/bot/send-test` - Send test message

### Expense Management
- `GET /api/whatsapp/expenses` - Get all WhatsApp expenses
- `GET /api/whatsapp/expenses/:id` - Get single expense
- `PATCH /api/whatsapp/expenses/:id/status` - Update expense status
- `GET /api/whatsapp/expenses/stats` - Get expense statistics
- `DELETE /api/whatsapp/expenses/:id` - Delete expense

## Usage

### For Users (WhatsApp)
1. Send a message to the bot using one of the templates above
2. The bot will automatically process the message
3. You'll receive a confirmation message with the expense ID
4. The expense will appear in the admin dashboard for approval

### For Admins (Web Interface)
1. Go to "WhatsApp Expenses" in the navigation menu
2. View all submitted expenses organized by status
3. Approve or reject expenses as needed
4. Add notes to expenses
5. Monitor bot status and restart if needed

## Bot Status

The bot can be in one of these states:
- **Stopped**: Bot is not running
- **Running**: Bot is running but not connected to WhatsApp
- **Ready**: Bot is running and connected to WhatsApp

## Troubleshooting

### Bot Not Starting
- Check if port 5000 is available
- Ensure all dependencies are installed
- Check the console for error messages

### QR Code Not Appearing
- Wait a few seconds for the bot to initialize
- Check if there are any network issues
- Try restarting the bot

### Messages Not Being Processed
- Ensure the message follows the exact template format
- Check if the bot is in "Ready" status
- Verify the vehicle and driver exist in the system

### Bot Disconnects Frequently
- Check your internet connection
- Ensure WhatsApp Web is not being used on another device
- Try restarting the bot

## Security Notes

- The bot uses WhatsApp Web.js which is against WhatsApp's Terms of Service
- This is for internal use only
- Consider using WhatsApp Business API for production use
- Keep the bot's session data secure

## File Structure

```
fleet-api/
├── services/
│   ├── whatsappService.js          # Main WhatsApp bot service
│   └── whatsappBotManager.js       # Bot management wrapper
├── controllers/
│   ├── whatsappController.js       # Expense management API
│   └── whatsappBotController.js    # Bot management API
├── routes/
│   └── whatsappRoutes.js           # API routes
├── start-whatsapp-bot.js           # Bot startup script
└── WHATSAPP_INTEGRATION.md         # This file
```

## Example Usage

1. **Start the bot**: `npm run whatsapp`
2. **Scan QR code** with your phone
3. **Send a test message**:
   ```
   🚗 FUEL EXPENSE
   Vehicle: ABC-123
   Amount: 150.50 AED
   Location: ADNOC Station
   Date: 2024-01-15
   ```
4. **Check the web interface** to see the expense
5. **Approve or reject** the expense as needed

The bot will automatically process the message and create an expense record in your system!






