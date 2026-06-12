const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// GET notifications
router.get('/', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('notifications');
  res.json({ success: true, notifications: user.notifications.reverse() });
});

// PUT mark all read
router.put('/read', protect, async (req, res) => {
  await User.findByIdAndUpdate(req.user.id,
    { $set: { 'notifications.$[].read': true } });
  res.json({ success: true });
});

// DELETE clear all
router.delete('/', protect, async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $set: { notifications: [] } });
  res.json({ success: true });
});

module.exports = router;
