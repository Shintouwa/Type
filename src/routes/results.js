const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const { verifyToken } = require('./auth');

// GET all results (Admin only)
router.get('/', verifyToken, async (req, res) => {
    try {
        const results = await Result.find().sort({ timestamp: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
