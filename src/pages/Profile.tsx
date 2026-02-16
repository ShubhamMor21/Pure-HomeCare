import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { User, Mail, Shield, Loader2, Camera, Hash, CheckCircle2, Sun, Moon, LogOut, Clock, Globe } from 'lucide-react';
import { useEffect } from 'react';
import VRBackground from '@/components/ui/VRBackground';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Profile() {
  const { user, updateProfile, fetchProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [theme, setTheme] = useState(document.documentElement.classList.contains('dark') ? 'dark' : 'light');

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    toast({
      title: 'Theme updated',
      description: `Switched to ${newTheme} mode`,
    });
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await fetchProfile();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setIsPageLoading(false);
      }
    };
    loadProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
      });
    }
  }, [user]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    updateProfile({ name: formData.name });
    setIsLoading(false);
    setIsEditing(false);
    toast({
      title: 'Profile updated',
      description: 'Your profile has been updated successfully',
    });
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] space-y-8 animate-fade-in p-2 md:p-6 lg:p-8">
      <VRBackground />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Hero Section */}
        <div className="glassmorphism p-8 rounded-[2.5rem] border-white/10 relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full group-hover:bg-cyan-500/20 transition-colors" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="relative group/avatar">
              <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full group-hover/avatar:bg-cyan-500/40 transition-all animate-pulse-slow" />
              <Avatar className="w-32 h-32 border-2 border-cyan-500/30 ring-4 ring-cyan-500/10">
                <AvatarFallback className="bg-gradient-to-br from-[#0d2a4a] to-[#0a1f38] text-cyan-400 text-4xl font-bold">
                  {user ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.5)] active:scale-95">
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-4xl font-black text-white tracking-tight neon-glow-cyan uppercase">
                  {user?.name}
                </h1>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Stream
                </div>
              </div>
              <p className="text-cyan-100/60 font-medium tracking-wide flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4 text-cyan-400/40" />
                {user?.email}
              </p>
              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                <div className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  {user?.role} Access
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Network Role', value: user?.role || 'Trainer', icon: Shield, color: 'text-blue-400' },
            { label: 'Link Status', value: user?.status || 'Active', icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Sessions Keyed', value: '128', icon: Clock, color: 'text-purple-400' },
            { label: 'Last Uplink', value: '2h ago', icon: Globe, color: 'text-cyan-400' },
          ].map((stat, i) => (
            <div key={i} className="glassmorphism p-4 rounded-2xl border-white/5 group hover:border-white/10 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-sm font-bold text-white tracking-wide uppercase">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Appearance Card */}
          <div className="glassmorphism p-8 rounded-[2rem] border-white/10 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight uppercase">Interface Optics</h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Customize your visual stream</p>
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-bold text-white/80">Spectrum Mode</Label>
                  <p className="text-xs text-white/40 leading-relaxed">Adjust environmental lighting parameters</p>
                </div>
                <Tabs value={theme} onValueChange={handleThemeChange} className="w-auto">
                  <TabsList className="bg-black/40 border border-white/5 rounded-xl p-1 h-auto">
                    <TabsTrigger
                      value="light"
                      className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 px-4 py-2 text-xs font-bold"
                    >
                      Light
                    </TabsTrigger>
                    <TabsTrigger
                      value="dark"
                      className="rounded-lg data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-white/40 px-4 py-2 text-xs font-bold"
                    >
                      Dark
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
                <div className="space-y-1">
                  <Label className="text-sm font-bold text-cyan-400">VR Immersive View</Label>
                  <p className="text-[10px] text-cyan-400/40 uppercase font-bold tracking-tighter">Enhanced holographic interface enabled</p>
                </div>
                <div className="w-12 h-6 bg-cyan-500/20 rounded-full border border-cyan-500/30 flex items-center px-1">
                  <div className="w-4 h-4 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] ml-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information Card */}
          <div className="glassmorphism p-8 rounded-[2rem] border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight uppercase">Identity Matrix</h3>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Update core profile parameters</p>
                </div>
              </div>
              {!isEditing && (
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] border border-cyan-500/20 hover:bg-cyan-500/10 rounded-xl"
                >
                  Edit Matrix
                </Button>
              )}
            </div>

            <div className="grid gap-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3 h-3 text-cyan-400/40" />
                  Operator Identifier
                </Label>
                <div className="relative group">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl h-12 font-bold disabled:opacity-60"
                  />
                  {isEditing && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-3 h-3 text-white/20" />
                  Network Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-black/40 border-white/5 text-white/40 rounded-xl h-12 cursor-not-allowed font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-3 h-3 text-white/20" />
                    Access Level
                  </Label>
                  <div className="h-12 flex items-center px-4 rounded-xl bg-black/40 border border-white/5 text-white/40 text-xs font-bold uppercase tracking-wider">
                    {user?.role}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-white/20" />
                    Protocol Status
                  </Label>
                  <div className="h-12 flex items-center px-4 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">{user?.status}</span>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex items-center gap-4 pt-4 animate-in slide-in-from-bottom-2 duration-300">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1 bg-cyan-500 text-black hover:bg-cyan-400 font-black uppercase tracking-widest h-12 shadow-[0_0_20px_rgba(34,211,238,0.3)] rounded-xl"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply Sync'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 text-white/40 hover:text-white font-bold uppercase tracking-widest h-12 rounded-xl"
                  >
                    Abort
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-8 text-center">
          <Button
            variant="ghost"
            className="text-red-400/40 hover:text-red-400 hover:bg-red-500/10 px-8 py-6 rounded-2xl border border-red-500/5 hover:border-red-500/20 transition-all font-bold uppercase tracking-[0.3em] text-xs"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Terminate Session
          </Button>
        </div>
      </div>
    </div>
  );
}
