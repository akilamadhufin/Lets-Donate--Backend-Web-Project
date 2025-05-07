const express = require('express');
const router = express.Router();
const User = require('../../models/Users');
const Donation = require('../../models/Donations');

// GET: admin login page
router.get('/login', (req, res) => {
  res.render('admin/login');
});

// GET: admin users view
router.get('/users/view', async (req, res) => {
  const users = await User.find();
  res.render('admin/users', { users });
});

// GET: admin donations view
router.get('/donations/view', async (req, res) => {
  const donations = await Donation.find();
  res.render('admin/donations', { donations });
});

module.exports = router;
