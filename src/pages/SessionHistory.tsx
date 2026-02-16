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
import {
  Search,
  CalendarIcon,
  Filter,
  History as HistoryIcon,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'active':
      return { label: 'Completed', className: 'status-running' };
    case 'stopped':
    case 'paused':
      return { label: 'Stopped', className: 'status-paused' };
    case 'failed':
      return { label: 'Failed', className: 'bg-destructive/15 text-destructive' };
    case 'in-progress':
    case 'running':
      return { label: 'In Progress', className: 'status-loading' };
    default:
      return { label: status, className: 'status-idle' };
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Session History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View and filter past VR training sessions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-elevated p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by device or activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-44 bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
              {/* <SelectItem value="failed">Failed</SelectItem> */}
              <SelectItem value="in-progress">In Progress</SelectItem>
            </SelectContent>
          </Select>

          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-full lg:w-44 bg-background">
              <SelectValue placeholder="Activity" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
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
              <Button variant="outline" className="w-full lg:w-52 justify-start">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                    </>
                  ) : (
                    format(dateRange.from, 'MMM d, yyyy')
                  )
                ) : (
                  'Date range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <TooltipProvider>
        <div className="card-elevated overflow-hidden">
          {isLoading ? (
            <div className="p-24 text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-foreground mb-2">Fetching sessions...</h3>
            </div>
          ) : isError ? (
            <div className="p-24 text-center text-destructive">
              <h3 className="text-lg font-medium mb-2">Error loading sessions</h3>
              <p>{(error as Error).message}</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-12 text-center">
              <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No sessions found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'No training sessions have been recorded yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Device</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Video</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => {
                  const statusConfig = getStatusConfig(session.status);
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{session.device?.title || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{session.device?.deviceId || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const activities = Array.isArray(session.activity) ? session.activity : (session.activity ? [session.activity] : []);
                          if (activities.length === 0) return '-';
                          if (activities.length === 1) return <span className="text-foreground">{activities[0].title}</span>;

                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-medium">{activities.length} Activities</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0 rounded-full hover:bg-muted">
                                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[300px] p-3 shadow-xl border-primary/20 bg-card">
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary border-b border-primary/10 pb-1">Activity List</p>
                                    <ul className="space-y-1">
                                      {activities.map((a, i) => (
                                        <li key={i} className="text-xs font-medium text-foreground flex items-center gap-1.5">
                                          <div className="w-1 h-1 rounded-full bg-primary" />
                                          {a.title}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const videos = Array.isArray(session.video) ? session.video : (session.video ? [session.video] : []);
                          const activities = Array.isArray(session.activity) ? session.activity : (session.activity ? [session.activity] : []);

                          if (videos.length === 0) return '-';
                          if (videos.length === 1) {
                            return (
                              <div className="flex flex-col">
                                <span className="text-sm text-foreground">{truncateText(videos[0].title, 50)}</span>
                                <span className="text-[10px] text-muted-foreground">{videos[0].totalTime || '-'}</span>
                              </div>
                            );
                          }

                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-sm font-medium">{videos.length} Videos</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0 rounded-full hover:bg-muted">
                                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[350px] p-0 shadow-2xl border-primary/20 bg-card overflow-hidden">
                                  <div className="bg-primary/5 px-3 py-2 border-b border-primary/10">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Video Breakdown</p>
                                  </div>
                                  <div className="p-3 space-y-3 max-h-[300px] overflow-y-auto">
                                    {activities.map((activity, idx) => {
                                      const activityVideos = videos.filter(v => v.activityId === activity.id);
                                      if (activityVideos.length === 0) return null;

                                      return (
                                        <div key={idx} className="space-y-1.5">
                                          <div className="flex items-center gap-2">
                                            <div className="h-px flex-1 bg-border/50" />
                                            <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">{activity.title}</span>
                                            <div className="h-px flex-1 bg-border/50" />
                                          </div>
                                          <ul className="space-y-1.5 ml-1">
                                            {activityVideos.map((v, i) => (
                                              <li key={i} className="flex items-center justify-between gap-4">
                                                <span className="text-xs font-medium text-foreground truncate">{v.title}</span>
                                                <span className="text-[10px] tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded whitespace-nowrap">
                                                  {v.totalTime || '-'}
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      );
                                    })}
                                    {/* Handle videos with no activityId match if any */}
                                    {(() => {
                                      const linkedVideoIds = activities.flatMap(a => videos.filter(v => v.activityId === a.id).map(v => v.id));
                                      const unlinkedVideos = videos.filter(v => !linkedVideoIds.includes(v.id));
                                      if (unlinkedVideos.length === 0) return null;

                                      return (
                                        <div className="space-y-1.5 pt-1">
                                          <div className="flex items-center gap-2">
                                            <div className="h-px flex-1 bg-border/50" />
                                            <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">Other Videos</span>
                                            <div className="h-px flex-1 bg-border/50" />
                                          </div>
                                          <ul className="space-y-1.5 ml-1">
                                            {unlinkedVideos.map((v, i) => (
                                              <li key={i} className="flex items-center justify-between gap-4">
                                                <span className="text-xs font-medium text-foreground truncate">{v.title}</span>
                                                <span className="text-[10px] tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded whitespace-nowrap">
                                                  {v.totalTime || '-'}
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  <div className="bg-muted/30 px-3 py-2 border-t border-border flex items-center justify-between">
                                    <span className="text-[10px] font-medium text-muted-foreground">Total Playback</span>
                                    <span className="text-[10px] font-bold text-primary">{videos.length} Videos</span>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatSafeDate(session.startTime, session.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(() => {
                          if (session.duration) return formatSessionDuration(session.duration);
                          const videos = Array.isArray(session.video) ? session.video : (session.video ? [session.video] : []);
                          const totalSeconds = videos.reduce((acc, v) => acc + parseDurationToSeconds(v.totalTime), 0);
                          return formatSessionDuration(totalSeconds);
                        })()}
                      </TableCell>
                      <TableCell>
                        <span className={cn('status-badge', statusConfig.className)}>
                          {(session.status.toLowerCase() === 'in-progress' || session.status.toLowerCase() === 'running') && (
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          )}
                          {statusConfig.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {['playing', 'paused', 'ready', 'pending', 'resumed', 'in-progress', 'running'].includes(session.status.toLowerCase()) ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStopSession(session.id)}
                            className="h-8"
                          >
                            Stop
                          </Button>
                        ) : ['completed', 'stopped'].includes(session.status.toLowerCase()) ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleReplaySession(session.id)}
                            disabled={session.isReplay === true}
                            className="h-8 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/20 transition-all"
                            title={session.isReplay ? "This session is already being replayed" : "Replay this session"}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Replay
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Showing page {page} of {totalPages} ({totalCount} sessions)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </TooltipProvider>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Total Sessions</p>
          <p className="text-2xl font-bold text-foreground">{totalCount}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-status-online">
            {filteredSessions.filter((s) => s.status.toLowerCase() === 'completed').length}
          </p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Stopped</p>
          <p className="text-2xl font-bold text-status-paused">
            {filteredSessions.filter((s) => s.status.toLowerCase() === 'stopped').length}
          </p>
        </div>
        {/* <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Failed</p>
          <p className="text-2xl font-bold text-destructive">
            {filteredSessions.filter((s) => s.status.toLowerCase() === 'failed').length}
          </p>
        </div> */}
      </div>
    </div>
  );
}
