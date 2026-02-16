import { useState, useMemo, useEffect, useRef } from 'react';
import { Activity, Device, ActivityType } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import DeviceCard from '@/components/devices/DeviceCard';
import ActivitySelector from '@/components/devices/ActivitySelector';
import SessionControls from '@/components/devices/SessionControls';
import { Input } from '@/components/ui/input';
import AddDeviceDialog from '@/components/devices/AddDeviceDialog';
import { Search, RefreshCw, Monitor, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-6 animate-fade-in">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Total Devices</p>
          <p className="text-2xl font-bold text-foreground">{apiResponse?.data?.count || devices.length}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Online</p>
          <p className="text-2xl font-bold text-status-online">{onlineCount}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Running Sessions</p>
          <p className="text-2xl font-bold text-status-running">{runningCount}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Selected</p>
          <p className="text-2xl font-bold text-primary">{selectedDeviceIds.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Device List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search devices and press Enter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleSelectAll}
              disabled={isQueryLoading || devices.filter(d => d.status === 'online').length === 0}
              title={(() => {
                const onlineDeviceIds = devices.filter(d => d.status === 'online').map(d => d.id);
                const allOnlineSelected = onlineDeviceIds.length > 0 &&
                  onlineDeviceIds.every(id => selectedDeviceIds.includes(id));
                return allOnlineSelected ? "Deselect all devices" : "Select all online devices";
              })()}
            >
              {(() => {
                const onlineDeviceIds = devices.filter(d => d.status === 'online').map(d => d.id);
                const allOnlineSelected = onlineDeviceIds.length > 0 &&
                  onlineDeviceIds.every(id => selectedDeviceIds.includes(id));
                return allOnlineSelected ? "Deselect All" : "Select All";
              })()}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isQueryLoading || isRefetching}
              title="Refresh device list"
            >
              <RefreshCw className={`w-4 h-4 ${(isQueryLoading || isRefetching) ? 'animate-spin' : ''}`} />
            </Button>
            <AddDeviceDialog onSuccess={() => refetch()} />
          </div>

          {(selectedDeviceIds.length > 0) && (
            <div className="card-elevated p-2 flex items-center justify-between animate-fade-in bg-muted/30 border-dashed">
              <div className="flex items-center gap-2 px-2">
                <span className="text-sm font-medium">{selectedDeviceIds.length} Selected</span>
                {(selectedDeviceIds.length > 0) && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDeviceIds([])} className="h-6 px-2 text-xs text-muted-foreground">
                    Clear
                  </Button>
                )}
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
            <div className="card-elevated p-12 text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-foreground mb-2">Fetching devices...</h3>
            </div>
          ) : error ? (
            <div className="card-elevated p-12 text-center text-destructive">
              <h3 className="text-lg font-medium mb-2">Error loading devices</h3>
              <p>{(error as Error).message}</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="card-elevated p-12 text-center">
              <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No devices found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'No VR devices are registered yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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

        {/* Control Panel */}
        <div className="space-y-6">
          <ActivitySelector
            activities={activities}
            selectedActivities={selectedActivities}
            onSelectActivity={handleSelectActivity}
            onSelectVideo={handleSelectVideo}
            onVideoUpload={refetchActivities}
            disabled={selectedDeviceIds.length === 0}
            className={cn("card-elevated p-5 transition-transform", isErrorShaking && "animate-shake")}
          />
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