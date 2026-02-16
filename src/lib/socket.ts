import { io } from 'socket.io-client';

export enum SocketEvents {
    VIDEO_PROGRESS = 'video-progress',
    DEVICE_CONNECTION = 'device-connection',
    DEVICE_READY_TO_PLAY = 'device-ready-to-play',
    SESSION_STATUS_CHANGE = 'session-change-status-web',
    ACTIVITY_STATUS_CHANGE = 'activity-status-change',
    ACTIVITY_CHANGE_STATUS = 'change-activity-status', // Essential for updates
    DEVICE_WEB_STATUS_CHANGE = 'change-device-status-web',
    JOIN_ADMIN = 'join-admin',
}

const API_URL = import.meta.env.VITE_WS_URL;

// The backend URL for the socket might need adjustment if it differs from the base API URL
// (e.g., if the API is at /api/v1 and the socket is at the root)
const SOCKET_URL = API_URL.replace('/api/v1', '');

export const socket = io(SOCKET_URL, {
    autoConnect: true,
});

socket.on('connect', () => {
    console.log('Connected to socket server');
    socket.emit(SocketEvents.JOIN_ADMIN);
});

socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
});
