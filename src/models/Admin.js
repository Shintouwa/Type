const { readDB, writeDB } = require('../db');

class AdminModel {
    constructor(data) {
        this.data = data;
    }

    static async findOne({ username }) {
        const db = readDB();
        return db.admins.find(a => a.username === username);
    }

    static async create(data) {
        const db = readDB();
        const newAdmin = { ...data, _id: Date.now().toString() };
        db.admins.push(newAdmin);
        writeDB(db);
        return newAdmin;
    }

    static async deleteMany() {
        const db = readDB();
        db.admins = [];
        writeDB(db);
    }
}

module.exports = AdminModel;
