const express = require('express');
const router = express.Router();
const User = require('../../models/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('Form data:', req.body); // ✅ Check incoming data

  const admin = await Admin.findOne({ adminEmail: email });
  if (!admin) {
    console.log('Admin not found');
    return res.render('admin/login', { error: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, admin.adminPassword);
  console.log('Password match:', isMatch); // ✅ Check if password comparison works

  if (!isMatch) {
    return res.render('admin/login', { error: 'Invalid credentials' });
  }

  req.session.admin = admin._id;
  res.redirect('/admin/dashboard');
});