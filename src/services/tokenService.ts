import express from "express";
import cors from "cors";
import mongo from "../mongo";



const app = express();

app.use(cors());



app.get('/tokens', async (req, res) => {
    const client = mongo();
    try {
        await client.connect();
        const db = client.db('trackerfi');
        const collection = db.collection('tokens');
        const tokens = await collection.find({}).toArray();
        res.json(tokens);
    } catch (err) {
        console.error('Error fetching tokens', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
    }
});

// Removed malformed route `app.get('chart')` which caused a path parsing error.
// If you want a chart endpoint, use a valid path like: app.get('/chart', handler)

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
