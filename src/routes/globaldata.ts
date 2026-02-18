import express from 'express';
import { verifyToken } from '../functions/auth/jwtUtil';
import addTrackedWallet from '../functions/userRelated/addTrackedWallet';
import removeTrackedWallet from '../functions/userRelated/removeTrackedWallet';
import getUserTrackedWallets from '../functions/userRelated/getUserTrackedWallets';
import getTokensFromTrackedWallets from '../functions/userRelated/getTokensFromTrackedWallets';
import GlobalData from '../functions/globalData/globalData';
import { getDb } from '../mongo';

const router = express.Router();

// safe fallback object used when upstream fails or rate-limited
const SAFE_TOTALDATA_FALLBACK = {
  market_cap: 0,
  btc_dominance: 0,
  eth_dominance: 0,
  btc_price: 0,
  eth_price: 0,
  volume_24h: 0,
  market_cap_change_24h: 0,
  updated_at: new Date().toISOString()
};

router.get("/totaldata", async (req, res) => {
    try {
        // Use a singleton document in collection 'globaldata' with _id = 'global'
        const TEN_MIN_MS = 10 * 60 * 1000;

        const db = await getDb();
        const doc = await db.collection('globaldata').findOne({ key: 'global' });

        const now = Date.now();
        if (doc && doc.updated_at) {
            const updatedAt = new Date(doc.updated_at).getTime();
            if ((now - updatedAt) < TEN_MIN_MS) {
                // return cached data (gd.data preferred, but fall back to stored data)
                return res.json(doc.data?.data ?? doc.data ?? SAFE_TOTALDATA_FALLBACK);
            }
        }

        // stale or missing -> fetch fresh data and upsert into DB
        const gd = await GlobalData();
        const totaldata = gd?.data ?? SAFE_TOTALDATA_FALLBACK;

        // upsert into collection - store the full GlobalData() result under 'data'
        try {
            console.log("insertng data");

            const db2 = await getDb();
            let datainsertresult = await db2.collection('globaldata').updateOne(
                { key: 'global' },
                { $set: { key: 'global', data: gd ?? {}, updated_at: new Date().toISOString() } },
                { upsert: true }
            );

            console.log("inserted data", datainsertresult);
        } catch (dbErr) {
            console.error('Failed to upsert globaldata cache:', dbErr);
        }

        return res.json(totaldata);
    } catch (err) {
        console.error('globaldata /totaldata handler error:', err);
        return res.json(SAFE_TOTALDATA_FALLBACK);
    }
});

router.get('/prices', async (req, res) => {
    try {
        const TEN_MIN_MS = 10 * 60 * 1000;

        const db = await getDb();
        const doc = await db.collection('globaldata').findOne({ key: 'global' });

        const now = Date.now();
        if (doc && doc.updated_at) {
            const updatedAt = new Date(doc.updated_at).getTime();
            if ((now - updatedAt) < TEN_MIN_MS) {
                const cachedPrices = doc.data?.prices ?? { brl: null, eur: null };
                return res.json(cachedPrices);
            }
        }

        // stale or missing -> fetch fresh data and upsert
        const gd = await GlobalData();
        const prices = gd?.prices ?? { brl: null, eur: null };

        try {
            const db2 = await getDb();
            // fetch existing doc to preserve other fields
            const existing = await db2.collection('globaldata').findOne({ key: 'global' });
            const newData = { ...(existing?.data || {}), ...(gd || {}) };
            await db2.collection('globaldata').updateOne(
                { key: 'global' },
                { $set: { key: 'global', data: newData, updated_at: new Date().toISOString() } },
                { upsert: true }
            );
        } catch (dbErr) {
            console.error('Failed to upsert globaldata cache (prices):', dbErr);
        }

        return res.json(prices);
    } catch (err) {
        console.error('globaldata /prices handler error:', err);
        return res.json({ brl: null, eur: null });
    }
});


export default router ;