const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const sequelize = require("./config/db");
const brandRoutes = require("./routes/brandRoutes");
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve Static Uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../../src/assets/uploads')));

// Load models to ensure associations are set up
require('./models/product');
require('./models/wishlist');

app.use("/api/auth", authRoutes);
app.use("/api/brands", brandRoutes);
const categoryRoutes = require("./routes/categoryRoutes");
app.use("/api/categories", categoryRoutes);
const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payment", paymentRoutes);
const reviewRoutes = require("./routes/reviewRoutes");
app.use("/api/reviews", reviewRoutes);
const returnRoutes = require("./routes/returnRoutes");
app.use("/api/returns", returnRoutes);
const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5000;
sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`));
});