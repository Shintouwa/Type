const bcrypt = require('bcryptjs');
const Admin = require('./src/models/Admin');
const Paragraph = require('./src/models/Paragraph');

async function seed() {
    console.log('Seeding Local JSON Database...');

    // Clear existing
    await Admin.deleteMany({});
    await Paragraph.deleteMany({});

    // Create Admin
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('admin123', salt);
    await Admin.create({ username: 'admin', password });
    console.log('Admin created: admin / admin123');

    // Create Seed Paragraphs
    await Paragraph.create([
        { title: 'The Quick Brown Fox', text: 'The quick brown fox jumps over the lazy dog.', difficulty: 'Easy' },
        { title: 'Typing Speed', text: 'Typing speed is measured in words per minute. The more you practice, the faster you get.', difficulty: 'Medium' },
        { title: 'Code Challenge', text: 'function helloWorld() { console.log("Hello World"); }', difficulty: 'Hard' }
    ]);
    console.log('Seed paragraphs created');
}

seed();
