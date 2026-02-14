// User.js - Updated
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Role = require("./role");

const User = sequelize.define("users", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  basePass64: { type: DataTypes.STRING, allowNull: false },
  hospital_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null }, 
  user_role_id: { type: DataTypes.INTEGER, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false, defaultValue: "user" },
  profile_image: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.STRING, allowNull: true }, 
  otp: { type: DataTypes.STRING, allowNull: true },
  user_type: { type: DataTypes.STRING, allowNull: false, defaultValue: "customer" },
  google_id: { type: DataTypes.STRING, allowNull: true, unique: true }
}, { 
  timestamps: true 
});

User.belongsTo(Role, { foreignKey: 'user_role_id' });

module.exports = User;