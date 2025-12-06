const express = require('express');
const router = express.Router();
const Paragraph = require('../models/Paragraph');
const { verifyToken } = require('./auth');

// GET all paragraphs (Public mainly, but Admin uses it too)
router.get('/', async (req, res) => {
    try {
        const paragraphs = await Paragraph.find().sort({ createdAt: -1 });
        res.json(paragraphs);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST new paragraph (Protected)
router.post('/', verifyToken, async (req, res) => {
    const { title, text, difficulty } = req.body;
    try {
        const newParagraph = new Paragraph({ title, text, difficulty });
        const savedParagraph = await newParagraph.save();
        res.json(savedParagraph);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// DELETE paragraph (Protected)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const paragraph = await Paragraph.findById(req.params.id);
        if (!paragraph) return res.status(404).json({ message: 'Paragraph not found' });

        await paragraph.deleteOne();
        res.json({ message: 'Paragraph removed' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
