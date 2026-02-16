import { useState, useId } from 'react';
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
import { Plus, Loader2 } from 'lucide-react';
import { activitiesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AddActivityDialogProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export default function AddActivityDialog({ onSuccess, trigger }: AddActivityDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [description, setDescription] = useState('');
    const { toast } = useToast();

    const titleId = useId();
    const identifierId = useId();
    const descriptionId = useId();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            await activitiesApi.create({
                title: title.trim(),
                identifier: identifier.trim() || undefined,
                discription: description.trim() || undefined,
                status: 'ACTIVE'
            });

            toast({
                title: 'Activity created',
                description: `"${title}" has been successfully added.`,
            });

            setOpen(false);
            resetForm();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast({
                title: 'Failed to create activity',
                description: error.response?.data?.message || 'Please try again',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setIdentifier('');
        setDescription('');
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!isLoading) {
                setOpen(v);
                if (!v) resetForm();
            }
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Activity
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#0a1f38] border-white/10 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-cyan-400" />
                        Add New Activity
                    </DialogTitle>
                    <DialogDescription className="text-white/40 uppercase font-bold text-xs tracking-wide">
                        Initialize a new training activity matrix for VR deployment.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor={titleId} className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60">Title</Label>
                        <Input
                            id={titleId}
                            placeholder="e.g. Yoga Session"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            disabled={isLoading}
                            className="bg-black/40 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-cyan-500/50 uppercase font-bold tracking-wide"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={identifierId} className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60">Identifier (Optional)</Label>
                        <Input
                            id={identifierId}
                            placeholder="e.g. YOGA-001"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            disabled={isLoading}
                            className="bg-black/40 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-cyan-500/50 uppercase font-bold tracking-wide"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={descriptionId} className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60">Description (Optional)</Label>
                        <Textarea
                            id={descriptionId}
                            placeholder="Describe the training activity..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                            className="min-h-[100px] bg-black/40 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-cyan-500/50 uppercase font-bold tracking-wide resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-4 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                            className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white uppercase font-black text-xs tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !title.trim()}
                            className="bg-cyan-500 hover:bg-cyan-400 text-black uppercase font-black text-xs tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Create Activity'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
