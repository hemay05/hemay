const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Coupon = sequelize.define('coupon', {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING, unique: true, allowNull: false },
  type: { type: DataTypes.ENUM('percentage', 'fixed'), defaultValue: 'percentage' },
  value: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  min_order_amount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  max_discount: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  usage_limit: { type: DataTypes.INTEGER, allowNull: true },
  used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  valid_from: { type: DataTypes.DATE, allowNull: false },
  valid_until: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'coupons',
  });
module.exports = Coupon;

