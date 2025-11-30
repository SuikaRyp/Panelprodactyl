const express = require('express');
const auth = require('../middleware/auth');
const Server = require('../models/Server');
const router = express.Router();

// Get all servers for user
router.get('/', auth, async (req, res) => {
  try {
    const servers = await Server.find({ owner: req.user.id });
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new server
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, config } = req.body;
    
    const server = new Server({
      name,
      type,
      owner: req.user.id,
      config
    });
    
    await server.save();
    res.status(201).json(server);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
router.post('/:id/start', auth, async (req, res) => {
  try {
    const server = await Server.findOne({ _id: req.params.id, owner: req.user.id });
    if (!server) return res.status(404).json({ error: 'Server not found' });

    server.status = 'running';
    server.lastStarted = new Date();
    await server.save();

    // Emit socket event
    req.app.get('io').to(server._id.toString()).emit('server-status', {
      serverId: server._id,
      status: 'running'
    });

    res.json({ message: 'Server started successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop server
router.post('/:id/stop', auth, async (req, res) => {
  try {
    const server = await Server.findOne({ _id: req.params.id, owner: req.user.id });
    if (!server) return res.status(404).json({ error: 'Server not found' });

    server.status = 'stopped';
    await server.save();

    req.app.get('io').to(server._id.toString()).emit('server-status', {
      serverId: server._id,
      status: 'stopped'
    });

    res.json({ message: 'Server stopped successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
