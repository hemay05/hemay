const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const OrderItem = require('../models/order_item');
const Product = require('../models/product');
const jwt = require('jsonwebtoken');

// Middleware to Verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ message: "No token provided" });

    const tokenPart = token.split(" ")[1];
    if (!tokenPart) return res.status(403).json({ message: "Malformed token" });

    jwt.verify(tokenPart, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
        if (err) return res.status(401).json({ message: "Invalid token" });
        req.user = decoded;
        next();
    });
};

// Create Order (POST /)
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            items,
            shipping_address,
            billing_address, // Optional, can default to shipping
            payment_method,
            transaction_id, // For Online Payment
            subtotal,
            delivery_fee,
            total_amount
        } = req.body;

        const user_id = req.user.id;
        const order_number = 'ORD-' + Date.now() + Math.floor(Math.random() * 1000);

        let payment_status = 'pending';
        let order_status = 'pending';

        if (payment_method === 'online' && transaction_id) {
            payment_status = 'paid';
            order_status = 'confirmed'; // Confirmed if paid
        } else if (payment_method === 'cash_on_delivery') {
            order_status = 'confirmed'; // Auto-confirm COD for now
        }

        const newOrder = await Order.create({
            order_number,
            user_id,
            total_amount, // Ideally recalculate from items
            shipping_amount: delivery_fee || 0,
            final_amount: total_amount,
            payment_status,
            order_status,
            payment_method,
            razorpay_payment_id: transaction_id || null,
            shipping_address: shipping_address,
            billing_address: billing_address || shipping_address,
            created_at: new Date()
        });

        // Create Order Items
        const orderItemsData = items.map(item => ({
            order_id: newOrder.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            total_price: item.total
        }));

        await OrderItem.bulkCreate(orderItemsData);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: newOrder
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
});

// Get Orders by User (GET /user/:userId)
router.get('/user/:userId', verifyToken, async (req, res) => {
    try {
        // Ensure user matches token? (Optional security check)
        const orders = await Order.findAll({
            where: { user_id: req.params.userId },
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Get Single Order (GET /:id)
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [{
                model: OrderItem, // Ensure association exists
                include: [Product] // Include Product details if association exists
            }]
        });

        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
