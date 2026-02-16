import { Device, ActivityType, Activity } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Play, Pause, RotateCcw, Square, Loader2, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionControlsProps {
  selectedDevices: Device[];
  selectedActivities: {
    activityId: string;
    videoId: string | null;
  }[];
  activities: Activity[];
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReplay: () => void;
  isLoading?: boolean;
}

export default function SessionControls({
  selectedDevices,
  selectedActivities,
  activities,
  onStart,
  onPause,
  onResume,
  onStop,
  onReplay,
  isLoading,
}: SessionControlsProps) {
  const hasSelection = selectedDevices.length > 0;
  const allIdle = selectedDevices.every((d) => d.sessionState === 'idle');
  const allRunning = selectedDevices.every((d) => d.sessionState === 'running');
  const allPaused = selectedDevices.every((d) => d.sessionState === 'paused');
  const someRunningOrPaused = selectedDevices.some(
    (d) => d.sessionState === 'running' || d.sessionState === 'paused'
  );

  // Validate selection
  const isSequenceValid = selectedActivities.length > 0;

  // Calculate total videos across all activities
  const totalVideosInSession = selectedActivities.length > 0
    ? selectedActivities.reduce((acc, sa) => {
      const activity = activities.find(a => a.id === sa.activityId);
      if (!activity?.hasVideos || !sa.videoId) return acc + 1;
      const startIdx = activity.videos?.findIndex(v => v.id === sa.videoId) ?? 0;
      return acc + (activity.videos?.length ?? 0) - startIdx;
    }, 0)
    : selectedDevices.filter(d => d.sessionState === 'pending' || d.sessionState === 'ready').length;

  const hasExistingSessionToStart = selectedDevices.some(d => d.sessionState === 'pending' || d.sessionState === 'ready');
  const somePending = selectedDevices.some(d => d.sessionState === 'pending');
  // Check if any running/paused session requires video controls
  // If isVideoRequired is 0, we should not show pause/resume buttons
  const runningSessionsRequireVideo = selectedDevices
    .filter(d => d.sessionState === 'running')
    .some(d => d.isVideoRequired !== 0);

  const pausedSessionsRequireVideo = selectedDevices
    .filter(d => d.sessionState === 'paused')
    .some(d => d.isVideoRequired !== 0);

  const canStart = hasSelection && !somePending && (allIdle || hasExistingSessionToStart) && (isSequenceValid || hasExistingSessionToStart);
  // Only allow pause if we have running sessions AND at least one of them requires video
  const canPause = hasSelection && selectedDevices.some((d) => d.sessionState === 'running') && runningSessionsRequireVideo;
  // Only allow resume if we have paused sessions AND at least one of them requires video
  const canResume = hasSelection && selectedDevices.some((d) => d.sessionState === 'paused') && pausedSessionsRequireVideo;
  const canStop = hasSelection && someRunningOrPaused;


  return (
    <div className="flex items-center gap-2 animate-fade-in">

      {hasSelection && (
        <div className="flex items-center gap-2">
          {!canStart && !hasExistingSessionToStart && !someRunningOrPaused && !canResume && (
            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline-block">Select activity</span>
          )}

          {/* Play/Start Button */}
          <Button
            onClick={onStart}
            disabled={!canStart || isLoading}
            size="sm"
            className={cn(
              'h-9',
              canStart && 'bg-status-running hover:bg-status-running/90'
            )}
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            {hasExistingSessionToStart ? 'Play' : 'Start'}
          </Button>

          {/* Pause Button - always visible, disabled when not applicable */}
          {canPause && (
            <Button
              onClick={onPause}
              disabled={!canPause || isLoading}
              variant="secondary"
              size="sm"
              className="h-9 hover:bg-status-paused/10 hover:text-status-paused hover:border-status-paused/20 transition-all"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}

          {/* Resume Button - always visible, disabled when not applicable */}
          {canResume && (
            <Button
              onClick={onResume}
              disabled={!canResume || isLoading}
              variant="secondary"
              size="sm"
              className="h-9 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}

          {/* Replay Button - replay last completed session */}
          <Button
            onClick={onReplay}
            disabled={!hasSelection || !allIdle || isLoading}
            variant="secondary"
            size="sm"
            className="h-9 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/20 transition-all"
            title={hasSelection && allIdle ? "Replay last completed session" : "Select idle devices to replay"}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Replay
          </Button>

          {/* Stop Button - always visible, disabled when not applicable */}
          <Button
            onClick={onStop}
            disabled={!canStop || isLoading}
            variant="destructive"
            size="sm"
            className="h-9"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
        </div>
      )}
    </div>
  );
}
