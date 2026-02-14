const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Product = require("./product");

const Wishlist = sequelize.define('wishlist', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'wishlist',
});

Wishlist.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = Wishlist;