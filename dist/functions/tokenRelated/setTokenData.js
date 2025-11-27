"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setTokenData;
const mongo_1 = __importDefault(require("../../mongo"));
function setTokenData(tokens) {
    const client = (0, mongo_1.default)();
    client.connect().then(() => {
        const db = client.db('trackerfi');
        const collection = db.collection('tokens');
        tokens.forEach(async (token) => {
            const filter = { address: token.address, chain: token.chain };
            const update = { $set: token };
            const options = { upsert: true };
            await collection.updateOne(filter, update, options);
        });
        console.log('Tokens inserted/updated successfully');
        client.close();
    }).catch((err) => {
        console.error('Error connecting to MongoDB', err);
        client.close();
    });
}
