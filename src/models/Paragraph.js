const { readDB, writeDB } = require('../db');

class ParagraphModel {
    constructor(data) {
        this.data = data;
    }

    async save() {
        return ParagraphModel.create(this.data);
    }

    static async find() {
        const db = readDB();
        return {
            sort: () => db.paragraphs
        };
    }

    static async findById(id) {
        const db = readDB();
        const p = db.paragraphs.find(p => p._id === id);
        return p ? {
            ...p, deleteOne: async () => {
                const currentDb = readDB();
                currentDb.paragraphs = currentDb.paragraphs.filter(item => item._id !== id);
                writeDB(currentDb);
            }
        } : null;
    }

    static async create(data) {
        const toAdd = Array.isArray(data) ? data : [data];
        const db = readDB();

        const created = toAdd.map(item => ({
            ...item,
            _id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            createdAt: new Date()
        }));

        db.paragraphs.push(...created);
        writeDB(db);
        return created;
    }

    static async deleteMany() {
        const db = readDB();
        db.paragraphs = [];
        writeDB(db);
    }
}

module.exports = ParagraphModel;
