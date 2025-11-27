import { withMongoDB } from '../../mongo';
import { ObjectId } from 'mongodb';
import User from '../../interfaces/userInterface';

/**
 * Add a token to user's favorites list
 */
export async function addTokenToFavorites(userId: string, tokenId: string): Promise<boolean> {
	console.log('Adding token to favorites:', { userId, tokenId });
	
	return withMongoDB(async client => {
		const db = client.db('trackerfi');
		const collection = db.collection<User>('users');
		
		const result = await collection.updateOne(
			{ _id: new ObjectId(userId) },
			{ $addToSet: { favorites: tokenId } }
		);
		
		console.log('Update result:', result);
		return result.modifiedCount > 0 || result.matchedCount > 0;
	});
}

/**
 * Remove a token from user's favorites list
 */
export async function removeTokenFromFavorites(userId: string, tokenId: string): Promise<boolean> {
	if (!tokenId) return false;
	if (!userId) return false;
	
	return withMongoDB(async client => {
		const db = client.db('trackerfi');
		const collection = db.collection<User>('users');
		
		const result = await collection.updateOne(
			{ _id: new ObjectId(userId) },
			{ $pull: { favorites: tokenId } } as any
		);
		
		return result.modifiedCount > 0;
	});
}

/**
 * Get user's favorite tokens with details
 */
export async function getUserFavorites(userId: string) {
	return withMongoDB(async client => {
		const db = client.db('trackerfi');
		const usersCollection = db.collection<User>('users');
		const tokensCollection = db.collection('alltokens');
		
		const user = await usersCollection.findOne(
			{ _id: new ObjectId(userId) },
			{ projection: { favorites: 1 } }
		);
		
		const favorites: string[] = user?.favorites || [];
		
		if (favorites.length === 0) {
			return [];
		}
		
		console.log("user favorites:", favorites);
		
		// Get token details for favorites
		const favoriteTokens = await tokensCollection.find({
			id: { $in: favorites }
		}).toArray();
		
		return favoriteTokens;
	});
}

/**
 * Check if a token is in user's favorites
 */
export async function isTokenFavorite(userId: string, tokenId: string): Promise<boolean> {
	return withMongoDB(async client => {
		const db = client.db('trackerfi');
		const collection = db.collection<User>('users');
		
		const user = await collection.findOne(
			{ 
				_id: new ObjectId(userId),
				favorites: tokenId
			},
			{ projection: { _id: 1 } }
		);
		
		return !!user;
	});
}