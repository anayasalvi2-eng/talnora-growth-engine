import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Filter, Mail, UserPlus, Loader2 } from 'lucide-react';
import { api, type Lead } from '@/lib/api-client';
import { toast } from 'sonner';
export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  useEffect(() => {
    loadLeads();
  }, [filterStatus]);
  const loadLeads = async () => {
    setLoading(true);
    const res = await api.listLeads(filterStatus === 'all' ? undefined : filterStatus);
    if (res.success && res.data) {
      setLeads(res.data);
    }
    setLoading(false);
  };
  const updateStatus = async (id: string, status: string) => {
    const res = await api.updateLeadStatus(id, status);
    if (res.success) {
      toast.success("Lead status updated");
      loadLeads();
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-500';
      case 'contacted': return 'bg-yellow-500/10 text-yellow-500';
      case 'qualified': return 'bg-purple-500/10 text-purple-500';
      case 'converted': return 'bg-green-500/10 text-green-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Leads CRM</h1>
            <p className="text-muted-foreground mt-1">Manage and nurture your captured outreach targets.</p>
          </div>
          <Button className="btn-gradient rounded-xl px-6">
            <UserPlus className="h-4 w-4 mr-2" />
            Capture Lead
          </Button>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-card p-4 rounded-2xl shadow-soft">
          <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full md:w-auto">
            <TabsList className="bg-secondary/50 rounded-lg p-1">
              <TabsTrigger value="all" className="rounded-md">All</TabsTrigger>
              <TabsTrigger value="new" className="rounded-md">New</TabsTrigger>
              <TabsTrigger value="contacted" className="rounded-md">Contacted</TabsTrigger>
              <TabsTrigger value="qualified" className="rounded-md">Qualified</TabsTrigger>
              <TabsTrigger value="converted" className="rounded-md">Converted</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search leads..." className="pl-10 rounded-xl bg-secondary/50 border-none" />
          </div>
        </div>
        <Card className="border-none shadow-soft overflow-hidden rounded-2xl">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    No leads found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{lead.name || 'Anonymous'}</span>
                        <span className="text-xs text-muted-foreground">{lead.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize border-none ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${lead.resumeScore || 0}%` }} 
                          />
                        </div>
                        <span className="text-xs font-bold">{lead.resumeScore || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{lead.source}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}