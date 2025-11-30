const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const auth = require('../middleware/auth');
const router = express.Router();

const whatsappClients = new Map();

router.post('/initialize', auth, async (req, res) => {
  try {
    const { serverId } = req.body;
    
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: serverId }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    client.initialize();

    client.on('qr', (qr) => {
      req.app.get('io').to(serverId).emit('whatsapp-qr', { qr, serverId });
    });

    client.on('ready', () => {
      req.app.get('io').to(serverId).emit('whatsapp-ready', { serverId });
      whatsappClients.set(serverId, client);
    });

    client.on('disconnected', () => {
      req.app.get('io').to(serverId).emit('whatsapp-disconnected', { serverId });
      whatsappClients.delete(serverId);
    });

    res.json({ message: 'WhatsApp client initializing' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/send-message', auth, async (req, res) => {
  try {
    const { serverId, number, message } = req.body;
    const client = whatsappClients.get(serverId);

    if (!client) {
      return res.status(400).json({ error: 'WhatsApp client not ready' });
    }

    const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
    await client.sendMessage(chatId, message);

    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
