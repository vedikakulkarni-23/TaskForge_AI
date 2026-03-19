const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const email = 'vedikaakulkarni023@gmail.com';
    const result = await User.deleteOne({ email });
    
    console.log(`✅ Deleted user: ${email}`);
    console.log('Result:', result);
    process.exit(0);
  });