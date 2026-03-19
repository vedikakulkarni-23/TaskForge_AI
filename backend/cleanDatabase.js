const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
};

// Define schemas
const userSchema = new mongoose.Schema({}, { strict: false });
const teamSchema = new mongoose.Schema({}, { strict: false });
const taskSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema);
const Team = mongoose.model('Team', teamSchema);
const Task = mongoose.model('Task', taskSchema);

// Clean database
const cleanDatabase = async () => {
  try {
    console.log('\n🗑️  CLEANING DATABASE...\n');

    // Count before deletion
    const userCount = await User.countDocuments();
    const teamCount = await Team.countDocuments();
    const taskCount = await Task.countDocuments();

    console.log('📊 Current Data:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Teams: ${teamCount}`);
    console.log(`   Tasks: ${taskCount}\n`);

    // Delete all data
    const deletedUsers = await User.deleteMany({});
    const deletedTeams = await Team.deleteMany({});
    const deletedTasks = await Task.deleteMany({});

    console.log('✅ Deleted:');
    console.log(`   ${deletedUsers.deletedCount} users`);
    console.log(`   ${deletedTeams.deletedCount} teams`);
    console.log(`   ${deletedTasks.deletedCount} tasks\n`);

    console.log('🎉 Database cleaned successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANT: Run this next:');
    console.log('   node quickAdminSetup.js');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await cleanDatabase();
  process.exit(0);
};

main();