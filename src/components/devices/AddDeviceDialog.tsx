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
                {/* {trigger || (
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Device
                    </Button>
                )} */}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-primary" />
                            Register New Device
                        </DialogTitle>
                        <DialogDescription>
                            Enter the unique device identifier and a friendly title to add a new VR headset to the system.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="deviceId">Device ID (Hardware Identifier)</Label>
                            <Input
                                id="deviceId"
                                placeholder="e.g. quest-3-001"
                                value={deviceId}
                                onChange={(e) => setDeviceId(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="title">Friendly Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Training Room A - Headset 1"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Briefly describe the device location or purpose..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!deviceId || !title || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                'Add Device'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
