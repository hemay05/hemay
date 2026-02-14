const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Referral = sequelize.define('referral', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    referrer_id: { type: DataTypes.INTEGER, allowNull: false },
    referred_id: { type: DataTypes.INTEGER, allowNull: false },
    reward_points: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    status: { type: DataTypes.ENUM('pending','credited','revoked'), allowNull: false, defaultValue: 'pending' },
  }, {
    tableName: 'referrals',
  });
  module.exports = Referral;





