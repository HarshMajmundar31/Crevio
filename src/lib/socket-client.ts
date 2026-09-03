import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (!socket) {
    const rawApiUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
    let socketUrl = rawApiUrl;

    if (!socketUrl && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        socketUrl = 'http://localhost:3000';
      } else {
        // Production deployment without explicit socket URL: return null to prevent WebSocket error loops on Vercel
        return null;
      }
    }

    if (!socketUrl) return null;

    try {
      socket = io(socketUrl, {
        transports: ['polling', 'websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 5000,
        timeout: 5000,
      });

      socket.on('connect', () => {
        console.log('[Socket.IO Client] Connected to real-time execution server:', socket?.id);
      });

      socket.on('connect_error', (err) => {
        console.warn('[Socket.IO Client] Socket connection notice:', err?.message);
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket.IO Client] Disconnected:', reason);
      });
    } catch (err) {
      console.warn('[Socket.IO Client] Failed to initialize socket:', err);
      return null;
    }
  }

  return socket;
}

export function subscribeToRealtimeEvents(onEvent: (event: { type: string; payload: any }) => void) {
  const socketInstance = getSocket();
  if (!socketInstance) return () => {};

  const handleContractEvent = (payload: any) => {
    onEvent({ type: 'CONTRACT_EVENT', payload });
  };

  const handleActivityEvent = (payload: any) => {
    onEvent({ type: 'ACTIVITY_EVENT', payload });
  };

  const handleRiskAlertEvent = (payload: any) => {
    onEvent({ type: 'RISK_ALERT', payload });
  };

  socketInstance.on('contract_event', handleContractEvent);
  socketInstance.on('activity_event', handleActivityEvent);
  socketInstance.on('risk_alert', handleRiskAlertEvent);

  return () => {
    socketInstance.off('contract_event', handleContractEvent);
    socketInstance.off('activity_event', handleActivityEvent);
    socketInstance.off('risk_alert', handleRiskAlertEvent);
  };
}

export function subscribeToEvent(eventName: string, handler: (payload: any) => void) {
  const socketInstance = getSocket();
  if (!socketInstance) return () => {};
  socketInstance.on(eventName, handler);
  return () => {
    socketInstance.off(eventName, handler);
  };
}

export function joinCampaignRoom(campaignId: string) {
  const socketInstance = getSocket();
  if (socketInstance && campaignId) {
    socketInstance.emit('join_campaign', campaignId);
  }
}


