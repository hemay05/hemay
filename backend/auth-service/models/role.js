// role.js - Updated
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Role = sequelize.define('user_role', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_role: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  user_role_keyword: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'user_role',
  timestamps: false,
});

// Method to ensure customer role exists
Role.ensureCustomerRole = async function() {
  try {
    const customerRole = await this.findOne({
      where: { user_role_keyword: 'customer' }
    });
    
    if (!customerRole) {
      return await this.create({
        user_role: 'Customer',
        user_role_keyword: 'customer',
        user_type: 'customer',
        status: 1
      });
    }
    
    return customerRole;
  } catch (error) {
    throw error;
  }
};

module.exports = Role;