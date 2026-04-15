import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, Play, Pause, Trash2, Send, BarChart2, Loader2, Sparkles } from 'lucide-react';
import { api, type Campaign } from '@/lib/api-client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    const res = await api.listCampaigns();
    if (res.success && res.data) setCampaigns(res.data);
    setLoading(false);
  }, []);
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);
  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    const res = await api.createCampaign({ name: newName });
    if (res.success) {
      toast.success("Campaign created");
      setNewName('');
      loadCampaigns();
    }
    setIsCreating(false);
  };
  const handleDelete = async (id: string) => {
    const res = await api.deleteCampaign(id);
    if (res.success) {
      toast.success("Campaign deleted");
      loadCampaigns();
    }
  };
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Outreach Campaigns</h1>
            <p className="text-muted-foreground mt-1">Manage your automated email sequences and tracking.</p>
          </div>
          <div className="flex gap-2">
             <Input 
                placeholder="Campaign name..." 
                className="w-64 rounded-xl bg-secondary/50 border-none"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
             />
             <Button onClick={handleCreate} disabled={isCreating} className="btn-gradient rounded-xl px-6">
               <Plus className="h-4 w-4 mr-2" />
               Create
             </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="border-none shadow-soft rounded-3xl bg-indigo-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-20"><Send className="h-20 w-20" /></div>
              <CardContent className="pt-8">
                <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Total Sent</p>
                <h2 className="text-4xl font-display font-bold mt-2">1,284</h2>
                <p className="text-xs mt-4 flex items-center gap-1 font-semibold"><Sparkles className="h-3 w-3" /> 12% increase this week</p>
              </CardContent>
           </Card>
           <Card className="border-none shadow-soft rounded-3xl bg-emerald-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-20"><BarChart2 className="h-20 w-20" /></div>
              <CardContent className="pt-8">
                <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Open Rate</p>
                <h2 className="text-4xl font-display font-bold mt-2">42.8%</h2>
                <p className="text-xs mt-4 flex items-center gap-1 font-semibold"><Sparkles className="h-3 w-3" /> Industry avg: 21%</p>
              </CardContent>
           </Card>
           <Card className="border-none shadow-soft rounded-3xl bg-card p-6 flex items-center justify-center border-2 border-dashed border-muted">
              <div className="text-center text-muted-foreground">
                <p className="text-sm font-semibold">Active Sequences</p>
                <h2 className="text-3xl font-bold text-foreground">{campaigns.filter(c => c.status === 'active').length}</h2>
              </div>
           </Card>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : campaigns.length === 0 ? (
             <Card className="border-none shadow-soft rounded-3xl p-20 text-center">
               <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
               <p className="text-muted-foreground">No campaigns found. Start by creating one!</p>
             </Card>
          ) : (
            campaigns.map((camp, idx) => (
              <motion.div 
                key={camp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-none shadow-soft rounded-2xl overflow-hidden hover:shadow-glow transition-all">
                  <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold truncate">{camp.name}</h3>
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold px-2 py-0">
                          {camp.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Created {new Date(camp.createdAt).toLocaleDateString()} • Template: Default</p>
                    </div>
                    <div className="flex gap-8 px-6 border-x border-muted">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Sent</p>
                        <p className="font-bold">{camp.sentCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Opens</p>
                        <p className="font-bold">{camp.openCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-emerald-50 hover:text-emerald-600">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDelete(camp.id)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}