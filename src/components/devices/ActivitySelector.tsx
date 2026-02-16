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
  // Use string based comparison since ActivityType is now string
  if (type === 'making-sandwich') return <Utensils className="w-5 h-5" />;
  return <VideoIcon className="w-5 h-5" />;
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
    // Determine the stable order: list of IDs for selected activities, in the order they appear in the 'activities' array
    const selectedIdsInOrder = activities
      .filter(a => selectedActivities.some(sa => sa.activityId === a.id))
      .map(a => a.id);

    const indexInSelectedOrder = selectedIdsInOrder.indexOf(activityId);
    const activitySelection = selectedActivities.find(sa => sa.activityId === activityId);

    // Check if we should hide the sequence number
    // Only hide if only one activity is selected
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
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Select Activity</h3>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const config = getSelectedConfig(activity.id);
          const isSelected = config.isSelected;

          return (
            <div key={activity.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => !disabled && onSelectActivity(activity.id)}
                onKeyDown={(e) => {
                  if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectActivity(activity.id);
                  }
                }}
                className={cn(
                  'w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:border-primary/30 hover:bg-muted/50',
                  !disabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center relative',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <ActivityIcon type={activity.id} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{activity.name}</p>
                      {activity.hasVideos && activity.videos && activity.videos.length > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                          {activity.videos.length} {activity.videos.length === 1 ? 'Video' : 'Videos'}
                        </span>
                      ) : activity.hasVideos && (
                        <span className="px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-wider">
                          No Videos Available
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-muted-foreground truncate flex-1">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Video selection for activity */}
              {isSelected && activity.hasVideos && activity.videos && (
                <div className="mt-3 ml-4 pl-4 border-l-2 border-primary/30 animate-fade-in">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Select Video</p>
                  <div className="space-y-2">
                    {activity.videos.map((video) => {
                      const selectedVideo = config.videoId;
                      const isSelected = video.id === selectedVideo;

                      return (
                        <div
                          key={video.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden',
                            isSelected
                              ? 'border-primary bg-primary/10 ring-1 ring-primary'
                              : 'border-border hover:border-primary/30 hover:bg-muted/50'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVideo(activity.id, video.id);
                          }}
                        >
                          {isSelected && (
                            <div className="w-2 h-full absolute left-0 top-0 bg-primary" />
                          )}

                          <div className="flex-1 ml-1 cursor-pointer flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {video.name}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                                  Selected
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">{video.duration}</span>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
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
