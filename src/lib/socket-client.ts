import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO Client] Connected to real-time execution server:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO Client] Disconnected:', reason);
    });
  }

  return socket;
}

export function subscribeToRealtimeEvents(onEvent: (event: { type: string; payload: any }) => void) {
  const socketInstance = getSocket();

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
