const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Category = require("./category");
const Brand = require("./brand");
const Product = sequelize.define('product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category_id: { type: DataTypes.INTEGER, allowNull: true },
  product_type_id: { type: DataTypes.INTEGER, allowNull: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  slug: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  short_description: { type: DataTypes.TEXT, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
  cost_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
  compare_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  sku: { type: DataTypes.STRING(50), allowNull: true },
  images: { type: DataTypes.JSONB, allowNull: true },
  rating: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
  status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_published: { type: DataTypes.BOOLEAN, defaultValue: true },
  brand_id: { type: DataTypes.INTEGER, allowNull: true },
  specifications: { type: DataTypes.JSONB, allowNull: true },
  tags: { type: DataTypes.JSONB, allowNull: true },
  weight: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
  dimensions: { type: DataTypes.JSONB, allowNull: true },
  seo_title: { type: DataTypes.STRING(255), allowNull: true },
  seo_description: { type: DataTypes.TEXT, allowNull: true },
  track_quantity: { type: DataTypes.BOOLEAN, defaultValue: true },
  review_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  // 🆕 Added fields
  ingredients: { type: DataTypes.TEXT, allowNull: true },
  calories: { type: DataTypes.TEXT, allowNull: true },
  delivery_info: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'products',
});

Product.belongsTo(Category, { foreignKey: 'category_id' });
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Brand, { foreignKey: 'brand_id' });
Brand.hasMany(Product, { foreignKey: 'brand_id' });

module.exports = Product;