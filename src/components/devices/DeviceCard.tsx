import { Device, SessionState } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Battery, BatteryLow, BatteryMedium, Wifi, WifiOff, Monitor, Trash2, Play, Pause, RotateCcw, Square } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface DeviceCardProps {
  device: Device;
  isSelected: boolean;
  onSelect: (deviceId: string) => void;
  onDelete?: (deviceId: string) => void;
  onStart?: (deviceId: string) => void;
  onPause?: (deviceId: string) => void;
  onResume?: (deviceId: string) => void;
  onStop?: (deviceId: string) => void;
  disabled?: boolean;
  hideControls?: boolean;
}

const getSessionStateConfig = (state: SessionState) => {
  switch (state) {
    case 'idle':
      return { label: 'Idle', className: 'status-idle' };
    case 'loading':
      return { label: 'Loading', className: 'status-loading' };
    case 'pending':
      return { label: 'Pending', className: 'status-idle' };
    case 'ready':
      return { label: 'Ready', className: 'status-running' };
    case 'running':
      return { label: 'Running', className: 'status-running' };
    case 'paused':
      return { label: 'Paused', className: 'status-paused' };
    default:
      return { label: 'Unknown', className: 'status-idle' };
  }
};

const BatteryIcon = ({ level }: { level: number }) => {
  if (level <= 20) return <BatteryLow className="w-4 h-4 text-destructive" />;
  if (level <= 50) return <BatteryMedium className="w-4 h-4 text-status-paused" />;
  return <Battery className="w-4 h-4 text-status-online" />;
};

export default function DeviceCard({ device, isSelected, onSelect, onDelete, onStart, onPause, onResume, onStop, disabled, hideControls }: DeviceCardProps) {
  const isOnline = device.status === 'online';
  const stateConfig = getSessionStateConfig(device.sessionState);
  const isDisabled = disabled || !isOnline;

  const isBusy = device.sessionState === 'running' || device.sessionState === 'paused' || device.sessionState === 'loading';

  return (
    <div
      className={cn(
        'group card-interactive p-4 transition-all relative',
        isSelected && 'ring-2 ring-primary border-primary',
        isBusy && !isSelected && 'border-amber-400 bg-amber-50/10 ring-1 ring-amber-400/50',
        isDisabled && 'opacity-60 cursor-not-allowed hover:shadow-sm hover:border-border'
      )}
    >
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 transition-opacity z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(device.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-start gap-4 cursor-pointer" onClick={() => !isDisabled && onSelect(device.id)}>
        {/* Selection checkbox */}
        <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            disabled={isDisabled}
            onCheckedChange={() => onSelect(device.id)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>

        {/* Device icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            isOnline ? 'bg-primary/10' : 'bg-muted'
          )}
        >
          <Monitor className={cn('w-6 h-6', isOnline ? 'text-primary' : 'text-muted-foreground')} />
        </div>

        {/* Device info */}
        <div className="flex-1 min-w-0 pr-20">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground truncate">{device.name}</h3>
            <div
              className={cn(
                'status-dot flex-shrink-0',
                isOnline ? 'status-dot-online' : 'status-dot-offline'
              )}
            />
          </div>

          {device.description && (
            <p className="text-sm text-muted-foreground mb-2 truncate">{device.description}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {/* Connection status */}
            <div className="flex items-center gap-1.5 text-xs">
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-status-online" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className={isOnline ? 'text-status-online' : 'text-muted-foreground'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Battery level */}
            {isOnline && device.batteryLevel !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BatteryIcon level={device.batteryLevel} />
                <span>{device.batteryLevel}%</span>
              </div>
            )}

            {/* Session state */}
            {isOnline && (
              <span className={cn('status-badge', stateConfig.className)}>
                {device.sessionState === 'running' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                )}
                {stateConfig.label}
              </span>
            )}
          </div>

          {/* Active sessions list */}
          {isOnline && device.sessions && device.sessions.length > 0 ? (
            <div className="mt-3 space-y-2">
              {device.sessions.map((session, index) => {
                const sessionConfig = getSessionStateConfig(session.status);
                return (
                  <div key={session.id || index} className="p-2 rounded-lg bg-muted/50 border border-muted-foreground/10 overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn('status-badge text-[10px]', sessionConfig.className)}>
                        {session.status === 'running' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        )}
                        {sessionConfig.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground break-words" title={session.activity}>
                      {session.activity && session.activity.length > 50
                        ? session.activity.substring(0, 50) + '...'
                        : session.activity}
                    </p>
                    {session.video && (
                      <p className="text-xs text-muted-foreground mt-1 break-words bg-background/50 p-1 rounded border border-muted-foreground/5" title={session.video}>
                        {session.video.length > 70
                          ? session.video.substring(0, 70) + '...'
                          : session.video}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : isOnline && device.currentActivity && (
            <div className="mt-3 p-2 rounded-lg bg-muted/50 border border-muted-foreground/10 overflow-hidden">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Current Activity</p>
              <p className="text-sm font-semibold text-foreground break-words" title={device.currentActivity}>
                {device.currentActivity && device.currentActivity.length > 50
                  ? device.currentActivity.substring(0, 50) + '...'
                  : device.currentActivity}
              </p>
              {device.currentVideo && (
                <p className="text-xs text-muted-foreground mt-1 break-words bg-background/50 p-1 rounded border border-muted-foreground/5" title={device.currentVideo}>
                  {device.currentVideo.length > 70
                    ? device.currentVideo.substring(0, 70) + '...'
                    : device.currentVideo}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
