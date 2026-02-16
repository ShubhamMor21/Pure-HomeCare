import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  Sun,
  Moon,
  Bell,
  RefreshCw,
  Video,
  LogOut,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    theme: 'light',
    notifySessionComplete: true,
    notifyDeviceOffline: true,
    autoRefresh: true,
    refreshInterval: '30',
    defaultActivity: 'none',
  });

  const handleThemeChange = (theme: string) => {
    setSettings({ ...settings, theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
    toast({
      title: 'Theme updated',
      description: `Switched to ${theme} mode`,
    });
  };

  const handleLogoutAll = async () => {
    setIsLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    logout();
    navigate('/login');
  };

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings({ ...settings, [key]: value });
    toast({
      title: 'Setting updated',
      description: 'Your preferences have been saved',
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the application looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.theme === 'light' ? (
                <Sun className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Moon className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
            </div>
            <Select value={settings.theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-32 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <div className="relative group">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Session Completed</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a training session ends
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notifySessionComplete}
                onCheckedChange={(checked) => updateSetting('notifySessionComplete', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Device Offline</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when a device goes offline
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notifyDeviceOffline}
                onCheckedChange={(checked) => updateSetting('notifyDeviceOffline', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/40 backdrop-blur-[2px] border border-primary/10 transition-all group-hover:bg-background/50">
          <div className="bg-primary/90 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            Coming Soon
          </div>
        </div>
      </div>

      {/* Session Preferences */}
      <div className="relative group">
        <Card>
          <CardHeader>
            <CardTitle>Session Preferences</CardTitle>
            <CardDescription>Customize session behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Auto-refresh Device List</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically update device status
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.autoRefresh}
                onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
              />
            </div>

            {settings.autoRefresh && (
              <div className="flex items-center justify-between pl-8 animate-fade-in">
                <div>
                  <Label>Refresh Interval</Label>
                  <p className="text-sm text-muted-foreground">
                    How often to check for updates
                  </p>
                </div>
                <Select
                  value={settings.refreshInterval}
                  onValueChange={(value) => updateSetting('refreshInterval', value)}
                >
                  <SelectTrigger className="w-32 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Default Activity</Label>
                  <p className="text-sm text-muted-foreground">
                    Pre-select an activity type
                  </p>
                </div>
              </div>
              <Select
                value={settings.defaultActivity}
                onValueChange={(value) => updateSetting('defaultActivity', value)}
              >
                <SelectTrigger className="w-44 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Video_360">360 Video</SelectItem>
                  <SelectItem value="making-sandwich">Making a Sandwich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/40 backdrop-blur-[2px] border border-primary/10 transition-all group-hover:bg-background/50">
          <div className="bg-primary/90 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            Coming Soon
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="relative group">
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your session security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Logout from All Sessions</Label>
                  <p className="text-sm text-muted-foreground">
                    End all active sessions on other devices
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Logout All</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-background">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Logout from all sessions?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will end all your active sessions on all devices. You will need to
                      log in again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogoutAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Logout All Sessions
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/40 backdrop-blur-[2px] border border-primary/10 transition-all group-hover:bg-background/50">
          <div className="bg-primary/90 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
