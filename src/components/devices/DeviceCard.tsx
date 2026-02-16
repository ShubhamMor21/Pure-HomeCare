import { Device, SessionState } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Battery, BatteryLow, BatteryMedium, Wifi, WifiOff, Monitor, Trash2, Play, Pause, RotateCcw, Square, Activity as ActivityIcon } from 'lucide-react';
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
      return { label: 'Idle', className: 'bg-white/5 text-white/40 border-white/5', glow: '' };
    case 'loading':
      return { label: 'Loading', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]' };
    case 'pending':
      return { label: 'Pending', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30', glow: '' };
    case 'ready':
      return { label: 'Ready', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' };
    case 'running':
      return { label: 'Running', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]' };
    case 'paused':
      return { label: 'Paused', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30', glow: '' };
    default:
      return { label: 'Unknown', className: 'bg-white/5 text-white/40 border-white/5', glow: '' };
  }
};

const BatteryIcon = ({ level }: { level: number }) => {
  if (level <= 20) return <BatteryLow className="w-3.5 h-3.5 text-red-400" />;
  if (level <= 50) return <BatteryMedium className="w-3.5 h-3.5 text-amber-400" />;
  return <Battery className="w-3.5 h-3.5 text-emerald-400" />;
};

export default function DeviceCard({ device, isSelected, onSelect, onDelete, onStart, onPause, onResume, onStop, disabled, hideControls }: DeviceCardProps) {
  const isOnline = device.status === 'online';
  const stateConfig = getSessionStateConfig(device.sessionState);
  const isDisabled = disabled || !isOnline;

  const isBusy = device.sessionState === 'running' || device.sessionState === 'paused' || device.sessionState === 'loading';

  return (
    <div
      className={cn(
        'group relative glassmorphism p-5 rounded-3xl transition-all duration-300 border-white/5 overflow-hidden',
        isSelected ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/50' : 'hover:border-white/20 hover:bg-white/5',
        isBusy && !isSelected && 'border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]',
        isDisabled && 'opacity-40 grayscale cursor-not-allowed'
      )}
    >
      {/* Dynamic Background Glow */}
      {isOnline && (
        <div className={cn(
          "absolute -right-20 -top-20 w-40 h-40 blur-[100px] transition-colors duration-500 rounded-full z-0",
          device.sessionState === 'running' ? "bg-cyan-500/20" :
          device.sessionState === 'ready' ? "bg-emerald-500/20" : "bg-white/5"
        )} />
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Header: Checkbox, Name, Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                disabled={isDisabled}
                onCheckedChange={() => onSelect(device.id)}
                className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
              />
            </div>
            <div className="flex flex-col">
              <h3 className="font-bold text-white tracking-tight text-lg group-hover:text-cyan-400 transition-colors">
                {device.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-white/20'
                )} />
                <span className={cn('text-[10px] font-bold uppercase tracking-widest', isOnline ? 'text-emerald-400' : 'text-white/30')}>
                  {isOnline ? 'Link Stable' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
             {isOnline && (
              <div className={cn(
                "px-2 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1.5 transition-all",
                stateConfig.className,
                stateConfig.glow
              )}>
                {device.sessionState === 'running' && (
                  <span className="w-1 h-1 rounded-full bg-current animate-ping" />
                )}
                {stateConfig.label}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(device.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Device Visualization Placeholder */}
        <div
          className="flex-1 cursor-pointer py-4"
          onClick={() => !isDisabled && onSelect(device.id)}
        >
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500",
              isOnline ? "bg-cyan-500/10 border-cyan-500/30 group-hover:scale-110 group-hover:rotate-3 shadow-[0_0_20px_rgba(34,211,238,0.1)]" : "bg-white/5 border-white/5"
            )}>
              <Monitor className={cn("w-8 h-8", isOnline ? "text-cyan-400 neon-glow-cyan" : "text-white/20")} />
            </div>

            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <span className="block text-[8px] uppercase font-bold text-white/30 tracking-tighter mb-1">Signal Strength</span>
                  <div className="flex items-center gap-1.5">
                    <Wifi className={cn("w-3.5 h-3.5", isOnline ? "text-cyan-400" : "text-white/10")} />
                    <span className="text-xs text-white/60 font-medium">{isOnline ? '98%' : '0%'}</span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <span className="block text-[8px] uppercase font-bold text-white/30 tracking-tighter mb-1">Battery Level</span>
                  <div className="flex items-center gap-1.5">
                    {isOnline && device.batteryLevel !== undefined ? (
                      <>
                        <BatteryIcon level={device.batteryLevel} />
                        <span className="text-xs text-white/60 font-medium">{device.batteryLevel}%</span>
                      </>
                    ) : (
                      <span className="text-xs text-white/20">--</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="mt-4">
            {isOnline && (device.sessions && device.sessions.length > 0 || device.currentActivity) ? (
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 group-hover:border-cyan-500/20 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                   <ActivityIcon className="w-3 h-3 text-cyan-400" />
                   <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Active Process</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {device.currentActivity || (device.sessions?.[0]?.activity)}
                  </p>
                  <p className="text-[10px] text-white/40 truncate">
                    {device.currentVideo || (device.sessions?.[0]?.video) || 'Initializing virtual environment...'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">Standby Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Footer */}
        {!hideControls && isOnline && (
          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {device.sessionState === 'running' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                  onClick={(e) => { e.stopPropagation(); onPause?.(device.id); }}
                >
                  <Pause className="w-3.5 h-3.5" />
                </Button>
              ) : device.sessionState === 'paused' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                  onClick={(e) => { e.stopPropagation(); onResume?.(device.id); }}
                >
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              ) : device.sessionState === 'ready' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20"
                  onClick={(e) => { e.stopPropagation(); onStart?.(device.id); }}
                >
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              ) : null}

              {(device.sessionState === 'running' || device.sessionState === 'paused' || device.sessionState === 'ready') && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  onClick={(e) => { e.stopPropagation(); onStop?.(device.id); }}
                >
                  <Square className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={isBusy}
              className={cn(
                "h-8 text-[10px] font-bold uppercase tracking-widest",
                isSelected ? "text-cyan-400" : "text-white/40 hover:text-white"
              )}
              onClick={(e) => { e.stopPropagation(); onSelect(device.id); }}
            >
              {isSelected ? 'SELECTED' : 'SELECT'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
