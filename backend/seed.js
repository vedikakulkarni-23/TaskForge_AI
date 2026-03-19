const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Team = require('./models/Team');
const Task = require('./models/Task');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Team.deleteMany({});
    await Task.deleteMany({});

    console.log('Cleared existing data');

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@taskforge.com',
      password: 'admin123',
      role: 'admin',
      credits: 1000
    });

    console.log('Admin created');

    // Create Team Leaders
    const teamLeader1 = await User.create({
      name: 'John Smith',
      email: 'john@taskforge.com',
      password: 'password123',
      role: 'teamleader',
      credits: 20
    });

    const teamLeader2 = await User.create({
      name: 'Sarah Johnson',
      email: 'sarah@taskforge.com',
      password: 'password123',
      role: 'teamleader',
      credits: 20
    });

    console.log('Team Leaders created');

    // Create Members
    const member1 = await User.create({
      name: 'Alice Williams',
      email: 'alice@taskforge.com',
      password: 'password123',
      role: 'member',
      credits: 15,
      points: 85
    });

    const member2 = await User.create({
      name: 'Bob Davis',
      email: 'bob@taskforge.com',
      password: 'password123',
      role: 'member',
      credits: 15,
      points: 120
    });

    const member3 = await User.create({
      name: 'Charlie Brown',
      email: 'charlie@taskforge.com',
      password: 'password123',
      role: 'member',
      credits: 15,
      points: 65
    });

    const member4 = await User.create({
      name: 'Diana Prince',
      email: 'diana@taskforge.com',
      password: 'password123',
      role: 'member',
      credits: 15,
      points: 180
    });

    const member5 = await User.create({
      name: 'Eve Martinez',
      email: 'eve@taskforge.com',
      password: 'password123',
      role: 'member',
      credits: 15,
      points: 95
    });

    console.log('Members created');

    // Create Teams
    const team1 = await Team.create({
      name: 'Development Team',
      leaderId: teamLeader1._id,
      memberIds: [member1._id, member2._id, member3._id]
    });

    const team2 = await Team.create({
      name: 'Marketing Team',
      leaderId: teamLeader2._id,
      memberIds: [member4._id, member5._id]
    });

    console.log('Teams created');

    // Update users with teamIds
    await User.findByIdAndUpdate(teamLeader1._id, { teamId: team1._id });
    await User.findByIdAndUpdate(teamLeader2._id, { teamId: team2._id });
    await User.findByIdAndUpdate(member1._id, { teamId: team1._id });
    await User.findByIdAndUpdate(member2._id, { teamId: team1._id });
    await User.findByIdAndUpdate(member3._id, { teamId: team1._id });
    await User.findByIdAndUpdate(member4._id, { teamId: team2._id });
    await User.findByIdAndUpdate(member5._id, { teamId: team2._id });

    // Update badges for members
    const members = [member1, member2, member3, member4, member5];
    for (let member of members) {
      const m = await User.findById(member._id);
      m.updateBadges();
      await m.save();
    }

    console.log('Team assignments updated');

    // Create sample tasks
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    await Task.create([
      {
        title: 'Implement User Authentication',
        description: 'Set up JWT-based authentication system',
        assignedTo: member1._id,
        assignedBy: teamLeader1._id,
        deadline: nextWeek,
        status: 'inprogress',
        priority: 'high'
      },
      {
        title: 'Design Database Schema',
        description: 'Create MongoDB schemas for all entities',
        assignedTo: member2._id,
        assignedBy: teamLeader1._id,
        deadline: tomorrow,
        status: 'done',
        priority: 'high',
        completedAt: new Date()
      },
      {
        title: 'Write API Documentation',
        description: 'Document all REST API endpoints',
        assignedTo: member3._id,
        assignedBy: teamLeader1._id,
        deadline: nextWeek,
        status: 'todo',
        priority: 'medium'
      },
      {
        title: 'Create Social Media Campaign',
        description: 'Design and schedule social media posts',
        assignedTo: member4._id,
        assignedBy: teamLeader2._id,
        deadline: tomorrow,
        status: 'done',
        priority: 'high',
        completedAt: new Date()
      },
      {
        title: 'Market Research Analysis',
        description: 'Analyze competitor marketing strategies',
        assignedTo: member5._id,
        assignedBy: teamLeader2._id,
        deadline: nextWeek,
        status: 'inprogress',
        priority: 'medium'
      }
    ]);

    console.log('Sample tasks created');

    console.log('\n=== SEED DATA CREATED SUCCESSFULLY ===');
    console.log('\nLogin Credentials:');
    console.log('-------------------');
    console.log('ADMIN:');
    console.log('  Email: admin@taskforge.com');
    console.log('  Password: admin123');
    console.log('\nTEAM LEADERS:');
    console.log('  Email: john@taskforge.com | Password: password123');
    console.log('  Email: sarah@taskforge.com | Password: password123');
    console.log('\nMEMBERS:');
    console.log('  Email: alice@taskforge.com | Password: password123');
    console.log('  Email: bob@taskforge.com | Password: password123');
    console.log('  Email: charlie@taskforge.com | Password: password123');
    console.log('  Email: diana@taskforge.com | Password: password123');
    console.log('  Email: eve@taskforge.com | Password: password123');

    process.exit(0);

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();