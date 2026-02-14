


const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Review = sequelize.define('review', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'reviews',
});

const User = require('./User');
Review.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Review;






