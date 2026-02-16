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
    <div className="flex items-center gap-3 animate-fade-in">

      {hasSelection && (
        <div className="flex items-center gap-2">
          {!canStart && !hasExistingSessionToStart && !someRunningOrPaused && !canResume && (
            <span className="text-[10px] font-bold text-cyan-400/40 uppercase tracking-widest whitespace-nowrap hidden sm:inline-block px-3">
              Assign Activity
            </span>
          )}

          {/* Play/Start Button */}
          <Button
            onClick={onStart}
            disabled={!canStart || isLoading}
            size="sm"
            className={cn(
              'h-9 font-bold px-4 rounded-xl transition-all duration-300',
              canStart
                ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105 active:scale-95'
                : 'bg-white/5 text-white/20 border border-white/5'
            )}
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
            {hasExistingSessionToStart ? 'RESUME' : 'START'}
          </Button>

          {/* Pause Button */}
          {canPause && (
            <Button
              onClick={onPause}
              disabled={!canPause || isLoading}
              variant="outline"
              size="sm"
              className="h-9 font-bold border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-xl px-4"
            >
              <Pause className="w-4 h-4 mr-2 fill-current" />
              PAUSE
            </Button>
          )}

          {/* Resume Button */}
          {canResume && (
            <Button
              onClick={onResume}
              disabled={!canResume || isLoading}
              variant="outline"
              size="sm"
              className="h-9 font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl px-4"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              RESUME
            </Button>
          )}

          {/* Replay Button */}
          <Button
            onClick={onReplay}
            disabled={!hasSelection || !allIdle || isLoading}
            variant="outline"
            size="sm"
            className="h-9 font-bold border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-xl px-4"
            title={hasSelection && allIdle ? "Replay last completed session" : "Select idle devices to replay"}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            REPLAY
          </Button>

          {/* Stop Button */}
          <Button
            onClick={onStop}
            disabled={!canStop || isLoading}
            variant="destructive"
            size="sm"
            className="h-9 font-bold bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30 rounded-xl px-4"
          >
            <Square className="w-4 h-4 mr-2 fill-current" />
            STOP
          </Button>
        </div>
      )}
    </div>
  );
}
