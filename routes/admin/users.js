const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const adminAuth = require('../../middleware/adminAuth');

router.get('/', adminAuth, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

router.put('/:id', adminAuth, async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete('/:id', adminAuth, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
});

module.exports = router;
