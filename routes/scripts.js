const express = require('express');
const auth = require('../middleware/auth');
const Script = require('../models/Script');
const router = express.Router();

// Get all scripts for user
router.get('/', auth, async (req, res) => {
  try {
    const scripts = await Script.find({ owner: req.user.id });
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new script
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, type, code, variables } = req.body;
    
    const script = new Script({
      name,
      description,
      type,
      code,
      variables,
      owner: req.user.id
    });
    
    await script.save();
    res.status(201).json(script);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Execute script
router.post('/:id/execute', auth, async (req, res) => {
  try {
    const script = await Script.findOne({ _id: req.params.id, owner: req.user.id });
    if (!script) return res.status(404).json({ error: 'Script not found' });

    const { serverId, variables } = req.body;
    
    // Execute script based on type
    const result = await executeScript(script, serverId, variables);
    
    res.json({ message: 'Script executed', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function executeScript(script, serverId, variables) {
  // Implement script execution logic based on script type
  // This is a simplified example
  try {
    const func = new Function('serverId', 'variables', script.code);
    return await func(serverId, variables);
  } catch (error) {
    throw new Error(`Script execution error: ${error.message}`);
  }
}

module.exports = router;
