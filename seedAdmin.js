const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');

const seedAdmin = async () => {
  
  await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'admin@123';

  const existing = await Admin.findOne({ email: adminEmail });
  if (!existing) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = new Admin({
      email: adminEmail,
      password: hashedPassword,
      isAdmin: true
    });

    await admin.save();
    console.log('✅ Admin user created.');
  } else {
    console.log('ℹ️ Admin already exists.');
  }

  mongoose.disconnect();
};

seedAdmin();

