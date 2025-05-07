const express = require('express');
const router = express.Router();
const User = require('../../models/users');
//const bcrypt = require('bcryptjs');
//const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email });

    if (!admin || !admin.isAdmin) {
      return res.status(401).json({ message: 'Not authorized as admin' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: admin._id, isAdmin: true }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

router.get('/login', (req, res) => {
  res.render('admin/login');
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin || !(await admin.comparePassword(password))) {
    return res.render('admin/login', { error: 'Invalid credentials' });
  }

  // Store session or token logic here
  req.session.admin = admin._id;
  res.redirect('/admin/dashboard'); // or wherever your dashboard is
});
