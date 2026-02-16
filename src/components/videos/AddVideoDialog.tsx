import { useState, useRef, useId, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Upload, Loader2, Video as VideoIcon, X, FileVideo, Globe, Monitor } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { videosApi } from '@/lib/api';
import { socket, SocketEvents } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AddVideoDialogProps {
    activityId: string;
    activityName: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export default function AddVideoDialog({
    activityId,
    activityName,
    onSuccess,
    trigger,
}: AddVideoDialogProps) {
    const [open, setOpen] = useState(true);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadPercentage, setUploadPercentage] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [videoMode, setVideoMode] = useState<'Video_360' | 'Plain_Video'>('Video_360');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dialogId = useId();
    const titleInputId = `${dialogId}-title`;
    const fileInputId = `${dialogId}-file`;
    const { toast } = useToast();

    useEffect(() => {
        const handleProgress = (data: any) => {
            let progress: any = {};

            if (typeof data === 'string') {
                // Handle query string format: "percentage=0&status=CONVERTING&title=HEYYY"
                const params = new URLSearchParams(data);
                progress = {
                    percentage: Number(params.get('percentage')) || 0,
                    status: params.get('status') || '',
                    title: params.get('title') || '',
                    message: params.get('message') || ''
                };
            } else {
                progress = data;
            }

            // Only update if it's the video we're currently uploading (matching by title)
            if (progress.title === title) {
                setUploadPercentage(progress.percentage || 0);
                setUploadStatus(progress.status || '');

                if (progress.status === 'COMPLETED') {
                    // Final completion
                    setIsUploading(false);
                    setOpen(false);
                    onSuccess?.();

                    toast({
                        title: 'Processing complete',
                        description: `"${title}" has been successfully processed and added.`,
                    });

                    // Reset fields for next time
                    setTitle('');
                    setFile(null);
                    setUploadPercentage(0);
                    setUploadStatus('');
                } else if (progress.status === 'FAILED') {
                    setIsUploading(false);
                    toast({
                        title: 'Processing failed',
                        description: progress.message || 'Processing failed',
                        variant: 'destructive',
                    });
                }
            }
        };

        socket.on(SocketEvents.VIDEO_PROGRESS, handleProgress);
        return () => {
            socket.off(SocketEvents.VIDEO_PROGRESS, handleProgress);
        };
    }, [title, toast]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isUploading) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isUploading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
        let selectedFile: File | null = null;

        if ('files' in e.target && e.target.files?.[0]) {
            selectedFile = e.target.files[0];
        } else if ('dataTransfer' in e && e.dataTransfer.files?.[0]) {
            selectedFile = e.dataTransfer.files[0];
        }

        if (selectedFile) {
            setFile(selectedFile);
            // Auto-set title if empty
            if (!title) {
                setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileChange(e);
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;

        setIsUploading(true);
        try {
            await videosApi.uploadDirect(file, title, activityId, videoMode);

            toast({
                title: 'Upload started',
                description: `"${title}" is being uploaded and processed.`,
            });

            setUploadStatus('STARTING');
            setUploadPercentage(0);

            // We don't close the modal yet. We wait for the socket's COMPLETED event.
        } catch (error: any) {
            setIsUploading(false);
            console.error('Upload failed:', error);
            toast({
                title: 'Upload failed',
                description: error.response?.data?.message || error.message || 'An unknown error occurred',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Video
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent
                className={cn(
                    "sm:max-w-lg p-0 overflow-hidden border-white/10 bg-[#0a1f38] text-white shadow-[0_0_50px_rgba(0,0,0,0.5)]",
                    isUploading && "[&>button]:hidden"
                )}
                onPointerDownOutside={(e) => isUploading && e.preventDefault()}
                onEscapeKeyDown={(e) => isUploading && e.preventDefault()}
                onInteractOutside={(e) => isUploading && e.preventDefault()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col relative">
                    {isUploading && (
                        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                            <div className="bg-[#0a1f38]/80 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 border border-cyan-500/20 scale-110">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-4 border-cyan-500/10 border-t-cyan-500 animate-spin" />
                                    <FileVideo className="absolute inset-0 m-auto w-8 h-8 text-cyan-400 animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                                </div>
                                <div className="text-center w-full px-8">
                                    <p className="text-xl font-black uppercase tracking-tighter text-white mb-2">{uploadStatus || 'Transmitting Data...'}</p>
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 max-w-[320px] mx-auto animate-pulse">
                                        <p className="text-[10px] text-red-400 font-black uppercase tracking-widest leading-relaxed">
                                            Maintain Connection! This will take some time. <span className="text-white">DO NOT TERMINATE SESSION</span> or data loss will occur.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] px-1">
                                            <span className="text-cyan-400">{uploadStatus.toLowerCase().replace('_', ' ')}</span>
                                            <span className="text-white">{uploadPercentage}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-300"
                                                style={{ width: `${uploadPercentage}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-center text-white/30 uppercase tracking-[0.3em] mt-2 font-bold">
                                            {uploadPercentage < 50 ? 'Matrix Encapsulation' : 'Uplinking to Neural Storage'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogHeader className="p-8 pb-0">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                            <VideoIcon className="w-6 h-6 text-cyan-400" />
                            Uplink Video Asset
                        </DialogTitle>
                        <DialogDescription className="text-white/40 uppercase font-bold text-xs tracking-wide mt-2">
                            Add training video asset (MAX: 200MB) to activity: <span className="text-cyan-400">{activityName}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor={titleInputId} className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60">
                                Asset Title
                            </Label>
                            <Input
                                id={titleInputId}
                                placeholder="Enter asset identifier..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                disabled={isUploading}
                                className="h-12 bg-black/40 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-cyan-500/50 uppercase font-bold tracking-wide"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60">
                                    Transmission Mode
                                </Label>
                                <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Plain Node Offline
                                </div>
                            </div>
                            <Tabs
                                value={videoMode}
                                onValueChange={(v) => setVideoMode(v as any)}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-black/40 rounded-xl border border-white/5">
                                    <TabsTrigger
                                        value="Video_360"
                                        disabled={isUploading}
                                        className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-black transition-all gap-2 font-black uppercase text-[10px] tracking-widest"
                                    >
                                        <Globe className="w-4 h-4" />
                                        360 Immersive
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="Plain_Video"
                                        disabled={true}
                                        className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-black transition-all gap-2 font-black uppercase text-[10px] tracking-widest opacity-30"
                                    >
                                        <Monitor className="w-4 h-4" />
                                        Standard View
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={fileInputId} className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60">
                                Source File
                            </Label>
                            <div
                                className={cn(
                                    "relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300 group overflow-hidden",
                                    file
                                        ? "border-cyan-500/40 bg-cyan-500/5"
                                        : "border-white/10 bg-black/40 hover:border-cyan-500/40 hover:bg-cyan-500/5",
                                    isDragging && "border-cyan-500 bg-cyan-500/10 scale-[1.01]",
                                    isUploading && "opacity-50 cursor-not-allowed pointer-events-none"
                                )}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                            >
                                <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <input
                                    ref={fileInputRef}
                                    id={fileInputId}
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e)}
                                    disabled={isUploading}
                                />

                                {file ? (
                                    <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 w-full px-4 relative z-10">
                                        <div className="w-20 h-20 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-cyan-500/30">
                                            <FileVideo className="w-10 h-10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
                                        </div>
                                        <p className="text-sm font-black text-white uppercase tracking-tight truncate w-full max-w-xs mb-1">
                                            {file.name}
                                        </p>
                                        <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest opacity-60">
                                            {(file.size / (1024 * 1024)).toFixed(2)} Megabytes
                                        </p>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearFile}
                                            className="mt-6 h-8 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                                        >
                                            <X className="w-3 h-3 mr-1.5" />
                                            Terminate Asset
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-cyan-500/10 transition-all border border-white/5 group-hover:border-cyan-500/20">
                                            <Upload className="w-10 h-10 text-white/20 group-hover:text-cyan-400 transition-colors" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black text-white uppercase tracking-widest mb-1">
                                                Initiate Uplink
                                            </p>
                                            <p className="text-[10px] text-white/30 uppercase font-bold tracking-wide mt-1 px-4">
                                                Drag & drop or select source video (200MB LIMIT)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-2 bg-black/20 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isUploading}
                            className="flex-1 sm:flex-none font-black uppercase text-xs tracking-widest text-white/40 hover:text-white"
                        >
                            Abort
                        </Button>
                        <Button
                            type="submit"
                            disabled={!file || !title || isUploading}
                            className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all active:scale-[0.98]"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Synchronizing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Begin Uplink
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
