import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Target, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const MOCK_DATA = [
  { name: 'Jan', leads: 400 },
  { name: 'Feb', leads: 300 },
  { name: 'Mar', leads: 200 },
  { name: 'Apr', leads: 278 },
  { name: 'May', leads: 189 },
  { name: 'Jun', leads: 239 },
  { name: 'Jul', leads: 349 },
];
const STATS = [
  { label: 'Total Leads', value: '1,284', icon: Users, trend: '+12%', color: 'text-blue-600' },
  { label: 'Content Pieces', value: '42', icon: FileText, trend: '+5', color: 'text-indigo-600' },
  { label: 'Campaigns', value: '8', icon: Target, trend: 'Active', color: 'text-emerald-600' },
  { label: 'Conversion Rate', value: '3.2%', icon: TrendingUp, trend: '+0.4%', color: 'text-orange-600' },
];
export function HomePage() {
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Growth Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time performance metrics for your outreach.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <Card key={stat.label} className="border-none shadow-soft hover:shadow-glow transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    <p className="text-xs font-semibold text-emerald-600 mt-1">{stat.trend}</p>
                  </div>
                  <div className={stat.color}>
                    <stat.icon className="h-8 w-8 opacity-80" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-soft p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg">Lead Velocity</CardTitle>
            </CardHeader>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="leads" stroke="#F38020" strokeWidth={3} dot={{ r: 4, fill: '#F38020' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="border-none shadow-soft p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">New Lead Captured</p>
                    <p className="text-xs text-muted-foreground">j.doe@example.com (Score: 84)</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter italic">2 mins ago</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}