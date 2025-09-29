import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
<<<<<<< HEAD
import filterTokens from './functions/tokenRelated/filterTokens';
import getTokensFromWallet from './functions/tokenRelated/getTokensFromWallet';
import setTokenData from './functions/tokenRelated/setTokenData';
import { createUser } from './functions/userRelated/createUser';
import { deleteUser } from './functions/userRelated/deleteUser';
import { getUser } from './functions/userRelated/getUser';
import { updateUser } from './functions/userRelated/updateUser';
import getTokenPrice from './functions/tokenRelated/setPriceTokens';
const app = express();
//CORS


app.use(bodyParser.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
=======
import apiRoutes from './routes';
import { swaggerUiMiddleware, swaggerUiSetup } from './swagger';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUiMiddleware, swaggerUiSetup);

// Health check endpoint - documented in swagger.ts
app.get('/', (req: Request, res: Response) => {
    res.json({ 
        message: 'Bounties API is running!', 
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        status: 'healthy',
        endpoints: {
            users: '/api/users',
            campaigns: '/api/campaigns',
            submissions: '/api/submissions',
            wallets: '/api/wallets',
            leaderboards: '/api/leaderboards',
            documentation: '/api-docs'
        }
    });
});

// API Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ 
        error: 'Not found',
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: [
            '/api/users',
            '/api/campaigns', 
            '/api/submissions',
            '/api/wallets',
            '/api/leaderboards',
            '/api-docs'
        ]
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Bounties API Server is running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`🔗 Available endpoints:`);
    console.log(`   - Users: http://localhost:${PORT}/api/users`);
    console.log(`   - Campaigns: http://localhost:${PORT}/api/campaigns`);
    console.log(`   - Submissions: http://localhost:${PORT}/api/submissions`);
    console.log(`   - Wallets: http://localhost:${PORT}/api/wallets`);
    console.log(`   - Leaderboards: http://localhost:${PORT}/api/leaderboards`);
});

export default app;
>>>>>>> c44bcc0db6aa10452b44352efbbee1855ea659f9
