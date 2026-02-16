export type DeviceStatus = 'online' | 'offline';
export type SessionState = 'idle' | 'loading' | 'running' | 'paused' | 'pending' | 'ready';

export interface Device {
  id: string;
  name: string;
  status: DeviceStatus;
  sessionState: SessionState;
  currentActivity?: string;
  currentVideo?: string;
  batteryLevel?: number;
  lastSeen: Date;
  description?: string;
  isVideoRequired?: number;
  activeSessionId?: string;
  sessions?: {
    id: string;
    status: SessionState;
    activity: string;
    video?: string;
    isVideoRequired?: number;
  }[];
}

export type ActivityType = string;

export interface Video {
  id: string;
  name: string;
  duration: string;
  thumbnail?: string;
  url?: string;
}

export interface Activity {
  id: ActivityType;
  name: string;
  identifier?: string;
  description: string;
  hasVideos: boolean;
  isVideoRequired?: number;
  videos?: Video[];
}

export interface SessionRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  activityType: ActivityType;
  activityName: string;
  videoName?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  status: 'completed' | 'stopped' | 'failed' | 'in-progress';
}

// Mock data
export const mockDevices: Device[] = [
  {
    id: 'quest-001',
    name: 'Quest 3 - Training Room A',
    status: 'online',
    sessionState: 'idle',
    batteryLevel: 85,
    lastSeen: new Date(),
  },
  {
    id: 'quest-002',
    name: 'Quest 3 - Training Room B',
    status: 'online',
    sessionState: 'running',
    currentActivity: 'Video_360',
    currentVideo: 'Patient Care Basics',
    batteryLevel: 62,
    lastSeen: new Date(),
  },
  {
    id: 'quest-003',
    name: 'Quest 2 - Mobile Unit 1',
    status: 'online',
    sessionState: 'paused',
    currentActivity: 'Making a Sandwich',
    batteryLevel: 45,
    lastSeen: new Date(),
  },
  {
    id: 'quest-004',
    name: 'Quest 3 - Training Room C',
    status: 'offline',
    sessionState: 'idle',
    batteryLevel: 0,
    lastSeen: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: 'quest-005',
    name: 'Quest 2 - Mobile Unit 2',
    status: 'online',
    sessionState: 'idle',
    batteryLevel: 92,
    lastSeen: new Date(),
  },
  {
    id: 'quest-006',
    name: 'Quest 3 - Conference Room',
    status: 'online',
    sessionState: 'pending',
    currentActivity: 'Video_360',
    batteryLevel: 78,
    lastSeen: new Date(),
  },
];

export const mockActivities: Activity[] = [
  {
    id: 'Video_360',
    name: '360 Video Training',
    description: 'Immersive 360° video training experiences for healthcare scenarios',
    hasVideos: true,
    videos: [
      { id: 'vid-001', name: 'Patient Care Basics', duration: '12:30' },
      { id: 'vid-002', name: 'Emergency Response Protocol', duration: '18:45' },
      { id: 'vid-003', name: 'Medication Administration', duration: '15:00' },
    ],
    isVideoRequired: 1,
  },
  {
    id: 'making-sandwich',
    name: 'Making a Sandwich',
    description: 'Interactive daily living skills training without pass-through mode',
    hasVideos: false,
    isVideoRequired: 0,
  },
];

export const mockSessionHistory: SessionRecord[] = [
  {
    id: 'sess-001',
    deviceId: 'quest-001',
    deviceName: 'Quest 3 - Training Room A',
    activityType: 'Video_360',
    activityName: '360 Video Training',
    videoName: 'Patient Care Basics',
    startTime: new Date(Date.now() - 3600000 * 3),
    endTime: new Date(Date.now() - 3600000 * 2.5),
    duration: 1800,
    status: 'completed',
  },
  {
    id: 'sess-002',
    deviceId: 'quest-002',
    deviceName: 'Quest 3 - Training Room B',
    activityType: 'making-sandwich',
    activityName: 'Making a Sandwich',
    startTime: new Date(Date.now() - 3600000 * 5),
    endTime: new Date(Date.now() - 3600000 * 4.5),
    duration: 1800,
    status: 'completed',
  },
  {
    id: 'sess-003',
    deviceId: 'quest-003',
    deviceName: 'Quest 2 - Mobile Unit 1',
    activityType: 'Video_360',
    activityName: '360 Video Training',
    videoName: 'Emergency Response Protocol',
    startTime: new Date(Date.now() - 3600000 * 8),
    endTime: new Date(Date.now() - 3600000 * 7),
    duration: 3600,
    status: 'stopped',
  },
  {
    id: 'sess-004',
    deviceId: 'quest-004',
    deviceName: 'Quest 3 - Training Room C',
    activityType: 'Video_360',
    activityName: '360 Video Training',
    videoName: 'Medication Administration',
    startTime: new Date(Date.now() - 86400000),
    endTime: new Date(Date.now() - 86400000 + 1200000),
    duration: 1200,
    status: 'failed',
  },
  {
    id: 'sess-005',
    deviceId: 'quest-002',
    deviceName: 'Quest 3 - Training Room B',
    activityType: 'Video_360',
    activityName: '360 Video Training',
    videoName: 'Patient Care Basics',
    startTime: new Date(Date.now() - 1800000),
    status: 'in-progress',
  },
];
