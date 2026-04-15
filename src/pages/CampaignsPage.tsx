import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, Play, Trash2, Send, BarChart2, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import { api, type Campaign } from '@/lib/api-client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [executingId, setExecutingId] = useState<string | null>(null);
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
      toast.success("Campaign created successfully");
      setNewName('');
      loadCampaigns();
    }
    setIsCreating(false);
  };
  const handleExecute = async (id: string) => {
    setExecutingId(id);
    const res = await api.executeCampaign(id);
    if (res.success) {
      toast.success("Campaign execution started!");
      loadCampaigns();
    }
    setExecutingId(null);
  };
  const handleDelete = async (id: string) => {
    const res = await api.deleteCampaign(id);
    if (res.success) {
      toast.success("Campaign archived");
      loadCampaigns();
    }
  };
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Campaigns & Outreach</h1>
            <p className="text-muted-foreground mt-1">Nurture leads and automate your cold outreach.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <Input 
                placeholder="New campaign name..." 
                className="max-w-xs rounded-xl bg-secondary/50 border-none"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
             />
             <Button onClick={handleCreate} disabled={isCreating} className="btn-gradient rounded-xl px-6">
               <Plus className="h-4 w-4 mr-2" />
               New Sequence
             </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="border-none shadow-soft rounded-3xl bg-indigo-600 text-white overflow-hidden relative p-8">
              <div className="absolute -top-4 -right-4 opacity-10"><Send className="h-32 w-32" /></div>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Total Sent</p>
              <h2 className="text-4xl font-display font-bold mt-2">
                {campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0).toLocaleString()}
              </h2>
           </Card>
           <Card className="border-none shadow-soft rounded-3xl bg-emerald-600 text-white overflow-hidden relative p-8">
              <div className="absolute -top-4 -right-4 opacity-10"><BarChart2 className="h-32 w-32" /></div>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Global Open Rate</p>
              <h2 className="text-4xl font-display font-bold mt-2">38.4%</h2>
           </Card>
           <Card className="border-none shadow-soft rounded-3xl bg-card p-8 flex flex-col justify-center border-2 border-dashed border-muted text-center">
              <UploadCloud className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs font-bold text-muted-foreground">IMPORT CSV LEADS</p>
           </Card>
        </div>
        <div className="space-y-4">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : campaigns.length === 0 ? (
             <Card className="border-none shadow-soft rounded-3xl p-20 text-center">
               <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
               <p className="text-muted-foreground font-medium">No active campaigns. Build your first sequence to start outreach.</p>
             </Card>
          ) : (
            <AnimatePresence>
              {campaigns.map((camp, idx) => (
                <motion.div 
                  key={camp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="border-none shadow-soft rounded-2xl overflow-hidden hover:shadow-glow transition-all">
                    <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${camp.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                        {executingId === camp.id ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mail className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold truncate text-lg">{camp.name}</h3>
                          <Badge variant={camp.status === 'active' ? 'default' : 'secondary'} className={`text-[10px] uppercase font-bold px-2 py-0 border-none ${camp.status === 'active' ? 'bg-emerald-500 text-white' : ''}`}>
                            {camp.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Targeting captured leads via resume score thresholds</p>
                      </div>
                      <div className="flex gap-10 px-8 border-x border-muted">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Reach</p>
                          <p className="font-bold text-lg">{camp.totalLeads}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Engagement</p>
                          <p className="font-bold text-lg text-emerald-600">{camp.openCount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {camp.status === 'draft' && (
                          <Button 
                            onClick={() => handleExecute(camp.id)} 
                            disabled={!!executingId}
                            className="bg-primary hover:bg-primary/90 rounded-xl font-bold px-6"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Launch
                          </Button>
                        )}
                        <Button onClick={() => handleDelete(camp.id)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </AppLayout>
  );
}