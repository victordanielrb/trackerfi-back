import express from 'express';
import { verifyToken } from '../functions/auth/jwtUtil';
import addTrackedWallet from '../functions/userRelated/addTrackedWallet';
import removeTrackedWallet from '../functions/userRelated/removeTrackedWallet';
import getUserTrackedWallets from '../functions/userRelated/getUserTrackedWallets';
import getTokensFromTrackedWallets from '../functions/userRelated/getTokensFromTrackedWallets';
import GlobalData from '../functions/tokenRelated/globalData';

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
        const gd = await GlobalData();
        console.log("AIAIA global data ",gd);
        
        const totaldata = gd?.data ?? SAFE_TOTALDATA_FALLBACK;
        return res.json(totaldata);
    } catch (err) {
        console.error('globaldata /totaldata handler error:', err);
        return res.json(SAFE_TOTALDATA_FALLBACK);
    }
});

router.get('/prices', async (req, res) => {
    try {
        const gd = await GlobalData();
        const prices = gd?.prices ?? { brl: null, eur: null };
        return res.json(prices);
    } catch (err) {
        console.error('globaldata /prices handler error:', err);
        return res.json({ brl: null, eur: null });
    }
});


export default router ;