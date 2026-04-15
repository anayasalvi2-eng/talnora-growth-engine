import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, Target, TrendingUp, Loader2, ArrowUpRight, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, type AppEvent } from '@/lib/api-client';
import { motion } from 'framer-motion';
const MOCK_GRAPH_DATA = [
  { name: 'Mon', leads: 42 },
  { name: 'Tue', leads: 68 },
  { name: 'Wed', leads: 54 },
  { name: 'Thu', leads: 89 },
  { name: 'Fri', leads: 112 },
  { name: 'Sat', leads: 94 },
  { name: 'Sun', leads: 124 }
];
export function HomePage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentEvents, setRecentEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, eventsRes] = await Promise.all([
          api.getLeadStats(),
          api.getRecentEvents()
        ]);
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (eventsRes.success && eventsRes.data) setRecentEvents(eventsRes.data);
      } catch (e) {
        console.error("Dashboard data fetch error", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  const STAT_CARDS = [
    { label: 'Total Leads', value: stats.total?.toLocaleString() || '0', icon: Users, color: 'bg-blue-600' },
    { label: 'New Captured', value: stats.new?.toLocaleString() || '0', icon: Target, color: 'bg-indigo-600' },
    { label: 'Converted', value: stats.converted?.toLocaleString() || '0', icon: TrendingUp, color: 'bg-emerald-600' },
    { label: 'Efficiency', value: stats.total ? `${((stats.converted || 0) / stats.total * 100).toFixed(1)}%` : '0%', icon: FileText, color: 'bg-orange-600' }
  ];
  return (
    <AppLayout container>
      <div className="space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground">Growth Dashboard</h1>
            <p className="text-muted-foreground mt-1">Real-time performance metrics for your outreach.</p>
          </div>
          <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold">
            Generate Report
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STAT_CARDS.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-none shadow-soft hover:shadow-glow transition-all duration-300 rounded-3xl group cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                      <h3 className="text-3xl font-display font-bold mt-1">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : stat.value}
                      </h3>
                    </div>
                    <div className={`${stat.color} p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-soft p-8 rounded-3xl">
            <CardHeader className="px-0 pt-0 pb-6">
              <CardTitle className="text-lg font-bold">Capture Velocity</CardTitle>
            </CardHeader>
            <div className="h-[350px] w-full min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_GRAPH_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="#4f46e5"
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="border-none shadow-soft p-8 rounded-3xl">
            <CardHeader className="px-0 pt-0 pb-6">
              <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
            </CardHeader>
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentEvents.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-10">No recent activity detected.</p>
              ) : (
                recentEvents.map((event) => (
                  <div key={event.id} className="flex gap-4 items-center group cursor-pointer border-b border-muted/30 pb-4 last:border-0">
                    <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Activity className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate capitalize">{event.eventType.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {event.metadata?.filename || event.metadata?.email || 'System Action'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/40 shrink-0">
                      {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
              <Button variant="ghost" className="w-full mt-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/5 rounded-xl py-6">
                View Activity Log
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}