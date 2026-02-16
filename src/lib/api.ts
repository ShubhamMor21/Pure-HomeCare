import axios from 'axios';

// Get base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL;

export interface UserData {
    id: string;
    email: string;
    name: string;
    code: string | null;
    profilePicture: string | null;
    authProvider: string;
    blockMessage: string | null;
    status: string;
    updatedAt: string;
    createdAt: string;
}

export interface TrainerDetail {
    id: string;
    email: string;
    name: string;
    code: string | null;
    status: string;
    profilePicture: string | null;
}

export interface DeviceData {
    id: string;
    deviceId: string;
    addedBy: string;
    title: string;
    identifier: string;
    deviceStatus: string;
    discription: string; // Intentional typo to match API
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface DeviceListResponse {
    rows: DeviceData[];
    count: number;
    page: number;
    limit: number;
}

export interface VideoData {
    id: string;
    url: string;
    title: string;
    identifier: string;
    totalTime: string;
    discription: string | null;
    status: string;
    activityId: string;
}

export interface ActivityData {
    id: string;
    title: string;
    identifier: string;
    status: string;
    discription?: string;
    isVideoRequired: number;
    createdAt: string;
    updatedAt: string;
    videos?: VideoData[];
}

export interface ActivityListResponse {
    rows: ActivityData[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface VideoListData extends VideoData {
    activity?: {
        id: string;
        title: string;
        identifier: string;
    };
}

export interface VideoListResponse {
    rows: VideoListData[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface SessionData {
    id: string;
    deviceId: string;
    activityId: string;
    videoId?: string;
    status: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    createdAt: string;
    updatedAt: string;
    device?: DeviceData;
    playAction?: string;
    activity?: ActivityData | ActivityData[];
    video?: VideoData | VideoData[];
    isReplay?: boolean;
}

export interface SessionListResponse {
    rows: SessionData[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

export interface LoginResponse {
    user: UserData;
    accessToken: string;
    refreshToken: string;
}

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token if needed
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling 401s or other global errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle logout or token refresh here
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

/**
 * Authentication APIs
 */
export const authApi = {
    login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },



    me: async (): Promise<ApiResponse<UserData>> => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    forgotPassword: async (email: string): Promise<ApiResponse<any>> => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (data: { email: string; token: string; newPassword: string }): Promise<ApiResponse<any>> => {
        const response = await api.post('/auth/reset-password', data);
        return response.data;
    },

    getTrainerDetail: async (): Promise<ApiResponse<TrainerDetail>> => {
        const response = await api.get('/trainers/detail');
        return response.data;
    },
};

/**
 * Devices & Training APIs (Placeholders based on current UI)
 */
export const devicesApi = {
    list: async (params: { page?: number; limit?: number; search?: string; status?: string }): Promise<ApiResponse<DeviceListResponse>> => {
        const response = await api.get('/devices', { params });
        return response.data;
    },

    get: async (id: string): Promise<ApiResponse<DeviceData>> => {
        const response = await api.get(`/devices/${id}`);
        return response.data;
    },

    create: async (data: { deviceId: string; title: string; discription?: string; deviceStatus?: string }): Promise<ApiResponse<DeviceData>> => {
        const response = await api.post('/devices', data);
        return response.data;
    },

    delete: async (id: string): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/devices/${id}`);
        return response.data;
    },
};

export const activitiesApi = {
    list: async (): Promise<ApiResponse<ActivityListResponse>> => {
        const response = await api.get('/activities');
        return response.data;
    },

    create: async (data: {
        title: string;
        identifier?: string;
        discription?: string;
        status?: 'ACTIVE' | 'INACTIVE' | 'DELETED'
    }): Promise<ApiResponse<ActivityData>> => {
        const response = await api.post('/activities', data);
        return response.data;
    },

    update: async (id: string, data: {
        title?: string;
        identifier?: string;
        discription?: string;
        status?: 'ACTIVE' | 'INACTIVE' | 'DELETED'
    }): Promise<ApiResponse<ActivityData>> => {
        const response = await api.patch(`/activities/${id}`, data);
        return response.data;
    },
};

export const videosApi = {
    list: async (params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<ApiResponse<VideoListResponse>> => {
        const response = await api.get('/videos', { params });
        return response.data;
    },

    uploadDirect: async (file: File, title: string, activityId: string, videoMode: 'Video_360' | 'Plain_Video'): Promise<ApiResponse<VideoData>> => {
        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);
        formData.append('activityId', activityId);
        formData.append('videoMode', videoMode);

        const response = await api.post('/videos/uploads', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    update: async (id: string, data: {
        title?: string;
        identifier?: string;
        discription?: string;
        status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
        activityId?: string;
        url?: string;
        totalTime?: string;
    }): Promise<ApiResponse<VideoData>> => {
        const response = await api.patch(`/videos/${id}`, data);
        return response.data;
    },
};

export const sessionsApi = {
    list: async (params?: { page?: number; limit?: number; deviceId?: string }): Promise<ApiResponse<SessionListResponse>> => {
        const response = await api.get('/sessions-history', { params });
        return response.data;
    },

    update: async (id: string, data: { status: string }): Promise<ApiResponse<SessionData>> => {
        const response = await api.patch(`/sessions-history/${id}`, data);
        return response.data;
    },

    create: async (data: {
        deviceId: string;
        activityId: string;
        videoId?: string | null;
        title: string;
        playAction: string;
    }): Promise<ApiResponse<SessionData>> => {
        const response = await api.post('/sessions-history', data);
        return response.data;
    },

    replay: async (id: string): Promise<ApiResponse<SessionData>> => {
        const response = await api.post(`/sessions-history/${id}/replay`);
        return response.data;
    },

    replayMultiple: async (deviceIds: string[]): Promise<any> => {
        const response = await api.post('/sessions-history/replay', { deviceIds });
        return response.data;
    },
};

export default api;
