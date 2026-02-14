const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
 const Category = sequelize.define('category', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
  
    slug: { type: DataTypes.STRING(255), unique: true, allowNull: false },


    description: { type: DataTypes.TEXT, allowNull: true },
    image_url: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

    parent_id: { type: DataTypes.INTEGER, allowNull: true },
    is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    meta_title: { type: DataTypes.STRING(255), allowNull: true },
    meta_description: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'categories',
  });

module.exports = Category;


