import express from 'express';
import { authenticateToken } from '../functions/auth/jwtMiddleware';
import { setAllTokens, getAllTokens } from '../functions/tokenRelated/setAllTokens';
import { getTokenDetails } from '../functions/tokenRelated/getTokenDetails';
import { getTokenTradingData } from '../functions/tokenRelated/getTokenTradingData';

const router = express.Router();

/**
 * GET /api/tokens/all
 * Query params:
 *  - search: filter by symbol or name (regex, case-insensitive)
 *  - limit: max number of results (default 50, max 200)
 */
router.get('/all', async (req, res) => {
  try {
    const { search, limit } = req.query as { search?: string; limit?: string };
    console.log("search", search);
    
    const list = await getAllTokens(search, limit ? parseInt(limit, 10) : 50);
    console.log("list", list);
    res.json({ count: list.length, tokens: list });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * POST /api/tokens/all/refresh
 * Heavy operation (upserts ~14k entries). Protected.
 */
router.post('/all/refresh', authenticateToken, async (req, res) => {
  try {
    const result = await setAllTokens();
    res.json({ success: true, ...result });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * GET /api/tokens/details/:id
 * Returns mapped token detail (single snapshot)
 */
router.get('/details/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const details = await getTokenDetails(id);
   
    
    if (!details) return res.status(404).json({ error: 'Token not found' });
    res.json(details);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * GET /api/tokens/trading/:id
 * Combines price, changes, 24h chart arrays and OHLC.
 */
router.get('/trading/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getTokenTradingData(id);
    if (!data) return res.status(404).json({ error: 'Token not found or no trading data' });
    res.json(data);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

export default router;