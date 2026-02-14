// models/combo.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Combo = sequelize.define('combo', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    product_ids: { 
        type: DataTypes.JSONB, 
        allowNull: false, 
        defaultValue: [],
        validate: {
            isValidProductIds(value) {
                if (!Array.isArray(value)) {
                    throw new Error('product_ids must be an array');
                }
                value.forEach(item => {
                    if (!item.product_id || !item.quantity) {
                        throw new Error('Each product must have product_id and quantity');
                    }
                    if (item.quantity < 1) {
                        throw new Error('Quantity must be at least 1');
                    }
                });
            }
        }
    },
    combo_size: { 
        type: DataTypes.DECIMAL(10,2), 
        allowNull: false, 
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    discount_price: { 
        type: DataTypes.DECIMAL(10,2), 
        allowNull: false, 
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    image: { type: DataTypes.STRING(500), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true }
}, {
    tableName: 'combos',
    timestamps: true,
});

module.exports = Combo;