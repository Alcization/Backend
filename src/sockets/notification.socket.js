const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

// Per-user WebSocket hub. Frontend connects to ws://host/ws/notifications?token=JWT
// Backend can broadcastToUser(userId, payload) to push alert popups live.

const userSockets = new Map(); // user_id -> Set<WebSocket>

const addSocket = (userId, ws) => {
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(ws);
};

const removeSocket = (userId, ws) => {
    const set = userSockets.get(userId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) userSockets.delete(userId);
};

const broadcastToUser = (userId, payload) => {
    const set = userSockets.get(Number(userId));
    if (!set || set.size === 0) return 0;
    const message = JSON.stringify(payload);
    let sent = 0;
    for (const ws of set) {
        if (ws.readyState === ws.OPEN) {
            try {
                ws.send(message);
                sent += 1;
            } catch (_err) {
                // ignore individual send failures
            }
        }
    }
    return sent;
};

const attach = (httpServer) => {
    const wss = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (req, socket, head) => {
        const { pathname, query } = url.parse(req.url, true);
        if (pathname !== '/ws/notifications') {
            socket.destroy();
            return;
        }

        const rawToken = query.token
            || (req.headers['sec-websocket-protocol'] || '').split(',')[0].trim();

        if (!rawToken) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        jwt.verify(rawToken, process.env.JWT_SECRET, (err, decoded) => {
            if (err || !decoded?.id) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            wss.handleUpgrade(req, socket, head, (ws) => {
                const userId = Number(decoded.id);
                addSocket(userId, ws);
                ws.send(JSON.stringify({ type: 'connected', user_id: userId }));

                ws.on('close', () => removeSocket(userId, ws));
                ws.on('error', () => removeSocket(userId, ws));
                ws.on('message', (raw) => {
                    // Heartbeat / ping passthrough — accept anything, ignore for now.
                    try {
                        const msg = JSON.parse(raw.toString());
                        if (msg && msg.type === 'ping') {
                            ws.send(JSON.stringify({ type: 'pong' }));
                        }
                    } catch (_err) {
                        // ignore non-JSON
                    }
                });
            });
        });
    });

    return wss;
};

module.exports = { attach, broadcastToUser };
