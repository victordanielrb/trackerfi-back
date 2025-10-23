import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';


// Import functions
import filterTokens from './functions/tokenRelated/filterTokens';
import getTokensFromWallet from './functions/tokenRelated/getTokensFromWallet';
import setTokenData from './functions/tokenRelated/setTokenData';
import getTokenPrice from './functions/tokenRelated/setPriceTokens';

import { createUser } from './functions/userRelated/createUser';
import { deleteUser } from './functions/userRelated/deleteUser';
import { getUser } from './functions/userRelated/getUser';
import { updateUser } from './functions/userRelated/updateUser';
import addWallet from './functions/wallets/addWallet';
import deleteWallet from './functions/wallets/deleteWallet';
import getAllWallets from './functions/wallets/getAllWallets';
import { test24hChangeEndpoint } from './functions/test/test24hEndpoint';
import authRouter from './routes/auth';
import walletRouter from './routes/wallets';
import trackingRouter from './routes/tracking';
const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000', 'http://192.168.1.100:8081', 'http://localhost:8080', 'http://127.0.0.1:8081', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use("/auth", authRouter);
app.use("/api/wallets", walletRouter);
app.use("/api/tracking", trackingRouter);
// Token-related routes
app.post('/filterTokens', (req, res) => {
	try {
		const tokens = req.body.tokens;
		const result = filterTokens(tokens);
		res.json(result);
		} catch (err) { 
			const errorMsg = err instanceof Error ? err.message : String(err);
			res.status(500).json({ error: errorMsg });
	}
});

app.get('/getTokensFromWallet', async (req, res) => {
	try {
		const result = await getTokensFromWallet(req.body.wallet);
		res.json(result);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			res.status(500).json({ error: errorMsg });
	}
});

// Removed the getTokensFromAllWallets route

app.post('/setPriceTokens', async (req, res) => {
	try {
		const { tokens, chain } = req.body;
		const result = await getTokenPrice(tokens, chain);
		res.json(result);
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		res.status(500).json({ error: errorMsg });
	}
});

app.post('/setTokenData', (req, res) => {
	try {
		const tokens = req.body.tokens;
		setTokenData(tokens);
		res.json({ success: true });
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		res.status(500).json({ error: errorMsg });
	}
});

// User-related routes
app.post('/createUser', async (req, res) => {
	try {
		const userData = req.body;
		const user = await createUser(userData);
		res.json(user);
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		res.status(500).json({ error: errorMsg });
	}
});

app.delete('/deleteUser/:id', async (req, res) => {
	try {
		const userId = req.params.id;
		const success = await deleteUser(userId);
		res.json({ success });
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		res.status(500).json({ error: errorMsg });
	}
});

app.get('/getUser/:id', async (req, res) => {
	try {
		const userId = req.params.id;
		const user = await getUser(userId);
		res.json(user);
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		res.status(500).json({ error: errorMsg });
	}
});

app.put('/updateUser/:id', async (req, res) => {
	try {
		const userId = req.params.id;
		const updateData = req.body;
		const success = await updateUser(userId, updateData);
		res.json({ success });
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		res.status(500).json({ error: errorMsg });
	}
});


// Health check route (should be first)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'TrackerFi Backend is running' });
});

// Test routes
app.get('/api/test/24h-change', test24hChangeEndpoint);

app.get('/wallets', async (req, res) => {
	try {
		const result = await getAllWallets();
		res.json(result);
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		res.status(500).json({ error: errorMsg });
	}
});
// Wallet routes are handled by walletRouter

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: {
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 TrackerFi Backend running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/auth/login`);
  console.log(`💼 Wallets: http://localhost:${PORT}/api/wallets`);
});
