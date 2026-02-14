
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const FreeGift = sequelize.define('free_gift', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: true },
    min_order_value: { type: DataTypes.DECIMAL(10,2), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'free_gifts',
  });
  module.exports = FreeGift;

