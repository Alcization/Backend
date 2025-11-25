const express = require('express');
const router = express.Router();

// Simple stub for user routes. Implement controllers as needed.
router.get('/', (req, res) => {
  res.json({ message: 'User routes placeholder' });
});

module.exports = router;
