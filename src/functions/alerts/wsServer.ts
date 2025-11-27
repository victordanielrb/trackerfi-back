import { WebSocketServer, WebSocket } from 'ws';
import http from 'node:http';

// Simple in-memory map of userId -> set of WebSocket connections
const clientsByUser: Map<string, Set<WebSocket>> = new Map();

export function initWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

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
            set!.delete(ws);
            if (set!.size === 0) clientsByUser.delete(userId);
          });
        }
      } catch (e) {
        // ignore non-json
      }
    });

    ws.on('error', () => {});
  });

  console.log('WebSocket server initialized at /ws');
}

export function notifyUser(userId: string, payload: any) {
  const set = clientsByUser.get(String(userId));
  if (!set || set.size === 0) return false;
  const msg = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
  return true;
}

export default { initWebSocketServer, notifyUser };
