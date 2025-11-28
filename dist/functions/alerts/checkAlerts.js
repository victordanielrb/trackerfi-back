"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAlertsPolling = startAlertsPolling;
const mongo_1 = __importDefault(require("../../mongo"));
const mongodb_1 = require("mongodb");
const wsServer_1 = __importDefault(require("./wsServer"));
/**
 * Periodically checks all users' alerts and marks them as triggered when conditions are met.
 * Runs every 3 minutes. This function is tolerant and logs errors without throwing.
 */
function startAlertsPolling(intervalMs = 3 * 60 * 1000) {
    // Run immediately, then every interval
    checkAlerts().catch(e => console.error('Initial alerts check failed:', e));
    setInterval(() => {
        checkAlerts().catch(e => console.error('Scheduled alerts check failed:', e));
    }, intervalMs);
}
async function checkAlerts() {
    const client = (0, mongo_1.default)();
    try {
        await client.connect();
        const db = client.db('trackerfi');
        // Find users that have alerts configured
        const usersCursor = db.collection('users').find({ alerts: { $exists: true, $ne: [] } });
        const nowIso = new Date().toISOString();
        while (await usersCursor.hasNext()) {
            const user = await usersCursor.next();
            if (!user || !user.alerts || user.alerts.length === 0)
                continue;
            for (let i = 0; i < user.alerts.length; i++) {
                const alert = user.alerts[i];
                if (!alert || !alert.token)
                    continue;
                try {
                    // Determine current price for the alert token. Prefer tokens master list by address, fallback to user wallet snapshots.
                    let currentPrice = null;
                    if (alert.token.address) {
                        const tokenDoc = await db.collection('tokens').findOne({ address: alert.token.address });
                        if (tokenDoc && typeof tokenDoc.price === 'number')
                            currentPrice = tokenDoc.price;
                    }
                    // fallback: check user's wallets snapshots
                    if (currentPrice === null && user.wallets && Array.isArray(user.wallets)) {
                        for (const w of user.wallets) {
                            if (!w.tokens)
                                continue;
                            const found = (w.tokens || []).find((t) => (t.address && alert.token.address && t.address.toLowerCase() === alert.token.address.toLowerCase()) || (t.symbol && alert.token.symbol && t.symbol.toLowerCase() === alert.token.symbol.toLowerCase()));
                            if (found && typeof found.price === 'number') {
                                currentPrice = found.price;
                                break;
                            }
                        }
                    }
                    if (currentPrice === null)
                        continue; // unable to resolve price
                    const threshold = Number(alert.price_threshold);
                    let triggered = false;
                    if (alert.alert_type === 'price_above' && currentPrice > threshold)
                        triggered = true;
                    if (alert.alert_type === 'price_below' && currentPrice < threshold)
                        triggered = true;
                    if (triggered) {
                        // Update the specific alert element with last_triggered timestamp
                        const updateResult = await db.collection('users').updateOne({ _id: new mongodb_1.ObjectId(user._id), 'alerts.token.address': alert.token.address, 'alerts.price_threshold': alert.price_threshold, 'alerts.alert_type': alert.alert_type }, { $set: { 'alerts.$.last_triggered': nowIso } });
                        // Optionally, store history of triggered alerts
                        await db.collection('alerts_history').insertOne({ user_id: user._id, alert, price: currentPrice, triggered_at: nowIso });
                        console.log(`Alert triggered for user ${user._id} token ${alert.token.symbol || alert.token.address} at ${currentPrice}`);
                        // Notify connected clients via WebSocket
                        try {
                            wsServer_1.default.notifyUser(user._id, { type: 'alert_triggered', userId: user._id, token: alert.token, price: currentPrice, triggered_at: nowIso });
                        }
                        catch (e) {
                            console.warn('Failed to notify user via websocket', user._id, e);
                        }
                    }
                }
                catch (innerErr) {
                    console.error('Error processing alert for user', user._id, innerErr);
                }
            }
        }
    }
    catch (err) {
        console.error('checkAlerts failed:', err);
    }
    finally {
        try {
            await client.close();
        }
        catch (e) { /* ignore */ }
    }
}
exports.default = { startAlertsPolling };
