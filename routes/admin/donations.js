const express = require('express');
const router = express.Router();
const Donation = require('../../models/Donation');
const adminAuth = require('../../middleware/adminAuth');

router.get('/', adminAuth, async (req, res) => {
  const donations = await Donation.find();
  res.json(donations);
});

router.put('/:id', adminAuth, async (req, res) => {
  const updated = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete('/:id', adminAuth, async (req, res) => {
  await Donation.findByIdAndDelete(req.params.id);
  res.json({ message: 'Donation deleted' });
});

module.exports = router;
