/**
 * Database Seeder (MongoDB)
 * =========================
 * Populates MongoDB with random student data, skills,
 * portfolio projects, and endorsements.
 * Usage: node src/utils/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const {
  User, Skill, PortfolioProject, Endorsement, Review
} = require('../models');
const connectDB = require('../config/db');

const seedDatabase = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Clear Database
    console.log('🔄 Clearing existing data...');
    await User.deleteMany({});
    await Skill.deleteMany({});
    await PortfolioProject.deleteMany({});
    await Endorsement.deleteMany({});
    await Review.deleteMany({});
    console.log('✅ Database cleared');

    // 3. Create Users
    const usersData = [
      { 
        name: 'Harini N', email: 'harinin006@gmail.com', password: 'harini05', college: 'Amrita Vishwa Vidyapeetham', department: 'Engineering', year: '4th Year',
        bio: 'Platform Creator & Developer.',
        github_url: 'https://github.com/harini', linkedin_url: 'https://linkedin.com/in/harini'
      },
      { 
        name: 'Alice Smith', email: 'alice@student.com', password: 'password123', college: 'Global Institute of Tech', department: 'Computer Science', year: '4th Year',
        bio: 'Passionate Full-Stack Developer specializing in React and Node.js.',
        github_url: 'https://github.com/alice', linkedin_url: 'https://linkedin.com/in/alice'
      },
      { 
        name: 'Bob Johnson', email: 'bob@student.com', password: 'password123', college: 'National Engineering College', department: 'Information Tech', year: '3rd Year',
        bio: 'Data Science enthusiast. I enjoy working with Python.',
        github_url: 'https://github.com/bob'
      },
      { 
        name: 'Charlie Davis', email: 'charlie@student.com', password: 'password123', college: 'Tech University', department: 'Mechanical Eng', year: '2nd Year',
        bio: 'Mechanical engineering student.'
      },
      { 
        name: 'Diana Prince', email: 'diana@student.com', password: 'password123', college: 'Arts & Design School', department: 'UI/UX Design', year: '4th Year',
        bio: 'UI/UX Designer.',
        linkedin_url: 'https://linkedin.com/in/diana'
      },
    ];

    const users = await Promise.all(usersData.map(userData => User.create(userData)));
    console.log(`👥 ${users.length} Users created (with hashed passwords)`);

    const u1 = users[0]._id;
    const u2 = users[1]._id;
    const u3 = users[2]._id;
    const u4 = users[3]._id;

    // 4. Create Skills
    const skills = await Skill.insertMany([
      { user_id: u1, skill_name: 'React.js', category: 'Development', proficiency_level: 'expert', type: 'offer', description: 'Experienced in hooks.' },
      { user_id: u1, skill_name: 'Node.js', category: 'Development', proficiency_level: 'intermediate', type: 'offer', description: 'RESTful APIs.' },
      { user_id: u1, skill_name: 'Python', category: 'Data Science', proficiency_level: 'beginner', type: 'request' },

      { user_id: u2, skill_name: 'Python', category: 'Data Science', proficiency_level: 'advanced', type: 'offer' },
      { user_id: u2, skill_name: 'Machine Learning', category: 'AI', proficiency_level: 'intermediate', type: 'offer' },

      { user_id: u3, skill_name: 'CAD Design', category: 'Mechanical', proficiency_level: 'expert', type: 'offer' },
      { user_id: u4, skill_name: 'Figma', category: 'Design', proficiency_level: 'expert', type: 'offer' },
    ]);
    console.log('⚡ Skills populated');

    // 5. Create Portfolio Projects
    await PortfolioProject.insertMany([
      { user_id: u1, title: 'StudyBuddy App', description: 'A collaboration platform.', github_link: 'https://github.com' },
      { user_id: u4, title: 'Zen UI Kit', description: 'A minimalist UI kit.', project_link: 'https://behance.net' },
    ]);
    console.log('📁 Portfolio projects seeded');

    // 6. Create Endorsements
    await Endorsement.insertMany([
      { skill_id: skills[0]._id, endorser_id: u2, comment: 'Amazing React skills!' },
      { skill_id: skills[0]._id, endorser_id: u4, comment: 'Very clean code.' },
    ]);
    console.log('⭐ Endorsements seeded');

    // 7. Create Reviews
    await Review.insertMany([
      { reviewer_id: u2, reviewed_user_id: u1, rating: 5, comment: 'Excellent collaborator!' },
      { reviewer_id: u1, reviewed_user_id: u4, rating: 5, comment: 'Diana designed an incredible page.' },
    ]);
    console.log('💬 Reviews seeded');

    console.log('\n🌟 DATABASE SEEDING COMPLETED SUCCESSFULLY 🌟');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
