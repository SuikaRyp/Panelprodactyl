const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['whatsapp', 'telegram'],
    required: true
  },
  status: {
    type: String,
    enum: ['running', 'stopped', 'error'],
    default: 'stopped'
  },
  config: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  resources: {
    cpu: { type: Number, default: 100 },
    memory: { type: Number, default: 512 },
    storage: { type: Number, default: 1024 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastStarted: Date
});

module.exports = mongoose.model('Server', serverSchema);
