import { useState, useMemo } from 'react';
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
    Trash2,
    Folder,
    FolderPlus,
    Layers,
    Grid,
    List,
    Search,
    ArrowLeft,
    Filter,
    Clock,
    Settings,
    MoreVertical,
    Download,
    Upload,
    Share2,
    FileText,
    Archive,
    Monitor,
    CheckCircle,
    XCircle,
    LayoutGrid,
    History
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
import VRBackground from '@/components/ui/VRBackground';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const truncateText = (text: string | null | undefined, maxLength: number = 100): string => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

const CATEGORIES = [
    { id: 'all', label: 'All Activities', icon: Layers, color: 'text-cyan-400' },
    { id: 'active', label: 'Active', icon: CheckCircle, color: 'text-emerald-400' },
    { id: 'drafts', label: 'Drafts', icon: FileText, color: 'text-amber-400' },
    { id: 'archived', label: 'Archived', icon: Archive, color: 'text-slate-400' },
];

const TAGS = [
    'Healthcare', 'Safety', 'Compliance', 'Soft Skills', 'Technical'
];

export default function Management() {
    const [view, setView] = useState<'folders' | 'activity'>('folders');
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
    const [currentCategory, setCurrentCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
    const [isVideoDeleteAlertOpen, setIsVideoDeleteAlertOpen] = useState(false);

    const { data: activitiesResponse, isLoading, refetch } = useQuery({
        queryKey: ['activities-management'],
        queryFn: () => activitiesApi.list(),
    });

    const activities = activitiesResponse?.data?.rows || [];

    const selectedActivity = useMemo(() =>
        activities.find(a => a.id === selectedActivityId),
    [activities, selectedActivityId]);

    const filteredActivities = useMemo(() => {
        return activities.filter(activity => {
            const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 activity.identifier?.toLowerCase().includes(searchQuery.toLowerCase());

            if (currentCategory === 'all') return matchesSearch;
            if (currentCategory === 'active') return matchesSearch && activity.status === 'ACTIVE';
            if (currentCategory === 'drafts') return matchesSearch && activity.status === 'INACTIVE';
            if (currentCategory === 'archived') return matchesSearch && activity.status === 'DELETED';
            return matchesSearch;
        });
    }, [activities, searchQuery, currentCategory]);

    const handleActivityClick = (activityId: string) => {
        setSelectedActivityId(activityId);
        setView('activity');
    };

    const handleBackToFolders = () => {
        setView('folders');
        setSelectedActivityId(null);
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
            if (selectedActivityId === activityToDelete) {
                handleBackToFolders();
            }
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
        <div className="relative min-h-[calc(100vh-4rem)] flex flex-col space-y-6 animate-fade-in p-2 md:p-6 lg:p-8 overflow-hidden">
            <VRBackground />

            {/* Header Section */}
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-black/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                        <Layers className="w-8 h-8 text-cyan-400" />
                        Content Library
                    </h1>
                    <p className="text-cyan-400/60 font-medium tracking-wider text-sm mt-1 uppercase">
                        Manage activities, folders, and VR videos
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <AddActivityDialog
                        onSuccess={refetch}
                        trigger={
                            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                                <Plus className="w-5 h-5 mr-2" />
                                ADD ACTIVITY
                            </Button>
                        }
                    />
                    <Button variant="outline" className="border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10 font-bold">
                        <Upload className="w-4 h-4 mr-2" />
                        UPLOAD VIDEO
                    </Button>
                    <Button variant="outline" className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 font-bold">
                        <Download className="w-4 h-4 mr-2" />
                        IMPORT
                    </Button>
                </div>
            </div>

            <div className="relative z-10 flex flex-1 gap-6 overflow-hidden">
                {/* Left Panel - Navigation */}
                <div className="hidden lg:flex flex-col w-72 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <Input
                                placeholder="Search library..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-cyan-500/50"
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-6">
                            <div>
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 px-2">Root Folders</h3>
                                <div className="space-y-1">
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setCurrentCategory(cat.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group",
                                                currentCategory === cat.id
                                                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                                                    : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <cat.icon className={cn("w-4 h-4 transition-colors", currentCategory === cat.id ? cat.color : "group-hover:text-white")} />
                                                <span className="font-bold text-sm tracking-wide uppercase">{cat.label}</span>
                                            </div>
                                            {currentCategory === cat.id && (
                                                <div className="w-1 h-4 bg-cyan-400 rounded-full" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 px-2">Tags & Categories</h3>
                                <div className="space-y-1">
                                    {TAGS.map((tag) => (
                                        <button
                                            key={tag}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all group border border-transparent"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 group-hover:bg-cyan-400 group-hover:shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                                            <span className="font-bold text-sm tracking-wide uppercase">{tag}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t border-white/5 bg-black/20">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                                <Monitor className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Library Status</p>
                                <p className="text-xs text-white/60 truncate uppercase font-bold">Synchronized</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                    {/* Breadcrumbs / View Header */}
                    <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                            <button
                                onClick={handleBackToFolders}
                                className={cn(
                                    "text-white/40 hover:text-cyan-400 transition-colors",
                                    view === 'folders' && "pointer-events-none"
                                )}
                            >
                                CONTENT LIBRARY
                            </button>
                            {view === 'activity' && (
                                <>
                                    <ChevronRight className="w-4 h-4 text-white/20" />
                                    <span className="text-cyan-400">{selectedActivity?.title}</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/5">
                                <Grid className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/5">
                                <List className="w-4 h-4" />
                            </Button>
                            <Separator orientation="vertical" className="h-4 bg-white/10 mx-1" />
                            <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/5">
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-32">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                                        <Layers className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-cyan-400" />
                                    </div>
                                    <p className="mt-4 text-cyan-400 font-bold tracking-widest uppercase animate-pulse">Initializing Library...</p>
                                </div>
                            ) : view === 'folders' ? (
                                <>
                                    {filteredActivities.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-32 text-center">
                                            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                                <FolderPlus className="w-10 h-10 text-white/20" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2">Empty Archive</h3>
                                            <p className="text-white/40 max-w-md mx-auto mb-8 uppercase text-sm font-medium tracking-wide">
                                                No activities found in this sector. Initiate a new training activity to begin.
                                            </p>
                                            <AddActivityDialog onSuccess={refetch} />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                            {filteredActivities.map((activity) => (
                                                <div
                                                    key={activity.id}
                                                    onClick={() => handleActivityClick(activity.id)}
                                                    className="group relative cursor-pointer"
                                                >
                                                    {/* Folder Shape Card */}
                                                    <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                    <div className="relative bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/50 hover:bg-white/[0.08] transition-all duration-300 transform group-hover:-translate-y-1">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:border-cyan-400 group-hover:bg-cyan-500/20 transition-all duration-300">
                                                                <Folder className="w-7 h-7 text-cyan-400" />
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <Badge className={cn(
                                                                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                                    activity.status === 'ACTIVE'
                                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                                        : "bg-slate-500/10 text-slate-400 border-white/10"
                                                                )}>
                                                                    {activity.status}
                                                                </Badge>
                                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/5">
                                                                    <VideoIcon className="w-3 h-3 text-cyan-400" />
                                                                    <span className="text-[10px] font-black text-white/80">{activity.videos?.length || 0}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <h3 className="font-black text-lg text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight leading-tight">
                                                                {activity.title}
                                                            </h3>
                                                            <p className="text-xs text-white/40 line-clamp-2 uppercase font-medium leading-relaxed">
                                                                {activity.discription || 'No description encrypted for this activity.'}
                                                            </p>
                                                        </div>

                                                        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-3 h-3 text-white/20" />
                                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                                                                    Updated {new Date(activity.updatedAt || Date.now()).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                                                                            <MoreVertical className="w-4 h-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48 bg-[#0a1f38] border-white/10 text-white">
                                                                        <DropdownMenuLabel className="uppercase tracking-widest text-[10px] text-white/40">File Actions</DropdownMenuLabel>
                                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleActivityClick(activity.id); }} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer uppercase font-bold text-xs">
                                                                            <Layers className="w-4 h-4 mr-2 text-cyan-400" /> Open Folder
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusUpdate(activity.id, activity.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); }} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer uppercase font-bold text-xs">
                                                                            {activity.status === 'ACTIVE' ? <XCircle className="w-4 h-4 mr-2 text-amber-400" /> : <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />}
                                                                            {activity.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setActivityToDelete(activity.id); setIsDeleteAlertOpen(true); }} className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer uppercase font-bold text-xs">
                                                                            <Trash2 className="w-4 h-4 mr-2" /> Delete Archive
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/5 border border-white/10 rounded-2xl p-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                                <Folder className="w-10 h-10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">{selectedActivity?.title}</h2>
                                                    <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-black uppercase tracking-widest text-[10px]">
                                                        {selectedActivity?.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-white/60 text-sm max-w-2xl uppercase font-bold tracking-wide">
                                                    {selectedActivity?.discription || 'Detailed activity matrix not available.'}
                                                </p>
                                                <div className="flex items-center gap-6 mt-4">
                                                    <div className="flex items-center gap-2">
                                                        <Monitor className="w-4 h-4 text-cyan-400" />
                                                        <span className="text-xs font-black text-white/40 uppercase tracking-widest">Identifier: <span className="text-white/80">{selectedActivity?.identifier}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <VideoIcon className="w-4 h-4 text-cyan-400" />
                                                        <span className="text-xs font-black text-white/40 uppercase tracking-widest">Video Count: <span className="text-white/80">{selectedActivity?.videos?.length || 0}</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <AddVideoDialog
                                                activityId={selectedActivity?.id || ''}
                                                activityName={selectedActivity?.title || ''}
                                                onSuccess={refetch}
                                                trigger={
                                                    <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        ADD VIDEO
                                                    </Button>
                                                }
                                            />
                                            <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold">
                                                <Settings className="w-4 h-4 mr-2" />
                                                SETTINGS
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.3em]">Video Assets Matrix</h3>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Sort by: <span className="text-white/60">Order Number</span></span>
                                                <LayoutGrid className="w-4 h-4 text-cyan-400" />
                                            </div>
                                        </div>

                                        {!selectedActivity?.videos || selectedActivity.videos.length === 0 ? (
                                            <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-16 text-center">
                                                <VideoIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                                <h4 className="text-lg font-bold text-white uppercase tracking-tight mb-1">No Video Uplinks</h4>
                                                <p className="text-white/40 text-sm uppercase font-medium tracking-wide mb-6">Connect video assets to this activity folder to begin training.</p>
                                                <AddVideoDialog
                                                    activityId={selectedActivity?.id || ''}
                                                    activityName={selectedActivity?.title || ''}
                                                    onSuccess={refetch}
                                                />
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {selectedActivity.videos.map((video, index) => (
                                                    <div
                                                        key={video.id}
                                                        className="group bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-cyan-500/30 transition-all duration-300"
                                                    >
                                                        <div className="flex items-center gap-6 flex-1 min-w-0">
                                                            <div className="relative w-12 h-12 flex-shrink-0 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20 group-hover:border-cyan-400 transition-colors">
                                                                <VideoIcon className="w-5 h-5 text-cyan-400" />
                                                                <div className="absolute -top-2 -left-2 w-5 h-5 bg-cyan-500 text-black text-[10px] font-black flex items-center justify-center rounded-lg border border-black shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                                                                    {index + 1}
                                                                </div>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <h4 className="font-bold text-white uppercase tracking-wide truncate group-hover:text-cyan-400 transition-colors">
                                                                        {video.title}
                                                                    </h4>
                                                                    <Badge className={cn(
                                                                        "text-[8px] px-1.5 py-0 rounded font-black uppercase tracking-widest",
                                                                        video.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/40"
                                                                    )}>
                                                                        {video.status}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Clock className="w-3 h-3 text-cyan-400/60" />
                                                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{video.totalTime || '00:00'}</span>
                                                                    </div>
                                                                    <Separator orientation="vertical" className="h-2 bg-white/10" />
                                                                    <p className="text-[10px] font-medium text-white/30 uppercase tracking-wide truncate">
                                                                        {video.discription || 'No metadata encrypted.'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 ml-4">
                                                            <div className="hidden sm:flex items-center gap-1">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10">
                                                                                <Share2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="bg-[#0a1f38] border-white/10 text-white uppercase font-black text-[10px] tracking-widest">Share Protocol</TooltipContent>
                                                                    </Tooltip>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="w-8 h-8 text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10">
                                                                                <Settings className="w-4 h-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="bg-[#0a1f38] border-white/10 text-white uppercase font-black text-[10px] tracking-widest">Configure Node</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-white/40 hover:text-white hover:bg-white/5">
                                                                        <MoreHorizontal className="w-5 h-5" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48 bg-[#0a1f38] border-white/10 text-white">
                                                                    <DropdownMenuLabel className="uppercase tracking-widest text-[10px] text-white/40">Asset Controls</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                                    <DropdownMenuItem onClick={() => handleVideoStatusUpdate(video.id, video.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')} className="hover:bg-white/5 focus:bg-white/5 cursor-pointer uppercase font-bold text-xs">
                                                                        {video.status === 'ACTIVE' ? <XCircle className="w-4 h-4 mr-2 text-amber-400" /> : <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />}
                                                                        {video.status === 'ACTIVE' ? 'Set Offline' : 'Set Online'}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="hover:bg-white/5 focus:bg-white/5 cursor-pointer uppercase font-bold text-xs">
                                                                        <History className="w-4 h-4 mr-2 text-cyan-400" /> Reorder Step
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                                    <DropdownMenuItem onClick={() => { setVideoToDelete(video.id); setIsVideoDeleteAlertOpen(true); }} className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer uppercase font-bold text-xs">
                                                                        <Trash2 className="w-4 h-4 mr-2" /> Purge Asset
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Alert Dialogs - Updated Styling */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className="bg-[#0a1f38] border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight text-white">Execute Purge Command?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60 uppercase font-bold text-xs tracking-wide">
                            Warning: This action will permanently erase the activity archive and all associated metadata. This operation cannot be reversed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4 gap-3">
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 uppercase font-black text-xs tracking-widest">Abort</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white uppercase font-black text-xs tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                            Confirm Purge
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isVideoDeleteAlertOpen} onOpenChange={setIsVideoDeleteAlertOpen}>
                <AlertDialogContent className="bg-[#0a1f38] border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight text-white">Decommission Asset?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60 uppercase font-bold text-xs tracking-wide">
                            Permanent deletion of this video asset will disrupt any active training protocols utilizing it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4 gap-3">
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 uppercase font-black text-xs tracking-widest">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmVideoDelete} className="bg-red-500 hover:bg-red-600 text-white uppercase font-black text-xs tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                            Decommission
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
