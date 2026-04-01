/**
 * Seed Data Script
 * =================
 * Populates the database with sample data for development/testing.
 *
 * Run: npm run seed
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { sequelize, User, Skill, Request, Review } = require('../models');

const seedData = async () => {
  try {
    // Connect and sync
    await sequelize.authenticate();
    console.log('✅ Database connected for seeding.');

    // Force sync (drops and re-creates all tables) — ONLY for seeding
    await sequelize.sync({ force: true });
    console.log('✅ Tables re-created.');

    // ==========================================
    // 1. Create Users
    // ==========================================
    const users = await User.bulkCreate([
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'password123',
        role: 'student',
        college: 'MIT',
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password123',
        role: 'student',
        college: 'Stanford',
      },
      {
        name: 'Charlie Wilson',
        email: 'charlie@example.com',
        password: 'password123',
        role: 'student',
        college: 'MIT',
      },
      {
        name: 'Diana Ross',
        email: 'diana@example.com',
        password: 'password123',
        role: 'admin',
        college: 'Harvard',
      },
    ], { individualHooks: true }); // individualHooks ensures bcrypt hook runs

    console.log(`✅ Created ${users.length} users.`);

    // ==========================================
    // 2. Create Skills
    // ==========================================
    const skills = await Skill.bulkCreate([
      {
        user_id: users[0].id,
        skill_name: 'JavaScript',
        category: 'Programming',
        proficiency_level: 'advanced',
        description: 'Full-stack JavaScript development with React and Node.js',
      },
      {
        user_id: users[0].id,
        skill_name: 'UI/UX Design',
        category: 'Design',
        proficiency_level: 'intermediate',
        description: 'Figma, wireframing, user research',
      },
      {
        user_id: users[1].id,
        skill_name: 'Python',
        category: 'Programming',
        proficiency_level: 'expert',
        description: 'Data science with pandas, numpy, scikit-learn',
      },
      {
        user_id: users[1].id,
        skill_name: 'Machine Learning',
        category: 'AI/ML',
        proficiency_level: 'advanced',
        description: 'TensorFlow, PyTorch, model training and deployment',
      },
      {
        user_id: users[2].id,
        skill_name: 'JavaScript',
        category: 'Programming',
        proficiency_level: 'intermediate',
        description: 'Frontend development with React',
      },
      {
        user_id: users[2].id,
        skill_name: 'Graphic Design',
        category: 'Design',
        proficiency_level: 'advanced',
        description: 'Adobe Photoshop, Illustrator, brand identity',
      },
      {
        user_id: users[3].id,
        skill_name: 'Project Management',
        category: 'Management',
        proficiency_level: 'expert',
        description: 'Agile, Scrum, team leadership',
      },
      {
        user_id: users[3].id,
        skill_name: 'Python',
        category: 'Programming',
        proficiency_level: 'beginner',
        description: 'Learning Python for automation',
      },
    ]);

    console.log(`✅ Created ${skills.length} skills.`);

    // ==========================================
    // 3. Create Requests
    // ==========================================
    const requests = await Request.bulkCreate([
      {
        requester_id: users[0].id,
        skill_id: skills[2].id, // Alice wants Bob's Python
        message: 'Hi Bob! I would love to learn Python from you. I can teach you JavaScript in return!',
        status: 'pending',
      },
      {
        requester_id: users[2].id,
        skill_id: skills[0].id, // Charlie wants Alice's JavaScript
        message: 'Hey Alice, can you help me level up my JS skills?',
        status: 'accepted',
      },
      {
        requester_id: users[1].id,
        skill_id: skills[5].id, // Bob wants Charlie's Graphic Design
        message: 'I need help designing my portfolio. Can we exchange skills?',
        status: 'pending',
      },
    ]);

    console.log(`✅ Created ${requests.length} requests.`);

    // ==========================================
    // 4. Create Reviews
    // ==========================================
    const reviews = await Review.bulkCreate([
      {
        reviewer_id: users[2].id,
        reviewed_user_id: users[0].id,
        rating: 5,
        comment: 'Alice is an amazing JavaScript tutor! Very patient and clear.',
      },
      {
        reviewer_id: users[0].id,
        reviewed_user_id: users[2].id,
        rating: 4,
        comment: 'Charlie is a fast learner with great design sense.',
      },
    ]);

    console.log(`✅ Created ${reviews.length} reviews.`);

    console.log('\n🎉 Seed data loaded successfully!');
    console.log('\n📧 Test Credentials:');
    console.log('   Email: alice@example.com | Password: password123');
    console.log('   Email: bob@example.com   | Password: password123');
    console.log('   Email: charlie@example.com | Password: password123');
    console.log('   Email: diana@example.com | Password: password123 (admin)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedData();
