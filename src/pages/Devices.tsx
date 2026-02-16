import { useState, useMemo, useEffect, useRef } from 'react';
import { Activity, Device, ActivityType } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import DeviceCard from '@/components/devices/DeviceCard';
import ActivitySelector from '@/components/devices/ActivitySelector';
import SessionControls from '@/components/devices/SessionControls';
import { Input } from '@/components/ui/input';
import AddDeviceDialog from '@/components/devices/AddDeviceDialog';
import { Search, RefreshCw, Monitor, Loader2, Plus, Users, Radio, CheckCircle, Activity as ActivityIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VRBackground from '@/components/ui/VRBackground';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery } from '@tanstack/react-query';
import { devicesApi, DeviceData, videosApi, VideoListData, sessionsApi, activitiesApi } from '@/lib/api';
import { socket, SocketEvents } from '@/lib/socket';

export default function Devices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

  // New state for multiple selected activities
  const [selectedActivities, setSelectedActivities] = useState<{
    activityId: string;
    videoId: string | null;
  }[]>([]);
  const [isErrorShaking, setIsErrorShaking] = useState(false);

  useEffect(() => {
    if (isErrorShaking) {
      const timer = setTimeout(() => setIsErrorShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isErrorShaking]);

  const [isLoadingControls, setIsLoadingControls] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);


  const { data: apiResponse, isLoading: isQueryLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ['devices', debouncedSearch, page, limit],
    queryFn: () => devicesApi.list({ search: debouncedSearch, page, limit }),
  });

  const { data: activitiesResponse, refetch: refetchActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.list(),
  });

  const { data: sessionsResponse, refetch: refetchSessions } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: () => sessionsApi.list({ limit: 50 }),
  });

  // Track which sessions have been auto-played to prevent duplicates
  const autoPlayedSessionsRef = useRef<Set<string>>(new Set());

  // Track completed sessions to show toast notifications
  const completedSessionsRef = useRef<Set<string>>(new Set());
  const previousSessionsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const handleDeviceUpdate = (data: any) => {
      console.log('Socket event received:', data);
      refetch();
      refetchSessions();
    };
    socket.on(SocketEvents.DEVICE_CONNECTION, handleDeviceUpdate);
    socket.on(SocketEvents.DEVICE_READY_TO_PLAY, handleDeviceUpdate);
    socket.on(SocketEvents.SESSION_STATUS_CHANGE, handleDeviceUpdate);
    socket.on(SocketEvents.ACTIVITY_STATUS_CHANGE, handleDeviceUpdate);
    socket.on(SocketEvents.ACTIVITY_CHANGE_STATUS, handleDeviceUpdate); // Handle PAUSED/PLAYING changes
    socket.on(SocketEvents.DEVICE_WEB_STATUS_CHANGE, handleDeviceUpdate);

    return () => {
      socket.off(SocketEvents.DEVICE_CONNECTION, handleDeviceUpdate);
      socket.off(SocketEvents.DEVICE_READY_TO_PLAY, handleDeviceUpdate);
      socket.off(SocketEvents.SESSION_STATUS_CHANGE, handleDeviceUpdate);
      socket.off(SocketEvents.ACTIVITY_STATUS_CHANGE, handleDeviceUpdate);
      socket.off(SocketEvents.ACTIVITY_CHANGE_STATUS, handleDeviceUpdate);
      socket.off(SocketEvents.DEVICE_WEB_STATUS_CHANGE, handleDeviceUpdate);
    };
  }, [refetch, refetchSessions]);

  // Auto-play replay sessions when they reach READY status
  useEffect(() => {
    if (!sessionsResponse?.data?.rows) return;

    const sessions = sessionsResponse.data.rows;

    // Find sessions that are ready for auto-replay
    const readyReplaySessions = sessions.filter(
      s => s.isReplay === true &&
        s.status === 'READY' &&
        !autoPlayedSessionsRef.current.has(s.id)
    );

    if (readyReplaySessions.length > 0) {
      // Auto-play each ready replay session
      readyReplaySessions.forEach(async (session) => {
        try {
          autoPlayedSessionsRef.current.add(session.id);
          await sessionsApi.update(session.id, { status: 'PLAYING' });
          console.log(`Auto-playing replay session: ${session.id}`);

          // Refetch to update UI immediately
          refetch();
          refetchSessions();

          toast({
            title: 'Replay started',
            description: `Auto-playing replay session on ${session.device?.title || 'device'}`,
          });
        } catch (error) {
          console.error(`Failed to auto-play session ${session.id}:`, error);
          autoPlayedSessionsRef.current.delete(session.id); // Remove from set on failure
          toast({
            title: 'Auto-play failed',
            description: 'Failed to automatically start replay session',
            variant: 'destructive',
          });
        }
      });
    }
  }, [sessionsResponse, refetch, refetchSessions]);

  // Track session completions and show toast notifications
  useEffect(() => {
    if (!sessionsResponse?.data?.rows) return;

    const sessions = sessionsResponse.data.rows;
    const newlyCompletedSessions: any[] = [];

    sessions.forEach((session) => {
      const previousStatus = previousSessionsRef.current.get(session.id);
      const currentStatus = session.status;

      // Check if session just completed
      if (
        previousStatus &&
        previousStatus !== 'COMPLETED' &&
        currentStatus === 'COMPLETED' &&
        !completedSessionsRef.current.has(session.id)
      ) {
        newlyCompletedSessions.push(session);
        completedSessionsRef.current.add(session.id);
      }

      // Update the previous status
      previousSessionsRef.current.set(session.id, currentStatus);
    });

    // Show toast if any sessions completed
    if (newlyCompletedSessions.length > 0) {
      const deviceNames = newlyCompletedSessions
        .map(s => s.device?.title || 'Unknown device')
        .join(', ');

      toast({
        title: `${newlyCompletedSessions.length} ${newlyCompletedSessions.length === 1 ? 'Session' : 'Sessions'} Completed`,
        description: newlyCompletedSessions.length === 1
          ? `${deviceNames} has completed its training session`
          : `${newlyCompletedSessions.length} devices have completed their training sessions`,
      });
    }
  }, [sessionsResponse]);

  const activities = useMemo(() => {
    if (!activitiesResponse?.data?.rows) return [];

    return activitiesResponse.data.rows.map(a => ({
      id: a.id,
      name: a.title,
      identifier: a.identifier,
      description: a.discription,
      hasVideos: (a.videos?.length || 0) > 0,
      isVideoRequired: a.isVideoRequired,
      videos: a.videos
        ?.filter(v => v.status === 'ACTIVE')
        .map(v => ({
          id: v.id,
          name: v.title,
          duration: v.totalTime,
          url: v.url
        })) || []
    }));
  }, [activitiesResponse]);

  const devices = useMemo(() => {
    if (!apiResponse?.data?.rows) return [];
    const latestSessions = sessionsResponse?.data?.rows || [];

    return apiResponse.data.rows.map((d: DeviceData) => {
      // Find all active sessions for this device
      const deviceSessions = latestSessions.filter(s => s.deviceId === d.id &&
        (s.status === 'PLAYING' || s.status === 'PAUSED' || s.status === 'RESUMED' || s.status === 'READY' || s.status === 'PENDING')
      );

      // Primary session is the one running or most recently updated
      const primarySession = deviceSessions.find(s => s.status === 'PLAYING' || s.status === 'RESUMED' || s.status === 'PAUSED') || deviceSessions[0];

      return {
        id: d.id,
        name: d.title,
        status: (d.deviceStatus === 'CONNECTED' ? 'online' : 'offline') as 'online' | 'offline',
        sessionState: (primarySession?.status === 'PLAYING' || primarySession?.status === 'RESUMED' ? 'running' :
          primarySession?.status === 'PAUSED' ? 'paused' :
            primarySession?.status === 'PENDING' ? 'pending' :
              primarySession?.status === 'READY' ? 'ready' : 'idle') as any,
        lastSeen: new Date(d.updatedAt),
        identifier: d.identifier,
        description: d.discription,
        activeSessionId: primarySession?.id,
        currentActivity: Array.isArray(primarySession?.activity) ? primarySession?.activity?.[0]?.title : primarySession?.activity?.title,
        currentVideo: Array.isArray(primarySession?.video) ? primarySession?.video?.[0]?.title : primarySession?.video?.title,
        isVideoRequired: Array.isArray(primarySession?.activity) ? primarySession?.activity?.[0]?.isVideoRequired : primarySession?.activity?.isVideoRequired,
        sessions: deviceSessions.map(s => ({
          id: s.id,
          status: (s.status === 'PLAYING' || s.status === 'RESUMED' ? 'running' :
            s.status === 'PAUSED' ? 'paused' :
              s.status === 'PENDING' ? 'pending' :
                s.status === 'READY' ? 'ready' : 'idle') as any,
          activity: Array.isArray(s.activity) ? s.activity[0]?.title : s.activity?.title,
          video: Array.isArray(s.video) ? s.video[0]?.title : s.video?.title,
          isVideoRequired: Array.isArray(s.activity) ? s.activity[0]?.isVideoRequired : s.activity?.isVideoRequired
        }))
      };
    });
  }, [apiResponse, sessionsResponse]);

  // Automatically deselect devices that go offline
  useEffect(() => {
    const offlineDeviceIds = devices
      .filter(d => d.status === 'offline')
      .map(d => d.id);

    if (offlineDeviceIds.length > 0) {
      setSelectedDeviceIds(prev => prev.filter(id => !offlineDeviceIds.includes(id)));
    }
  }, [devices]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setDebouncedSearch(searchQuery);
    }
  };

  const selectedDevices = devices.filter((d) => selectedDeviceIds.includes(d.id));

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: 'Devices refreshed',
      description: 'Device list has been updated',
    });
  };

  const handleSelectActivity = (activityId: string) => {
    // Check if any selected device is busy
    const busyDevices = selectedDevices.filter(d =>
      (d as any).sessionState === 'running' ||
      (d as any).sessionState === 'paused' ||
      (d as any).sessionState === 'loading' ||
      (d as any).sessionState === 'ready'
    );

    if (busyDevices.length > 0) {
      setIsErrorShaking(true);
      toast({
        title: "Cannot change activity",
        description: "Some selected devices are currently busy. Please stop the current session first.",
        variant: "destructive"
      });
      return;
    }

    // Single selection mode: toggle or replace
    setSelectedActivities(prev => {
      const exists = prev.some(a => a.activityId === activityId);
      if (exists) {
        // Deselect if clicking the same activity
        return [];
      }

      // Replace with new selection
      const activity = activities.find(a => a.id === activityId);
      const firstVideoId = activity?.videos?.[0]?.id || null;
      return [{ activityId, videoId: firstVideoId }];
    });
  };

  const handleSelectVideo = (activityId: string, videoId: string) => {
    setSelectedActivities(prev =>
      prev.map(a => a.activityId === activityId ? { ...a, videoId } : a)
    );
  };

  const handleStart = async (targetDeviceIds?: string[]) => {
    const idsToUse = targetDeviceIds || selectedDeviceIds;
    if (idsToUse.length === 0) return;

    const devicesToUse = devices.filter(d => idsToUse.includes(d.id));

    // PRIORITY 1: Start existing PENDING/READY sessions (PATCH existing session)
    // This ensures clicking Play on a device with a ready session updates it instead of creating a new one
    const devicesToStart = devicesToUse.filter(d => (d as any).sessionState === 'pending' || (d as any).sessionState === 'ready');
    if (devicesToStart.length > 0) {
      setIsLoadingControls(true);
      try {
        await Promise.all(
          devicesToStart
            .filter(d => d.activeSessionId)
            .map(d => sessionsApi.update(d.activeSessionId!, { status: 'PLAYING' }))
        );
        await refetchSessions();
        toast({
          title: 'Session(s) started',
          description: `Started existing activities on ${devicesToStart.length} device(s)`,
        });
      } catch (error: any) {
        toast({
          title: 'Failed to start existing sessions',
          description: error.response?.data?.message || error.message || 'An unknown error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingControls(false);
      }
      return;
    }

    // PRIORITY 2: Create new sessions with selected activities (POST new session)
    // Only execute if devices are idle and user has selected activities
    if (selectedActivities.length > 0) {
      setIsLoadingControls(true);
      try {
        // Always use SINGLE mode since we only support individual task selection
        const playAction = 'SINGLE';

        const sessionRequests = idsToUse.map(deviceId => {
          const device = devices.find(d => d.id === deviceId);
          // Get the selected activity (only one in single-select mode)
          const sa = selectedActivities[0];
          const activity = activities.find(a => a.id === sa.activityId);

          return {
            deviceId,
            activityId: sa.activityId,
            ...(sa.videoId ? { videoId: sa.videoId } : {}),
            title: `${activity?.name || 'Session'} - ${device?.name || 'VR'}`,
            playAction
          };
        });

        await Promise.all(sessionRequests.map(data => sessionsApi.create(data)));
        await refetchSessions();

        const activityNames = selectedActivities
          .map(sa => activities.find(a => a.id === sa.activityId)?.name)
          .filter(Boolean)
          .join(', ');

        toast({
          title: 'Session(s) started',
          description: `Started ${activityNames} on ${idsToUse.length} device(s)`,
        });
        if (!targetDeviceIds) {
          setSelectedActivities([]); // Clear selection only if bulk action
        }
      } catch (error: any) {
        console.error('Failed to start sessions:', error);
        toast({
          title: 'Failed to start sessions',
          description: error.response?.data?.message || error.message || 'An unknown error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingControls(false);
      }
      return;
    }
  };

  const handlePause = async (targetDeviceIds?: string[]) => {
    setIsLoadingControls(true);
    try {
      const idsToUse = targetDeviceIds || selectedDeviceIds;
      const devicesToUse = devices.filter(d => idsToUse.includes(d.id));
      const targetSessions = devicesToUse
        .filter(d => d.activeSessionId)
        .map(d => d.activeSessionId!);

      if (targetSessions.length > 0) {
        await Promise.all(targetSessions.map(id => sessionsApi.update(id, { status: 'PAUSED' })));
        await refetchSessions();
        toast({ title: 'Session(s) paused' });
      }
    } catch (error) {
      toast({ title: 'Error pausing session', variant: 'destructive' });
    } finally {
      setIsLoadingControls(false);
    }
  };

  const handleResume = async (targetDeviceIds?: string[]) => {
    setIsLoadingControls(true);
    try {
      const idsToUse = targetDeviceIds || selectedDeviceIds;
      const devicesToUse = devices.filter(d => idsToUse.includes(d.id));
      const targetSessions = devicesToUse
        .filter(d => d.activeSessionId)
        .map(d => d.activeSessionId!);

      if (targetSessions.length > 0) {
        await Promise.all(targetSessions.map(id => sessionsApi.update(id, { status: 'RESUMED' })));
        await refetchSessions();
        toast({ title: 'Session(s) resumed' });
      }
    } catch (error) {
      toast({ title: 'Error resuming session', variant: 'destructive' });
    } finally {
      setIsLoadingControls(false);
    }
  };

  const handleStop = async (targetDeviceIds?: string[]) => {
    setIsLoadingControls(true);
    try {
      const idsToUse = targetDeviceIds || selectedDeviceIds;
      const devicesToUse = devices.filter(d => idsToUse.includes(d.id));
      const targetSessions = devicesToUse
        .filter(d => d.activeSessionId)
        .map(d => d.activeSessionId!);

      if (targetSessions.length > 0) {
        await Promise.all(targetSessions.map(id => sessionsApi.update(id, { status: 'STOPPED' })));
        await refetchSessions();
      }
      if (!targetDeviceIds) {
        setSelectedDeviceIds([]);
        setSelectedActivities([]);
      }
      toast({ title: 'Session(s) stopped' });
    } catch (error) {
      toast({ title: 'Error stopping session', variant: 'destructive' });
    } finally {
      setIsLoadingControls(false);
    }
  };

  const handleReplay = async () => {
    setIsLoadingControls(true);
    try {
      const selectedDevs = devices.filter(d => selectedDeviceIds.includes(d.id));

      // Only replay on idle devices
      const idleDevices = selectedDevs.filter(d => d.sessionState === 'idle');

      if (idleDevices.length === 0) {
        toast({
          title: 'No idle devices',
          description: 'Please select devices that are not currently running sessions',
          variant: 'destructive',
        });
        return;
      }

      const idleDeviceIds = idleDevices.map(d => d.id);

      const response = await sessionsApi.replayMultiple(idleDeviceIds);

      await refetchSessions();
      await refetch();

      if (response && !response.error) {
        const { successful, failed } = response.data;

        if (successful.length > 0) {
          toast({
            title: 'Replay initiated',
            description: `Replaying last session on ${successful.length} device(s)${failed.length > 0 ? `. ${failed.length} failed.` : ''}`,
          });
        }

        if (failed.length > 0 && successful.length === 0) {
          toast({
            title: 'Replay failed',
            description: failed[0].error || 'Failed to replay sessions',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to replay session', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      toast({
        title: 'Failed to replay session',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingControls(false);
    }
  };

  const handleDeleteDevice = (deviceId: string) => {
    setDeviceToDelete(deviceId);
  };

  const confirmDelete = async () => {
    if (!deviceToDelete) return;

    setIsDeleting(true);
    try {
      await devicesApi.delete(deviceToDelete);
      await refetch();
      toast({ title: 'Device deleted successfully' });
      // If deleted device was selected, deselect it
      if (selectedDeviceIds.includes(deviceToDelete)) {
        handleDeviceSelect(deviceToDelete);
      }
    } catch (error: any) {
      console.error('Failed to delete device:', error);
      toast({
        title: 'Failed to delete device',
        description: error.response?.data?.message || error.message,
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
      setDeviceToDelete(null);
    }
  };

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const runningCount = devices.filter((d) => (d as any).sessionState === 'running').length;

  const activeSessions = useMemo(() => {
    if (!sessionsResponse?.data?.rows) return [];
    return sessionsResponse.data.rows.filter(s =>
      s.status === 'PLAYING' || s.status === 'PAUSED' || s.status === 'RESUMED'
    );
  }, [sessionsResponse]);

  const handleSelectAll = () => {
    const onlineDeviceIds = devices
      .filter(d => d.status === 'online')
      .map(d => d.id);

    // Toggle: if all online devices are selected, deselect all; otherwise select all
    const allOnlineSelected = onlineDeviceIds.length > 0 &&
      onlineDeviceIds.every(id => selectedDeviceIds.includes(id));

    if (allOnlineSelected) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(onlineDeviceIds);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] space-y-8 animate-fade-in p-2 md:p-6 lg:p-8">
      <VRBackground />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white neon-glow-cyan tracking-tight">Admin Dashboard</h1>
          <p className="text-cyan-400/70 text-sm font-medium">Monitoring & Control Center</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/50 group-focus-within:text-cyan-400 transition-colors" />
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="pl-10 bg-black/40 border-cyan-500/30 text-white placeholder:text-cyan-400/30 focus:ring-cyan-500/50 focus:border-cyan-500/50 w-[200px] md:w-[300px] backdrop-blur-md"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isQueryLoading || isRefetching}
            className="border-cyan-500/30 bg-black/40 text-cyan-400 hover:bg-cyan-500/20 backdrop-blur-md"
          >
            <RefreshCw className={`w-4 h-4 ${(isQueryLoading || isRefetching) ? 'animate-spin' : ''}`} />
          </Button>
          <AddDeviceDialog onSuccess={() => refetch()} />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Devices', value: apiResponse?.data?.count || devices.length, icon: Monitor, color: 'text-blue-400', glow: 'shadow-blue-500/20' },
          { label: 'Online', value: onlineCount, icon: Radio, color: 'text-emerald-400', glow: 'shadow-emerald-500/20', active: true },
          { label: 'Running Sessions', value: runningCount, icon: ActivityIcon, color: 'text-cyan-400', glow: 'shadow-cyan-500/20', pulse: runningCount > 0 },
          { label: 'Selected', value: selectedDeviceIds.length, icon: CheckCircle, color: 'text-purple-400', glow: 'shadow-purple-500/20' },
        ].map((stat, i) => (
          <div key={i} className="glassmorphism p-5 rounded-2xl group hover:scale-[1.02] transition-all duration-300 border-white/5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity`}>
              <stat.icon className={`w-12 h-12 ${stat.color}`} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-cyan-100/60 uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
                  {stat.value}
                </span>
                {stat.pulse && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Active Sessions Panel */}
          {activeSessions.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ActivityIcon className="w-5 h-5 text-cyan-400" />
                  Live Sessions
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    {activeSessions.length} Active
                  </span>
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                {activeSessions.map((session) => (
                  <div key={session.id} className="min-w-[280px] max-w-[280px] glassmorphism p-4 rounded-xl border-cyan-500/20 hover:border-cyan-500/40 transition-all relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest truncate max-w-[150px]">
                          {Array.isArray(session.activity) ? session.activity[0]?.title : session.activity?.title}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-white/50">
                          <Users className="w-3 h-3" />
                          <span>{session.device?.title || 'VR Headset'}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 animate-shimmer" style={{ width: '100%' }} />
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {session.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] bg-white/5 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/10"
                          onClick={() => handleDeviceSelect(session.deviceId)}
                        >
                          CONTROL
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Device List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-cyan-400" />
                Device Inventory
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={isQueryLoading || devices.filter(d => d.status === 'online').length === 0}
                className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                {(() => {
                  const onlineDeviceIds = devices.filter(d => d.status === 'online').map(d => d.id);
                  const allOnlineSelected = onlineDeviceIds.length > 0 &&
                    onlineDeviceIds.every(id => selectedDeviceIds.includes(id));
                  return allOnlineSelected ? "Deselect All" : "Select All Online";
                })()}
              </Button>
            </div>

            {selectedDeviceIds.length > 0 && (
              <div className="glassmorphism p-3 flex items-center justify-between border-cyan-500/30 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                    <span className="text-xs font-bold text-cyan-400">{selectedDeviceIds.length}</span>
                  </div>
                  <span className="text-sm font-semibold text-white tracking-wide">Devices Selected</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDeviceIds([])}
                    className="h-6 px-2 text-[10px] text-cyan-400/60 hover:text-cyan-400 uppercase tracking-widest"
                  >
                    Clear
                  </Button>
                </div>
                <SessionControls
                  selectedDevices={selectedDevices}
                  selectedActivities={selectedActivities}
                  activities={activities}
                  onStart={() => handleStart()}
                  onPause={() => handlePause()}
                  onResume={() => handleResume()}
                  onStop={() => handleStop()}
                  onReplay={handleReplay}
                  isLoading={isLoadingControls}
                />
              </div>
            )}

            {isQueryLoading ? (
              <div className="glassmorphism p-20 text-center rounded-3xl border-white/5">
                <div className="relative inline-block">
                  <Loader2 className="w-12 h-12 text-cyan-400 mx-auto animate-spin" />
                  <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
                </div>
                <h3 className="text-xl font-bold text-white mt-6 mb-2">Syncing Terminal...</h3>
                <p className="text-cyan-400/50 text-sm">Accessing encrypted VR frequency streams</p>
              </div>
            ) : error ? (
              <div className="glassmorphism p-20 text-center text-red-400 border-red-500/20">
                <h3 className="text-xl font-bold mb-2">System Error</h3>
                <p className="text-sm opacity-60">{(error as Error).message}</p>
              </div>
            ) : devices.length === 0 ? (
              <div className="glassmorphism p-20 text-center border-white/5">
                <Monitor className="w-16 h-16 text-cyan-400/20 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">No Uplinks Detected</h3>
                <p className="text-cyan-400/50">
                  {searchQuery ? 'Adjust search parameters' : 'Register new devices to start monitoring'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device as any}
                    isSelected={selectedDeviceIds.includes(device.id)}
                    onSelect={handleDeviceSelect}
                    onDelete={handleDeleteDevice}
                    onStart={() => handleStart([device.id])}
                    onPause={() => handlePause([device.id])}
                    onResume={() => handleResume([device.id])}
                    onStop={() => handleStop([device.id])}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div className="space-y-6">
          <div className="sticky top-24">
            <ActivitySelector
              activities={activities}
              selectedActivities={selectedActivities}
              onSelectActivity={handleSelectActivity}
              onSelectVideo={handleSelectVideo}
              onVideoUpload={refetchActivities}
              disabled={selectedDeviceIds.length === 0}
              className={cn("glassmorphism p-6 rounded-3xl border-white/10 shadow-2xl transition-all", isErrorShaking && "animate-shake")}
            />

            {/* Quick Tips or System Status */}
            <div className="mt-6 glassmorphism p-4 rounded-2xl border-white/5 bg-gradient-to-br from-cyan-500/10 to-transparent">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                System Intelligence
              </h4>
              <p className="text-xs text-cyan-100/60 leading-relaxed italic">
                "Select one or more devices from the inventory, then assign an activity from the panel above to begin training."
              </p>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deviceToDelete} onOpenChange={(open) => !open && setDeviceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}
