require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  adminEmail: {
    type: String,
    required: true,
    unique: true,
  },
  adminPassword: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'admins',
  },
});

// Method to compare passwords
adminSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.adminPassword);
};

const Admin = mongoose.model('admins', adminSchema);

// Optional: Create default admin if this file is run directly
if (require.main === module) {
  const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Donate';
  mongoose
    .connect(dbURI)
    .then(async () => {
      console.log('Connected to DB');

      const hashedPassword = await bcrypt.hash('admin@123', 10);

      const existing = await Admin.findOne({ adminEmail: 'admin@gmail.com' });
      if (!existing) {
        const admin = await Admin.create({
          adminEmail: 'admin@gmail.com',
          adminPassword: hashedPassword,
          role: 'superadmin',
        });
        console.log('Admin created:', admin);
      } else {
        console.log('Admin already exists');
      }

      mongoose.disconnect();
    })
    .catch((err) => {
      console.error('Error:', err);
      mongoose.disconnect();
    });
}

module.exports = Admin;
