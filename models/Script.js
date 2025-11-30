const mongoose = require('mongoose');

const scriptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['whatsapp', 'telegram'],
    required: true
  },
  code: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  variables: [{
    name: String,
    value: String,
    required: Boolean
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Script', scriptSchema);
