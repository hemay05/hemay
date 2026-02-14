const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Brand = sequelize.define('brand', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  logo: { type: DataTypes.STRING(500), allowNull: true },
  is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  meta_title: { type: DataTypes.STRING(255), allowNull: true },
  meta_description: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'brands',
  timestamps: true
});

module.exports = Brand;