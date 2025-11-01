import express from 'express';
import { verifyToken } from '../functions/auth/jwtUtil';
import addTrackedWallet from '../functions/userRelated/addTrackedWallet';
import removeTrackedWallet from '../functions/userRelated/removeTrackedWallet';
import getUserTrackedWallets from '../functions/userRelated/getUserTrackedWallets';
import getTokensFromTrackedWallets from '../functions/userRelated/getTokensFromTrackedWallets';
import GlobalData from '../functions/tokenRelated/globalData';

const router = express.Router();

router.get("/totaldata", async (req, res) => {
    const totaldata = (await GlobalData()).data;

    return res.json(totaldata);
});

router.get('/prices', async (req, res) => {
    const totaldata = (await GlobalData()).prices;

    return res.json(totaldata);
});


export default router ;