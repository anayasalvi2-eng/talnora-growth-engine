import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, Target, TrendingUp, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api-client';
const MOCK_DATA = [
  { name: 'Jan', leads: 400 },
  { name: 'Feb', leads: 300 },
  { name: 'Mar', leads: 200 },
  { name: 'Apr', leads: 278 },
  { name: 'May', leads: 189 },
  { name: 'Jun', leads: 239 },
  { name: 'Jul', leads: 349 }
];
export function HomePage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.getLeadStats();
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard stats", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);
  const STAT_CARDS = [
    { label: 'Total Leads', value: stats.total?.toLocaleString() || '0', icon: Users, color: 'text-blue-600' },
    { label: 'New Captured', value: stats.new?.toLocaleString() || '0', icon: Target, color: 'text-indigo-600' },
    { label: 'Converted', value: stats.converted?.toLocaleString() || '0', icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Efficiency', value: stats.total ? `${((stats.converted || 0) / stats.total * 100).toFixed(1)}%` : '0%', icon: FileText, color: 'text-orange-600' }
  ];
  return (
    <AppLayout container>
      <div className="space-y-8">
        <header>
          <h1 className="text-display text-3xl md:text-4xl font-bold text-foreground">Growth Dashboard</h1>
          <p className="text-body mt-1">Real-time performance metrics for your marketing outreach.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STAT_CARDS.map((stat) => (
            <Card key={stat.label} className="border-none shadow-soft hover:shadow-glow transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-1">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : stat.value}
                    </h3>
                  </div>
                  <div className={`${stat.color} p-2 bg-muted/50 rounded-xl`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-soft p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-bold">Lead Velocity</CardTitle>
            </CardHeader>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="hsl(var(--primary))"
                    strokeWidth={4}
                    dot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="border-none shadow-soft p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-bold">Recent Leads</CardTitle>
            </CardHeader>
            <div className="space-y-6 pt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center group cursor-pointer">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">Lead Capture #{1024 - i}</p>
                    <p className="text-xs text-muted-foreground">Manual Source • Score: {85 - i}</p>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground/50">{i + 1}m ago</span>
                </div>
              ))}
              <Button variant="ghost" className="w-full mt-4 text-xs font-bold uppercase tracking-widest">
                View All Activity
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}