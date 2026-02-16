import { useState, useMemo, useEffect } from 'react';
import { activitiesApi, sessionsApi, SessionData } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { socket, SocketEvents } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { Loader2, RotateCcw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, CalendarIcon, Filter, History as HistoryIcon, Info, Clock, Monitor, Activity, CheckCircle, XCircle, ChevronRight, Square } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import VRBackground from '@/components/ui/VRBackground';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'active':
      return {
        label: 'Completed',
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
        icon: CheckCircle
      };
    case 'stopped':
    case 'paused':
      return {
        label: 'Stopped',
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
        icon: XCircle
      };
    case 'failed':
      return {
        label: 'Failed',
        className: 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
        icon: XCircle
      };
    case 'in-progress':
    case 'running':
      return {
        label: 'In Progress',
        className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.3)]',
        icon: Clock
      };
    default:
      return {
        label: status,
        className: 'bg-white/5 text-white/40 border-white/10',
        icon: Info
      };
  }
};

const parseDurationToSeconds = (duration: number | string | undefined): number => {
  if (!duration) return 0;
  if (typeof duration === 'number') return duration;

  if (typeof duration === 'string' && duration.includes(':')) {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    } else if (parts.length === 2) {
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    }
  }
  return 0;
};

const formatSessionDuration = (duration: number | string | undefined): string => {
  if (!duration && duration !== 0) return '--';

  const seconds = parseDurationToSeconds(duration);
  if (seconds === 0) return '--';

  const durItems = intervalToDuration({ start: 0, end: seconds * 1000 });
  return formatDuration(durItems, { format: ['hours', 'minutes', 'seconds'] }) || '--';
};

const formatSafeDate = (dateStr: string | undefined, fallbackStr: string): string => {
  if (!dateStr) {
    const fallbackDate = new Date(fallbackStr);
    return isNaN(fallbackDate.getTime()) ? '-' : format(fallbackDate, 'MMM d, yyyy HH:mm');
  }

  // Handle time-only string "HH:mm:ss" (usually UTC from backend)
  if (dateStr.includes(':') && !dateStr.includes('-') && !dateStr.includes('T')) {
    const date = new Date(fallbackStr); // fallbackStr is createdAt ISO
    const [hours, minutes, seconds] = dateStr.split(':').map(Number);
    if (!isNaN(hours)) date.setUTCHours(hours);
    if (!isNaN(minutes)) date.setUTCMinutes(minutes);
    if (!isNaN(seconds)) date.setUTCSeconds(seconds);

    return format(date, 'MMM d, yyyy HH:mm');
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    const fallbackDate = new Date(fallbackStr);
    return isNaN(fallbackDate.getTime()) ? '-' : format(fallbackDate, 'MMM d, yyyy HH:mm');
  }
  return format(date, 'MMM d, yyyy HH:mm');
};

const truncateText = (text: string | null | undefined, maxLength: number = 100): string => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export default function SessionHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const { data: sessionsResponse, isLoading, isError, error, refetch: sessionsRefetch } = useQuery({
    queryKey: ['sessions', page, limit, statusFilter, activityFilter],
    queryFn: () => sessionsApi.list({
      page,
      limit,
    }),
    staleTime: 0,
  });

  useEffect(() => {
    const handleUpdate = () => {
      console.log('Socket event received in SessionHistory, refetching...');
      sessionsRefetch();
    };

    socket.on(SocketEvents.SESSION_STATUS_CHANGE, handleUpdate);
    socket.on(SocketEvents.ACTIVITY_STATUS_CHANGE, handleUpdate);

    return () => {
      socket.off(SocketEvents.SESSION_STATUS_CHANGE, handleUpdate);
      socket.off(SocketEvents.ACTIVITY_STATUS_CHANGE, handleUpdate);
    };
  }, [sessionsRefetch]);

  const handleStopSession = async (sessionId: string) => {
    try {
      await sessionsApi.update(sessionId, { status: 'STOPPED' });
      sessionsRefetch();
    } catch (error) {
      console.error('Failed to stop session', error);
    }
  };

  const handleReplaySession = async (sessionId: string) => {
    try {
      await sessionsApi.replay(sessionId);
      sessionsRefetch();
      toast({
        title: 'Replay initiated',
        description: 'The session will start automatically when the device is ready',
      });
    } catch (error: any) {
      console.error('Failed to replay session', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      toast({
        title: 'Failed to replay session',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };


  const { data: activitiesResponse } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activitiesApi.list(),
    staleTime: 60000,
  });

  const activitiesList = activitiesResponse?.data?.rows || [];

  const sessions = sessionsResponse?.data?.rows || [];
  const totalCount = sessionsResponse?.data?.count || 0;
  const totalPages = sessionsResponse?.data?.totalPages || 0;

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const deviceTitle = session.device?.title || '';
      const deviceId = session.device?.deviceId || '';
      const activityTitle = Array.isArray(session.activity)
        ? session.activity.map(a => a.title).join(', ')
        : (session.activity?.title || '');

      const matchesSearch =
        deviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activityTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || session.status.toLowerCase() === statusFilter.toLowerCase();
      // Using activity title or ID for activity filter
      const matchesActivity = activityFilter === 'all' || session.activityId === activityFilter;

      const sessionDate = (() => {
        const baseDate = new Date(session.createdAt);
        if (session.startTime && session.startTime.includes(':') && !session.startTime.includes('-') && !session.startTime.includes('T')) {
          const [hours, minutes, seconds] = session.startTime.split(':').map(Number);
          if (!isNaN(hours)) baseDate.setUTCHours(hours);
          if (!isNaN(minutes)) baseDate.setUTCMinutes(minutes);
          if (!isNaN(seconds)) baseDate.setUTCSeconds(seconds);
        }
        return baseDate;
      })();
      const matchesDateRange =
        isNaN(sessionDate.getTime()) || (
          (!dateRange.from || sessionDate >= dateRange.from) &&
          (!dateRange.to || sessionDate <= dateRange.to)
        );

      return matchesSearch && matchesStatus && matchesActivity && matchesDateRange;
    });
  }, [sessions, searchQuery, statusFilter, activityFilter, dateRange]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setActivityFilter('all');
    setDateRange({ from: undefined, to: undefined });
    setPage(1);
  };

  const hasActiveFilters =
    searchQuery || statusFilter !== 'all' || activityFilter !== 'all' || dateRange.from || dateRange.to;

  const avgDuration = useMemo(() => {
    if (filteredSessions.length === 0) return '0s';
    const total = filteredSessions.reduce((acc, s) => {
      const duration = parseDurationToSeconds(s.duration);
      if (duration > 0) return acc + duration;
      const videos = Array.isArray(s.video) ? s.video : (s.video ? [s.video] : []);
      return acc + videos.reduce((vAcc, v) => vAcc + parseDurationToSeconds(v.totalTime), 0);
    }, 0);
    return formatSessionDuration(Math.round(total / filteredSessions.length));
  }, [filteredSessions]);

  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);

  return (
    <div className="relative min-h-full space-y-8 animate-fade-in p-4 md:p-6 lg:p-8">
      <VRBackground />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white neon-glow-cyan tracking-tight">Session History</h1>
          <p className="text-cyan-400/70 text-sm font-medium">Review and analyze past VR training sessions</p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Sessions', value: totalCount, icon: HistoryIcon, color: 'text-blue-400' },
          { label: 'Completed', value: filteredSessions.filter((s) => s.status.toLowerCase() === 'completed').length, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Stopped', value: filteredSessions.filter((s) => s.status.toLowerCase() === 'stopped').length, icon: XCircle, color: 'text-amber-400' },
          { label: 'Avg. Duration', value: avgDuration, icon: Clock, color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="glassmorphism p-5 rounded-2xl border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className={`w-12 h-12 ${stat.color}`} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-cyan-100/60 uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modern Filter Panel */}
      <div className="glassmorphism p-6 rounded-3xl border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/50 group-focus-within:text-cyan-400 transition-colors" />
            <Input
              placeholder="Search by device or activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 border-cyan-500/20 text-white placeholder:text-cyan-400/30 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white rounded-xl focus:ring-cyan-500/20">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d2a4a] border-white/10 text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
              </SelectContent>
            </Select>

            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white rounded-xl focus:ring-cyan-500/20">
                <SelectValue placeholder="Activity" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d2a4a] border-white/10 text-white">
                <SelectItem value="all">All Activities</SelectItem>
                {activitiesList.map((activity) => (
                  <SelectItem key={activity.id} value={activity.id}>
                    {activity.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start bg-black/40 border-cyan-500/20 text-white hover:bg-cyan-500/10 rounded-xl">
                  <CalendarIcon className="w-4 h-4 mr-2 text-cyan-400" />
                  <span className="truncate">
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>{format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}</>
                      ) : (
                        format(dateRange.from, 'MMM d, yyyy')
                      )
                    ) : (
                      'Date range'
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#0d2a4a] border-white/10" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  className="p-3 text-white pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl">
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Session List Redesign */}
      <TooltipProvider>
        <div className="space-y-4">
          {isLoading ? (
            <div className="glassmorphism p-20 text-center rounded-3xl border-white/5">
              <Loader2 className="w-12 h-12 text-cyan-400 mx-auto mb-6 animate-spin" />
              <h3 className="text-xl font-bold text-white mb-2">Accessing Data Logs...</h3>
              <p className="text-cyan-400/50 text-sm font-medium">Synchronizing with central VR database</p>
            </div>
          ) : isError ? (
            <div className="glassmorphism p-20 text-center text-red-400 border-red-500/20 rounded-3xl">
              <XCircle className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Protocol Failure</h3>
              <p className="text-sm opacity-60">{(error as Error).message}</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="glassmorphism p-20 text-center border-white/5 rounded-3xl">
              <HistoryIcon className="w-16 h-16 text-cyan-400/20 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-2">Archive Empty</h3>
              <p className="text-cyan-400/50">No training records found matching the current filters</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSessions.map((session) => {
                const statusConfig = getStatusConfig(session.status);
                const activities = Array.isArray(session.activity) ? session.activity : (session.activity ? [session.activity] : []);
                const videos = Array.isArray(session.video) ? session.video : (session.video ? [session.video] : []);

                return (
                  <div
                    key={session.id}
                    className="group glassmorphism p-4 md:p-6 rounded-2xl border-white/5 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer relative overflow-hidden"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20 group-hover:bg-cyan-500 transition-all duration-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]" />

                    <div className="flex flex-col lg:flex-row lg:items-center gap-6 relative z-10">
                      {/* Device & Activity Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Monitor className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-white text-lg tracking-tight truncate group-hover:text-cyan-400 transition-colors">
                              {session.device?.title || 'Unknown Headset'}
                            </h3>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                              {session.device?.deviceId || 'No ID'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs font-semibold text-cyan-100/60 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-cyan-400/60" />
                            {activities.length === 1 ? activities[0].title : `${activities.length} Activities`}
                          </span>
                          {videos.length > 0 && (
                            <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5 text-white/40">
                              {videos.length} VIDEO{videos.length !== 1 && 'S'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Timeline Info */}
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="block text-[8px] uppercase font-bold text-white/30 tracking-tighter">Start Time</span>
                          <div className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
                            <CalendarIcon className="w-3.5 h-3.5 text-cyan-400/60" />
                            {formatSafeDate(session.startTime, session.createdAt)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="block text-[8px] uppercase font-bold text-white/30 tracking-tighter">Duration</span>
                          <div className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
                            <Clock className="w-3.5 h-3.5 text-cyan-400/60" />
                            {(() => {
                              if (session.duration) return formatSessionDuration(session.duration);
                              const totalSeconds = videos.reduce((acc, v) => acc + parseDurationToSeconds(v.totalTime), 0);
                              return formatSessionDuration(totalSeconds);
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 min-w-[200px]">
                        <div className={cn(
                          "px-3 py-1.5 rounded-full border text-[10px] font-bold flex items-center gap-2 uppercase tracking-widest",
                          statusConfig.className
                        )}>
                          <statusConfig.icon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </div>

                        <div className="flex items-center gap-2">
                          {['completed', 'stopped'].includes(session.status.toLowerCase()) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReplaySession(session.id);
                              }}
                              disabled={session.isReplay === true}
                              className="h-9 font-bold border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-400 hover:text-black rounded-xl px-4 transition-all"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-2" />
                              REPLAY
                            </Button>
                          ) : ['playing', 'paused', 'ready', 'pending', 'resumed', 'in-progress', 'running'].includes(session.status.toLowerCase()) ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStopSession(session.id);
                              }}
                              className="h-9 font-bold bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/40 rounded-xl px-4"
                            >
                              <Square className="w-3.5 h-3.5 mr-2 fill-current" />
                              STOP
                            </Button>
                          ) : null}

                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 group-hover:text-cyan-400 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 glassmorphism rounded-3xl border-white/5 mt-8">
              <p className="text-sm font-medium text-cyan-400/50">
                Log Page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span> — {totalCount} Records
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className="bg-black/40 border-white/10 text-white hover:bg-white/5 rounded-xl px-6"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                  className="bg-black/40 border-white/10 text-white hover:bg-white/5 rounded-xl px-6"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </TooltipProvider>

      {/* Session Detail Drawer */}
      <Sheet open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <SheetContent className="bg-[#0a1f38] border-l border-white/10 text-white sm:max-w-md overflow-y-auto no-scrollbar">
          {selectedSession && (
            <div className="space-y-8 py-6">
              <SheetHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-white tracking-tight">Session Intelligence</SheetTitle>
                    <p className="text-cyan-400/50 text-xs font-bold uppercase tracking-widest">Archive Reference: {selectedSession.id.slice(0, 8)}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                {/* Device Info */}
                <div className="glassmorphism p-5 rounded-2xl border-white/5">
                  <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-4">Device Metrics</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/40">Headset Title</span>
                      <span className="text-sm font-bold text-white">{selectedSession.device?.title}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/40">Hardware ID</span>
                      <span className="text-sm font-mono text-cyan-400/70">{selectedSession.device?.deviceId}</span>
                    </div>
                  </div>
                </div>

                {/* Training Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest pl-1">Protocol Timeline</h4>
                  {(() => {
                    const activities = Array.isArray(selectedSession.activity) ? selectedSession.activity : (selectedSession.activity ? [selectedSession.activity] : []);
                    const videos = Array.isArray(selectedSession.video) ? selectedSession.video : (selectedSession.video ? [selectedSession.video] : []);

                    return (
                      <div className="space-y-4">
                        {activities.map((activity, idx) => {
                          const activityVideos = videos.filter(v => v.activityId === activity.id);
                          return (
                            <div key={idx} className="glassmorphism p-4 rounded-xl border-white/5 bg-gradient-to-r from-white/5 to-transparent relative">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-white tracking-wide">{activity.title}</span>
                                <span className="text-[10px] font-bold text-cyan-400/40">{activityVideos.length} Steps</span>
                              </div>
                              <div className="space-y-2">
                                {activityVideos.map((v, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-black/20 text-[11px]">
                                    <span className="text-white/60 truncate max-w-[180px]">{v.title}</span>
                                    <span className="text-cyan-400/40 tabular-nums">{v.totalTime || '0:00'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Session Controls */}
                <div className="pt-6 border-t border-white/5">
                  <Button
                    onClick={() => handleReplaySession(selectedSession.id)}
                    disabled={selectedSession.isReplay === true}
                    className="w-full h-12 bg-cyan-500 text-black hover:bg-cyan-400 font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all rounded-xl"
                  >
                    <RotateCcw className="w-5 h-5 mr-3" />
                    INITIATE REPLAY SEQUENCE
                  </Button>
                  <p className="text-center text-[10px] text-white/20 mt-4 uppercase tracking-tighter">
                    Authorized Trainer override required for live re-routing
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
