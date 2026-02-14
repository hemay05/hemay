
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Return = sequelize.define('return', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('requested','approved','rejected','refunded'), allowNull: false, defaultValue: 'requested' },
    refund_amount: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  }, {
    tableName: 'returns',
  });
  module.exports = Return;





