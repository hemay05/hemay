const express = require('express');
const router = express.Router();
const Review = require('../models/review');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to Verify JWT (Duplicated for safety/isolation)
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ message: "No token provided" }); // 403 Forbidden

    const tokenPart = token.split(" ")[1];
    if (!tokenPart) return res.status(403).json({ message: "Malformed token" });

    jwt.verify(tokenPart, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
        if (err) return res.status(401).json({ message: "Invalid token" });
        req.user = decoded;
        next();
    });
};

// Add Review
router.post('/', verifyToken, async (req, res) => {
    try {
        const { product_id, rating, comment } = req.body;
        const user_id = req.user.id;

        // Check if user already reviewed this product? (Optional, skipping for now)

        const review = await Review.create({
            user_id,
            product_id,
            rating,
            comment
        });

        res.status(201).json({ success: true, message: 'Review added successfully', data: review });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
});

// Get Reviews by Product ID
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.findAll({
            where: { product_id: productId },
            include: [{
                model: User,
                attributes: ['name', 'profile_image'] // Fetch user details
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
