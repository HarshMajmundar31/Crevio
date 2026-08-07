import http from 'http';
import app from './app.mjs';
import { initSocketServer } from './lib/socket.mjs';

const httpServer = http.createServer(app);
const port = Number(process.env.API_PORT || 3000);

// Initialize Real-Time WebSockets Engine
initSocketServer(httpServer);

httpServer.listen(port, () => {
  console.log(`Crevio Real-Time API & Socket.IO running on http://localhost:${port}`);
});
