import { Server } from 'socket.io';

let ioInstance = null;

export function initSocketServer(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join_campaign', (campaignId) => {
      socket.join(`campaign:${campaignId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined campaign:${campaignId}`);
    });

    socket.on('join_brand', (brandId) => {
      socket.join(`brand:${brandId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined brand:${brandId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function getIO() {
  if (!ioInstance) {
    console.warn('[Socket.IO] getIO called before initSocketServer!');
  }
  return ioInstance;
}

export function broadcastEvent(eventName, payload) {
  if (ioInstance) {
    ioInstance.emit(eventName, payload);
    console.log(`[Socket.IO Broadcast] Event: ${eventName}`, payload);
  }
}
