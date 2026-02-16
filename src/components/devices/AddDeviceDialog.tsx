import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Monitor } from 'lucide-react';
import { devicesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AddDeviceDialogProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export default function AddDeviceDialog({
    onSuccess,
    trigger,
}: AddDeviceDialogProps) {
    const [open, setOpen] = useState(false);
    const [deviceId, setDeviceId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deviceId || !title) return;

        setIsSubmitting(true);
        try {
            await devicesApi.create({
                deviceId,
                title,
                discription: description, // Match backend typo 'discription' if using it, 
                deviceStatus: 'DISCONNECTED'
            });

            toast({
                title: 'Device added successfully',
                description: `"${title}" (${deviceId}) has been registered`,
            });

            // Reset form
            setDeviceId('');
            setTitle('');
            setDescription('');
            setOpen(false);
            onSuccess?.();
        } catch (error: any) {
            console.error('Failed to add device:', error);
            toast({
                title: 'Error adding device',
                description: error.response?.data?.message || error.message || 'An unknown error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2 bg-cyan-500 text-black hover:bg-cyan-400 font-bold border-none shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 hover:scale-105 active:scale-95">
                        <Plus className="w-4 h-4" />
                        Add Device
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#0d2a4a] border-white/10 text-white rounded-3xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <Monitor className="w-5 h-5 text-cyan-400" />
                            Register New Device
                        </DialogTitle>
                        <DialogDescription className="text-white/40">
                            Enter the unique device identifier and a friendly title to add a new VR headset to the system.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="grid gap-2">
                            <Label htmlFor="deviceId" className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Device ID</Label>
                            <Input
                                id="deviceId"
                                placeholder="e.g. quest-3-001"
                                value={deviceId}
                                onChange={(e) => setDeviceId(e.target.value)}
                                required
                                disabled={isSubmitting}
                                className="bg-black/20 border-white/10 text-white placeholder:text-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="title" className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Friendly Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Headset 1"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                disabled={isSubmitting}
                                className="bg-black/20 border-white/10 text-white placeholder:text-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description" className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Location or purpose..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="bg-black/20 border-white/10 text-white placeholder:text-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                            className="text-white/40 hover:text-white hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!deviceId || !title || isSubmitting}
                            className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                'Register Device'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
