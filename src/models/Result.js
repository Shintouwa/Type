const { readDB, writeDB } = require('../db');

class ResultModel {
    constructor(data) {
        this.data = data;
    }

    async save() {
        return ResultModel.create(this.data);
    }

    static async find() {
        const db = readDB();
        return {
            sort: () => db.results
        };
    }

    static async create(data) {
        const db = readDB();
        const newResult = {
            ...data,
            _id: Date.now().toString(),
            timestamp: new Date()
        };
        db.results.push(newResult);
        writeDB(db);
        return newResult;
    }
}

module.exports = ResultModel;
