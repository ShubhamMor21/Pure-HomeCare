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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Activity</DialogTitle>
                    <DialogDescription>
                        Create a new training activity for VR devices.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor={titleId}>Title</Label>
                        <Input
                            id={titleId}
                            placeholder="e.g. Yoga Session"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={identifierId}>Identifier (Optional)</Label>
                        <Input
                            id={identifierId}
                            placeholder="e.g. YOGA-001"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={descriptionId}>Description (Optional)</Label>
                        <Textarea
                            id={descriptionId}
                            placeholder="Describe the training activity..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                            className="min-h-[100px]"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !title.trim()}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
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
