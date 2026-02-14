const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
  const CmsPage = sequelize.define('cms_page', {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, unique: true, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  meta_title: { type: DataTypes.STRING, allowNull: true },
  meta_description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'cms_pages',
  });

module.exports = CmsPage;



