const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Simple User schema for seeding (don't need full model)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isEmailVerified: { type: Boolean, default: true },
  accountStatus: { type: String, default: 'active' },
  points: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  credits: { type: Number, default: 1000 }
});

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Create Super Admin
const createSuperAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (adminExists) {
      console.log('⚠️  Super Admin already exists!');
      console.log(`📧 Email: ${adminExists.email}`);
      console.log(`👤 Name: ${adminExists.name}`);
      console.log('\n💡 To reset password, delete this user from MongoDB and run script again.');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

    // Create admin
    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'Super Admin',
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
      accountStatus: 'active',
      credits: 10000 // More credits for admin
    });

    console.log('\n🎉 Super Admin Created Successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', process.env.ADMIN_PASSWORD);
    console.log('👤 Name:', admin.name);
    console.log('🎭 Role:', admin.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANT: Change your password after first login!');
    console.log('⚠️  Keep these credentials secure!\n');

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
  }
};

// Main function
const main = async () => {
  console.log('\n🚀 TASKFORGE Super Admin Setup\n');
  
  // Check environment variables
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error('❌ Missing environment variables!');
    console.log('\n📝 Add these to your .env file:\n');
    console.log('ADMIN_EMAIL=your-admin-email@company.com');
    console.log('ADMIN_PASSWORD=your-secure-password');
    console.log('ADMIN_NAME=Your Name (optional)\n');
    process.exit(1);
  }

  await connectDB();
  await createSuperAdmin();
  
  process.exit(0);
};

// Run
main();