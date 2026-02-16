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
                    "sm:max-w-lg p-0 overflow-hidden border-none shadow-2xl",
                    isUploading && "[&>button]:hidden" // Hide the close button during upload
                )}
                onPointerDownOutside={(e) => isUploading && e.preventDefault()}
                onEscapeKeyDown={(e) => isUploading && e.preventDefault()}
                onInteractOutside={(e) => isUploading && e.preventDefault()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col relative">
                    {isUploading && (
                        <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-300">
                            <div className="bg-background rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4 border border-muted-foreground/10 scale-110">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                    <FileVideo className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
                                </div>
                                <div className="text-center w-full px-8">
                                    <p className="text-lg font-bold">{uploadStatus || 'Uploading Video...'}</p>
                                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 max-w-[300px] mx-auto animate-pulse">
                                        <p className="text-xs text-destructive font-semibold leading-relaxed italic">
                                            Wait patiently! This will take some time. <span className="font-black">Don't refresh the page</span> or your progress will be lost.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-semibold px-1">
                                            <span className="text-primary capitalize">{uploadStatus.toLowerCase().replace('_', ' ')}</span>
                                            <span>{uploadPercentage}%</span>
                                        </div>
                                        <Progress value={uploadPercentage} className="h-2 w-full" />
                                        <p className="text-[10px] text-center text-muted-foreground mt-2 uppercase tracking-widest opacity-60">
                                            {uploadPercentage < 50 ? 'Conversion in progress' : 'Uploading to cloud storage'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                            Add Video to Activity
                        </DialogTitle>
                        <DialogDescription className="text-sm mt-1.5 line-clamp-2">
                            Upload a training video up to <span className="font-semibold text-foreground">200MB</span> to <span className="font-semibold text-foreground text-nowrap">{activityName}</span>.
                            Supported formats: MP4, MOV.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor={titleInputId} className="text-sm font-semibold tracking-tight">
                                Video Title
                            </Label>
                            <Input
                                id={titleInputId}
                                placeholder="Enter a descriptive title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                disabled={isUploading}
                                className="h-11 bg-muted/30 border-muted-foreground/10 focus:bg-background transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold tracking-tight">
                                    Video Mode
                                </Label>
                                <div className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    Plain Video Coming Soon
                                </div>
                            </div>
                            <Tabs
                                value={videoMode}
                                onValueChange={(v) => setVideoMode(v as any)}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-muted/50 rounded-xl">
                                    <TabsTrigger
                                        value="Video_360"
                                        disabled={isUploading}
                                        className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-2 font-bold"
                                    >
                                        <Globe className="w-4 h-4" />
                                        360 Video
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="Plain_Video"
                                        disabled={true}
                                        className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-2 font-bold opacity-50 cursor-not-allowed"
                                    >
                                        <Monitor className="w-4 h-4" />
                                        Plain Video
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={fileInputId} className="text-sm font-semibold tracking-tight">
                                Video File
                            </Label>
                            <div
                                className={cn(
                                    "relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all duration-200 group",
                                    file
                                        ? "border-primary/40 bg-primary/5"
                                        : "border-muted-foreground/20 bg-muted/10 hover:border-primary/40 hover:bg-muted/20",
                                    isDragging && "border-primary bg-primary/10 scale-[1.01]",
                                    isUploading && "opacity-50 cursor-not-allowed pointer-events-none"
                                )}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                            >
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
                                    <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 w-full px-4">
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <FileVideo className="w-8 h-8 text-primary" />
                                        </div>
                                        <p className="text-sm font-bold text-foreground truncate w-full max-w-xs mb-1">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearFile}
                                            className="mt-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <X className="w-3 h-3 mr-1.5" />
                                            Remove File
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-foreground">
                                                Click to upload or drag & drop
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1 px-4">
                                                Select a video file (max 200MB) to add to this activity
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-2 bg-muted/30 border-t border-muted-foreground/5 flex flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isUploading}
                            className="flex-1 sm:flex-none font-semibold text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!file || !title || isUploading}
                            className="flex-1 font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Starting Upload...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Video
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
