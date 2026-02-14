// models/slider.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Slider = sequelize.define('slider', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(255), allowNull: true },
  subtitle: { type: DataTypes.STRING(255), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  image: { type: DataTypes.STRING(500), allowNull: false },
  button_text: { type: DataTypes.STRING(100), allowNull: true },
  button_url: { type: DataTypes.STRING(500), allowNull: true },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  background_color: { type: DataTypes.STRING(50), allowNull: true },
  text_color: { type: DataTypes.STRING(50), allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'sliders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Slider;