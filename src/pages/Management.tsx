import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activitiesApi, videosApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Plus,
    Video as VideoIcon,
    Loader2,
    ChevronRight,
    ChevronDown,
    Info,
    Database,
    MoreHorizontal,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from 'sonner';
import AddActivityDialog from '@/components/activities/AddActivityDialog';
import AddVideoDialog from '@/components/videos/AddVideoDialog';

const truncateText = (text: string | null | undefined, maxLength: number = 100): string => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

export default function Management() {
    const [expandedActivities, setExpandedActivities] = useState<string[]>([]);
    const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
    const [isVideoDeleteAlertOpen, setIsVideoDeleteAlertOpen] = useState(false);

    const { data: activitiesResponse, isLoading, refetch } = useQuery({
        queryKey: ['activities-management'],
        queryFn: () => activitiesApi.list(),
    });

    const activities = activitiesResponse?.data?.rows || [];

    const toggleActivity = (id: string) => {
        setExpandedActivities(prev =>
            prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
        );
    };

    const handleStatusUpdate = async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'DELETED') => {
        if (status === 'DELETED') {
            setActivityToDelete(id);
            setIsDeleteAlertOpen(true);
            return;
        }

        try {
            await activitiesApi.update(id, { status });
            toast.success('Activity status updated');
            refetch();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update activity');
        }
    };

    const confirmDelete = async () => {
        if (!activityToDelete) return;

        try {
            await activitiesApi.update(activityToDelete, { status: 'DELETED' });
            toast.success('Activity deleted');
            refetch();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete activity');
        } finally {
            setIsDeleteAlertOpen(false);
            setActivityToDelete(null);
        }
    };

    const handleVideoStatusUpdate = async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'DELETED') => {
        if (status === 'DELETED') {
            setVideoToDelete(id);
            setIsVideoDeleteAlertOpen(true);
            return;
        }

        try {
            await videosApi.update(id, { status });
            toast.success('Video status updated');
            refetch();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update video');
        }
    };

    const confirmVideoDelete = async () => {
        if (!videoToDelete) return;

        try {
            await videosApi.update(videoToDelete, { status: 'DELETED' });
            toast.success('Video deleted');
            refetch();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete video');
        } finally {
            setIsVideoDeleteAlertOpen(false);
            setVideoToDelete(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Content Management</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your training activities and their associated videos
                    </p>
                </div>
                <AddActivityDialog
                    onSuccess={refetch}
                    trigger={
                        <Button className="w-fit shadow-lg shadow-primary/20">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Activity
                        </Button>
                    }
                />
            </div>

            {isLoading ? (
                <div className="p-24 text-center">
                    <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Loading activities...</h3>
                </div>
            ) : activities.length === 0 ? (
                <div className="card-elevated p-24 text-center">
                    <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No activities found</h3>
                    <p className="text-muted-foreground mb-6">Start by adding your first training activity.</p>
                    <AddActivityDialog onSuccess={refetch} />
                </div>
            ) : (
                <div className="grid gap-4">
                    {activities.map((activity) => {
                        const isExpanded = expandedActivities.includes(activity.id);
                        const videos = activity.videos || [];

                        return (
                            <div key={activity.id} className="card-elevated overflow-hidden transition-all duration-200">
                                <div
                                    className={cn(
                                        "p-5 flex items-center justify-between transition-colors",
                                        activity.isVideoRequired === 1 && "cursor-pointer hover:bg-muted/30",
                                        isExpanded && "bg-muted/50 border-b border-border/50"
                                    )}
                                    onClick={() => activity.isVideoRequired === 1 && toggleActivity(activity.id)}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                            <Database className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-bold text-foreground">{activity.title}</h3>
                                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                                    {activity.identifier || 'NO ID'}
                                                </span>
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                    activity.status === 'ACTIVE'
                                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                        : "bg-slate-500/10 text-slate-400 border border-slate-500/10"
                                                )}>
                                                    {activity.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate max-w-xl">
                                                {activity.discription || 'No description provided'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {activity.isVideoRequired === 1 && (
                                            <div className="hidden sm:flex flex-col items-end px-4 border-r border-border/50">
                                                <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Videos</span>
                                                <span className="text-xl font-black text-primary">{videos.length}</span>
                                            </div>
                                        )}

                                        {/* Actions removed as per request */}

                                        {activity.isVideoRequired === 1 && (
                                            isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
                                        )}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-6 bg-muted/20 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <VideoIcon className="w-4 h-4 text-primary" />
                                                <h4 className="font-bold text-foreground">Activity Videos</h4>
                                            </div>
                                            {activity.isVideoRequired === 1 && (
                                                <AddVideoDialog
                                                    activityId={activity.id}
                                                    activityName={activity.title}
                                                    onSuccess={refetch}
                                                    trigger={
                                                        <Button variant="outline" size="sm" className="h-9 px-4 gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
                                                            <Plus className="w-4 h-4" />
                                                            Add Video
                                                        </Button>
                                                    }
                                                />
                                            )}
                                        </div>

                                        {videos.length === 0 ? (
                                            <div className="bg-background/50 rounded-xl border border-dashed border-border p-8 text-center">
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    {activity.isVideoRequired === 1
                                                        ? "No videos uploaded for this activity yet"
                                                        : "This activity does not require videos"}
                                                </p>
                                                {activity.isVideoRequired === 1 && (
                                                    <AddVideoDialog
                                                        activityId={activity.id}
                                                        activityName={activity.title}
                                                        onSuccess={refetch}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="grid gap-3">
                                                {videos.map((video) => (
                                                    <div key={video.id} className="bg-card rounded-lg border p-4 flex items-center justify-between hover:border-primary/30 transition-all hover:shadow-sm">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                                                <VideoIcon className="w-5 h-5 text-muted-foreground" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-foreground truncate">{video.title}</p>
                                                                <div className="flex items-center gap-3 mt-0.5">
                                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                        <Loader2 className="w-3 h-3" />
                                                                        {video.totalTime || 'N/A'}
                                                                    </span>
                                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                                    <span className="text-xs text-muted-foreground truncate">
                                                                        {truncateText(video.discription, 60)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="hidden sm:flex items-center gap-2 mr-2">
                                                                <span className={cn(
                                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                                    video.status === 'ACTIVE'
                                                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                        : "bg-slate-500/10 text-slate-400 border border-slate-500/10"
                                                                )}>
                                                                    {video.status}
                                                                </span>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                                        <MoreHorizontal className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-40">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    {video.status === 'ACTIVE' ? (
                                                                        <DropdownMenuItem
                                                                            className="text-amber-600 focus:text-amber-600"
                                                                            onClick={() => handleVideoStatusUpdate(video.id, 'INACTIVE')}
                                                                        >
                                                                            Set Inactive
                                                                        </DropdownMenuItem>
                                                                    ) : (
                                                                        <DropdownMenuItem
                                                                            className="text-emerald-600 focus:text-emerald-600"
                                                                            onClick={() => handleVideoStatusUpdate(video.id, 'ACTIVE')}
                                                                        >
                                                                            Set Active
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuItem
                                                                        className="text-destructive focus:text-destructive"
                                                                        onClick={() => {
                                                                            setVideoToDelete(video.id);
                                                                            setIsVideoDeleteAlertOpen(true);
                                                                        }}
                                                                    >
                                                                        Delete Video
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the activity and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isVideoDeleteAlertOpen} onOpenChange={setIsVideoDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Video?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the video.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmVideoDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Video
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
