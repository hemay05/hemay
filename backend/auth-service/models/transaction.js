
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Transaction = sequelize.define('transaction', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    order_id: { type: DataTypes.INTEGER, allowNull: true },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0.00 },
    payment_gateway: { type: DataTypes.STRING(50), allowNull: true },
    payment_status: { type: DataTypes.ENUM('success','failed','refund'), allowNull: false, defaultValue: 'success' },
    gateway_response: { type: DataTypes.JSONB, allowNull: true },
  }, {
    tableName: 'transactions',
  });
  module.exports = Transaction;







