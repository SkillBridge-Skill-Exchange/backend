/**
 * User Model
 * ----------
 * Represents a registered user (student or admin).
 * Passwords are hashed before storage using bcrypt.
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Name is required' },
    },
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Must be a valid email address' },
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('student', 'admin'),
    defaultValue: 'student',
  },
  college: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  year: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
}, {
  tableName: 'users',
  // Hash password before saving
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

/**
 * Instance method: Compare a candidate password with the stored hash.
 * @param {string} candidatePassword - The plain-text password to check
 * @returns {Promise<boolean>}
 */
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance method: Return user data without the password field.
 * @returns {Object}
 */
User.prototype.toSafeJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
