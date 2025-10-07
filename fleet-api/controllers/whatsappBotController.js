const botManager = require('../services/whatsappBotManager');

// Get bot status
const getBotStatus = async (req, res) => {
  try {
    const status = botManager.getStatus();
    res.json({
      status: 'success',
      data: status
    });
  } catch (error) {
    console.error('Error getting bot status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get bot status'
    });
  }
};

// Start bot
const startBot = async (req, res) => {
  try {
    await botManager.start();
    res.json({
      status: 'success',
      message: 'WhatsApp bot started successfully'
    });
  } catch (error) {
    console.error('Error starting bot:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to start WhatsApp bot'
    });
  }
};

// Stop bot
const stopBot = async (req, res) => {
  try {
    await botManager.stop();
    res.json({
      status: 'success',
      message: 'WhatsApp bot stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping bot:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to stop WhatsApp bot'
    });
  }
};

// Restart bot
const restartBot = async (req, res) => {
  try {
    await botManager.restart();
    res.json({
      status: 'success',
      message: 'WhatsApp bot restarted successfully'
    });
  } catch (error) {
    console.error('Error restarting bot:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to restart WhatsApp bot'
    });
  }
};

// Send test message
const sendTestMessage = async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number and message are required'
      });
    }

    await botManager.sendMessage(to, message);
    res.json({
      status: 'success',
      message: 'Test message sent successfully'
    });
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send test message'
    });
  }
};

module.exports = {
  getBotStatus,
  startBot,
  stopBot,
  restartBot,
  sendTestMessage
};



