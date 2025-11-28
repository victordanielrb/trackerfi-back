"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebSocketServer = initWebSocketServer;
exports.notifyUser = notifyUser;
const ws_1 = require("ws");
// Simple in-memory map of userId -> set of WebSocket connections
const clientsByUser = new Map();
function initWebSocketServer(server) {
    const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws, req) => {
        // Expect client to send an initial JSON message with { type: 'hello', userId }
        ws.on('message', (msg) => {
            try {
                const data = JSON.parse(String(msg));
                if (data && data.type === 'hello' && data.userId) {
                    const userId = String(data.userId);
                    let set = clientsByUser.get(userId);
                    if (!set) {
                        set = new Set();
                        clientsByUser.set(userId, set);
                    }
                    set.add(ws);
                    // Remove on close
                    ws.on('close', () => {
                        set.delete(ws);
                        if (set.size === 0)
                            clientsByUser.delete(userId);
                    });
                }
            }
            catch (e) {
                // ignore non-json
            }
        });
        ws.on('error', () => { });
    });
    console.log('WebSocket server initialized at /ws');
}
function notifyUser(userId, payload) {
    const set = clientsByUser.get(String(userId));
    if (!set || set.size === 0)
        return false;
    const msg = JSON.stringify(payload);
    for (const ws of set) {
        if (ws.readyState === ws_1.WebSocket.OPEN)
            ws.send(msg);
    }
    return true;
}
exports.default = { initWebSocketServer, notifyUser };
