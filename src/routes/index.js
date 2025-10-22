const express = require('express');
const router = express.Router();
const apiRoutes = require('./apiRoutes');
const smsRoutes = require('./smsRoutes');

// API routes
router.use('/api', apiRoutes);

// SMS webhook routes
router.use('/sms', smsRoutes);

// Root route
router.get('/', (req, res) => {
  res.json({
    name: 'Pygo API',
    description: 'Send and receive ETH/PYUSD on Sepolia via SMS',
    version: '0.1.0',
  });
});

module.exports = router; 