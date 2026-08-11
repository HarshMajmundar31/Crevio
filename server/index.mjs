import http from 'http';
import app from './app.mjs';
import { initSocketServer } from './lib/socket.mjs';
import { initInstagramTokenRefreshCron } from './jobs/instagramTokenRefresh.mjs';

const httpServer = http.createServer(app);
const port = Number(process.env.API_PORT || 3000);

// Initialize Real-Time WebSockets Engine & Cron Jobs
initSocketServer(httpServer);
initInstagramTokenRefreshCron();

httpServer.listen(port, () => {
  console.log(`Crevio Real-Time API & Socket.IO running on http://localhost:${port}`);
});

