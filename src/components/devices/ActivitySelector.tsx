import { Activity, Video, ActivityType } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Video as VideoIcon, Utensils, ChevronRight, Check } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ActivitySelectorProps {
  activities: Activity[];
  selectedActivities: {
    activityId: string;
    videoId: string | null;
  }[];
  onSelectActivity: (activityId: string) => void;
  onSelectVideo: (activityId: string, videoId: string) => void;
  disabled?: boolean;
  onVideoUpload?: () => void;
  className?: string;
}

const ActivityIcon = ({ type }: { type: ActivityType }) => {
  if (type === 'making-sandwich') return <Utensils className="w-8 h-8" />;
  return <VideoIcon className="w-8 h-8" />;
};

export default function ActivitySelector({
  activities,
  selectedActivities,
  onSelectActivity,
  onSelectVideo,
  disabled,
  onVideoUpload,
  className,
}: ActivitySelectorProps) {
  const getSelectedConfig = (activityId: string) => {
    const selectedIdsInOrder = activities
      .filter(a => selectedActivities.some(sa => sa.activityId === a.id))
      .map(a => a.id);

    const indexInSelectedOrder = selectedIdsInOrder.indexOf(activityId);
    const activitySelection = selectedActivities.find(sa => sa.activityId === activityId);
    const shouldHideOrder = selectedActivities.length <= 1;

    return indexInSelectedOrder !== -1
      ? {
        isSelected: true,
        order: indexInSelectedOrder + 1,
        videoId: activitySelection?.videoId,
        shouldHideOrder
      }
      : { isSelected: false };
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Select Training</h3>
          <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-bold mt-1">Activity Library</p>
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const config = getSelectedConfig(activity.id);
          const isSelected = config.isSelected;

          return (
            <div key={activity.id} className="group/item">
              <div
                role="button"
                tabIndex={0}
                onClick={() => !disabled && onSelectActivity(activity.id)}
                className={cn(
                  'w-full rounded-2xl border text-left transition-all duration-300 relative overflow-hidden focus:outline-none',
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                    : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10',
                  !disabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* Visual Accent */}
                <div className={cn(
                  "absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mr-16 -mt-16 transition-colors duration-500",
                  isSelected ? "bg-cyan-500" : "bg-white/10 group-hover/item:bg-white/20"
                )} />

                <div className="p-3 md:p-4 relative z-10">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-500',
                        isSelected
                          ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] rotate-3'
                          : 'bg-white/10 text-white/40 group-hover/item:text-white/60 group-hover/item:scale-105'
                      )}
                    >
                      <div className="scale-75 md:scale-100 flex items-center justify-center">
                        <ActivityIcon type={activity.id} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                        <p className={cn(
                          "font-bold text-sm md:text-base tracking-tight transition-colors truncate",
                          isSelected ? "text-cyan-400" : "text-white"
                        )}>
                          {activity.name}
                        </p>
                        {activity.hasVideos && activity.videos && activity.videos.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white/40 text-[7px] md:text-[8px] font-bold uppercase tracking-widest flex-shrink-0">
                            {activity.videos.length} STEP{activity.videos.length !== 1 && 'S'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] md:text-xs text-white/40 line-clamp-2 leading-relaxed">
                        {activity.description || 'Initialize high-fidelity simulation environment for professional training.'}
                      </p>
                    </div>

                    {isSelected ? (
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-cyan-500 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.5)] flex-shrink-0">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-black" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/10 flex items-center justify-center group-hover/item:border-white/30 transition-colors flex-shrink-0">
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white/20 group-hover/item:text-white/40" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Selection Footer Indicator */}
                {isSelected && (
                  <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 animate-shimmer" />
                )}
              </div>

              {/* Video selection for activity */}
              {isSelected && activity.hasVideos && activity.videos && (
                <div className="mt-4 ml-7 pl-6 border-l border-white/10 space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">Simulation Variants</p>
                  <div className="space-y-2">
                    {activity.videos.map((video) => {
                      const selectedVideo = config.videoId;
                      const isVideoSelected = video.id === selectedVideo;

                      return (
                        <div
                          key={video.id}
                          className={cn(
                            'group/video flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden',
                            isVideoSelected
                              ? 'border-cyan-500/30 bg-cyan-500/5'
                              : 'border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/5'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVideo(activity.id, video.id);
                          }}
                        >
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                            isVideoSelected ? "bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-white/10 group-hover/video:bg-white/30"
                          )} />

                          <div className="flex-1 cursor-pointer flex items-center justify-between">
                            <span className={cn(
                              "text-xs font-semibold transition-colors",
                              isVideoSelected ? "text-cyan-400" : "text-white/60 group-hover/video:text-white"
                            )}>
                              {video.name}
                            </span>
                            <span className="text-[10px] font-medium text-white/20 group-hover/video:text-white/40 tabular-nums">
                              {video.duration}
                            </span>
                          </div>

                          {isVideoSelected && (
                            <Check className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
