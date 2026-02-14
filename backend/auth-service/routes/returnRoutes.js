const express = require('express');
const router = express.Router();
const Return = require('../models/return');
const Order = require('../models/order');
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

// Create Return Request
router.post('/', verifyToken, async (req, res) => {
    try {
        const { order_id, reason } = req.body;
        const user_id = req.user.id; // Usually verify if order belongs to user

        // Optional: Verify order ownership
        // const order = await Order.findOne({ where: { id: order_id, user_id } });
        // if (!order) return res.status(404).json({ message: "Order not found" });

        const returnRequest = await Return.create({
            order_id,
            reason,
            status: 'requested'
        });

        // Optional: Update Order status to 'return_requested'
        // await Order.update({ order_status: 'return_requested' }, { where: { id: order_id } });

        res.status(201).json({ success: true, message: 'Return requested successfully', data: returnRequest });
    } catch (error) {
        console.error('Error creating return:', error);
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
});

// Get Returns by User (Optional, generic list)
router.get('/user', verifyToken, async (req, res) => {
    // Logic to list returns for logged in user (would need join with Order to filter by user_id)
    res.status(501).json({ message: "Not implemented yet" });
});

module.exports = router;
