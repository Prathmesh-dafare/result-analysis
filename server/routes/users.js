const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// GET all students (teacher/admin)
router.get('/', protect, authorize('teacher','admin'), async (req, res) => {
  const users = await User.find({ role: 'student' }).select('-password');
  res.json({ success: true, users });
});

// PUT update profile
router.put('/profile', protect, async (req, res) => {
  const { name, department, semester, avatar } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id,
    { name, department, semester, avatar }, { new: true }).select('-password');
  res.json({ success: true, user });
});

module.exports = router;
