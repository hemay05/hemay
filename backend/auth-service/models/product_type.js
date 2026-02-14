// models/combo.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProductType = sequelize.define('product_type', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
   
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
   }, {
    tableName: 'product_types',
    timestamps: true,
});

module.exports = ProductType;