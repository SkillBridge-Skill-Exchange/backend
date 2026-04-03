const mongoose = require('mongoose');
const dot = require('dotenv');
const path = require('path');
dot.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Skill = require('../src/models/Skill');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB for seeding...');

    // Add some expert users
    const users = [
      { name: 'Aditya Varma', email: 'aditya@amrita.edu', password: 'password123', college: 'Amrita Vishwa Vidyapeetham', department: 'CSE', role: 'student' },
      { name: 'Snehith Reddy', email: 'snehith@iit.edu', password: 'password123', college: 'IIT Madras', department: 'AI', role: 'student' },
      { name: 'Ananya S', email: 'ananya@bits.edu', password: 'password123', college: 'BITS Pilani', department: 'ECE', role: 'student' }
    ];

    for (const u of users) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        const newUser = await User.create(u);
        console.log(`Created user: ${newUser.name}`);
        
        // Add skills for each
        const skills = [
          { skill_name: 'React.js', category: 'Frontend', proficiency_level: 'expert', type: 'offer', user_id: newUser._id },
          { skill_name: 'Node.js', category: 'Backend', proficiency_level: 'advanced', type: 'offer', user_id: newUser._id },
          { skill_name: 'Python', category: 'AI', proficiency_level: 'intermediate', type: 'request', user_id: newUser._id }
        ];
        await Skill.insertMany(skills);
      }
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
