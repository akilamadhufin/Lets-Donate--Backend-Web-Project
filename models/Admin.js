const mongoose = require('mongoose');

// Admin schema definition
const adminSchema = new mongoose.Schema({
  adminEmail: {
    type: String,
    required: true,
    unique: true
  },
  adminPassword: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'admins'
  }
});

// Create the Admin model
const Admin = mongoose.model('admins', adminSchema);



// Replace placeholders with actual credentials or values
mongoose.connect(dbURI)
  .then(() => {
    console.log('Connected to DB');
    return Admin.create({
      adminEmail: 'admin@gmail.com',
      adminPassword: 'admin@123',
      role: 'superadmin'
    });
  })
  .then((admin) => {
    console.log('Admin created:', admin);
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });
