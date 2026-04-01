/**
 * Database Seeder
 * ===============
 * Populates the MySQL database with random student data, skills,
 * portfolio projects, and endorsements.
 * Usage: node src/utils/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { 
  sequelize, User, Skill, PortfolioProject, Endorsement, Review 
} = require('../models');

const seedDatabase = async () => {
  try {
    // 1. Sync & Clear Database (CAREFUL: this deletes everything)
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized (FORCE: TRUE)');

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    // 2. Create Users
    const users = await User.bulkCreate([
      { 
        name: 'Alice Smith', email: 'alice@student.com', password, college: 'Global Institute of Tech', department: 'Computer Science', year: '4th Year',
        bio: 'Passionate Full-Stack Developer specializing in React and Node.js. Love building tools that help students collaborate.',
        github_url: 'https://github.com/alice', linkedin_url: 'https://linkedin.com/in/alice'
      },
      { 
        name: 'Bob Johnson', email: 'bob@student.com', password, college: 'National Engineering College', department: 'Information Tech', year: '3rd Year',
        bio: 'Data Science enthusiast. I enjoy working with Python and finding insights from large datasets.',
        github_url: 'https://github.com/bob'
      },
      { 
        name: 'Charlie Davis', email: 'charlie@student.com', password, college: 'Tech University', department: 'Mechanical Eng', year: '2nd Year',
        bio: 'Mechanical engineering student with a deep interest in CAD and 3D modeling.'
      },
      { 
        name: 'Diana Prince', email: 'diana@student.com', password, college: 'Arts & Design School', department: 'UI/UX Design', year: '4th Year',
        bio: 'UI/UX Designer focused on creating intuitive and accessible user experiences.',
        linkedin_url: 'https://linkedin.com/in/diana'
      },
      { name: 'Ethan Hunt', email: 'ethan@student.com', password, college: 'Science Academy', department: 'Data Science', year: '3rd Year', bio: 'AI researcher and data analyst.' },
      { name: 'Fiona Gallagher', email: 'fiona@student.com', password, college: 'Global Institute of Tech', department: 'Computer Science', year: '3rd Year', bio: 'Software engineering student interested in blockchain.' },
      { name: 'George Miller', email: 'george@student.com', password, college: 'National Engineering College', department: 'Electronics', year: '4th Year', bio: 'Hardware hacker and IoT enthusiast.' },
      { name: 'Hannah Abbott', email: 'hannah@student.com', password, college: 'Tech University', department: 'Software Eng', year: '1st Year', bio: 'Learning the ropes of software development.' },
      { name: 'Ian Wright', email: 'ian@student.com', password, college: 'Science Academy', department: 'AI & ML', year: '4th Year', bio: 'ML Engineer in the making.' },
      { name: 'Julia Roberts', email: 'julia@student.com', password, college: 'Arts & Design School', department: 'Graphic Design', year: '3rd Year', bio: 'Creative designer with a panache for digital art.' },
    ]);
    console.log('👥 10 Users created');

    // 3. Create Skills
    const skills = await Skill.bulkCreate([
      { user_id: 1, skill_name: 'React.js', category: 'Development', proficiency_level: 'expert', type: 'offer', description: 'Experienced in hooks and state management.' },
      { user_id: 1, skill_name: 'Node.js', category: 'Development', proficiency_level: 'intermediate', type: 'offer', description: 'Building RESTful APIs with Express.' },
      { user_id: 1, skill_name: 'Python', category: 'Data Science', proficiency_level: 'beginner', type: 'request', description: 'Want to learn Pandas and NumPy.' },

      { user_id: 2, skill_name: 'Python', category: 'Data Science', proficiency_level: 'advanced', type: 'offer', description: 'Data analysis and scripting.' },
      { user_id: 2, skill_name: 'Machine Learning', category: 'AI', proficiency_level: 'intermediate', type: 'offer', description: 'Scikit-learn and basic neural networks.' },
      { user_id: 2, skill_name: 'React.js', category: 'Development', proficiency_level: 'beginner', type: 'request', description: 'Learning frontend development.' },

      { user_id: 3, skill_name: 'CAD Design', category: 'Mechanical', proficiency_level: 'expert', type: 'offer', description: 'SolidWorks and AutoCAD pro.' },
      { user_id: 3, skill_name: 'C++', category: 'Development', proficiency_level: 'intermediate', type: 'offer', description: 'Competitive programming.' },

      { user_id: 4, skill_name: 'Figma', category: 'Design', proficiency_level: 'expert', type: 'offer', description: 'Master of prototyping and style guides.' },
      { user_id: 4, skill_name: 'UI/UX Design', category: 'Design', proficiency_level: 'advanced', type: 'offer', description: 'Focused on user behavior and research.' },
      { user_id: 4, skill_name: 'HTML/CSS', category: 'Development', proficiency_level: 'beginner', type: 'request', description: 'Want to build my designs.' },

      { user_id: 5, skill_name: 'Data Analysis', category: 'Data Science', proficiency_level: 'expert', type: 'offer', description: 'Deep insight into big data.' },
      { user_id: 5, skill_name: 'PostgreSQL', category: 'Database', proficiency_level: 'advanced', type: 'offer', description: 'Query optimization.' },

      { user_id: 6, skill_name: 'JavaScript', category: 'Development', proficiency_level: 'expert', type: 'offer', description: 'ES6+ and functional programming.' },
      { user_id: 7, skill_name: 'Arduino', category: 'Electronics', proficiency_level: 'advanced', type: 'offer' },
      { user_id: 8, skill_name: 'Java', category: 'Development', proficiency_level: 'intermediate', type: 'offer' },
      { user_id: 9, skill_name: 'TensorFlow', category: 'AI', proficiency_level: 'advanced', type: 'offer' },
      { user_id: 10, skill_name: 'Photoshop', category: 'Design', proficiency_level: 'expert', type: 'offer' },
    ]);
    console.log('⚡ Skills populated');

    // 4. Create Portfolio Projects
    await PortfolioProject.bulkCreate([
      { user_id: 1, title: 'StudyBuddy App', description: 'A collaboration platform built with React and Node.', link: 'https://github.com' },
      { user_id: 4, title: 'Zen UI Kit', description: 'A minimalist UI kit for design systems.', link: 'https://behance.net' },
      { user_id: 5, title: 'Housing Market Analysis', description: 'Predicting prices with Python ML.', link: 'https://kaggle.com' },
    ]);
    console.log('📁 Portfolio projects seeded');

    // 5. Create Endorsements
    await Endorsement.bulkCreate([
      { skill_id: 1, endorser_id: 2, comment: 'Amazing React skills, helped me a lot!' },
      { skill_id: 1, endorser_id: 4, comment: 'Very clean code.' },
      { skill_id: 4, endorser_id: 1, comment: 'Alice knows her Python stuff!' },
      { skill_id: 9, endorser_id: 1, comment: 'The best designer in campus.' },
    ]);
    console.log('⭐ Endorsements seeded');

    // 6. Create Reviews
    await Review.bulkCreate([
      { reviewer_id: 2, reviewed_user_id: 1, rating: 5, comment: 'Excellent collaborator! Very knowledgeable in React.' },
      { reviewer_id: 1, reviewed_user_id: 4, rating: 5, comment: 'Diana designed an incredible landing page for our project.' },
    ]);
    console.log('💬 Reviews seeded');

    console.log('\n🌟 DATABASE SEEDING COMPLETED SUCCESSFULLY 🌟');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
