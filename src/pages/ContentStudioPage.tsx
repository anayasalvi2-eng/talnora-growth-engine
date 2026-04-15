import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Send, History } from 'lucide-react';
import { api, type ContentAsset } from '@/lib/api-client';
import { toast } from 'sonner';
export function ContentStudioPage() {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('linkedin');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<ContentAsset[]>([]);
  useEffect(() => {
    loadHistory();
  }, []);
  const loadHistory = async () => {
    const res = await api.listContent();
    if (res.success && res.data) setHistory(res.data);
  };
  const handleGenerate = async () => {
    if (!topic) return toast.error("Please enter a topic");
    setIsGenerating(true);
    try {
      const res = await api.generateContent(type, topic);
      if (res.success && res.data) {
        setHistory([res.data, ...history]);
        toast.success("Content generated successfully!");
        setTopic('');
      }
    } finally {
      setIsGenerating(false);
    }
  };
  return (
    <AppLayout container>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-display font-bold text-foreground">Content Studio</h1>
          <p className="text-muted-foreground mt-1">AI-powered marketing copy generation.</p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <Card className="lg:col-span-5 border-none shadow-soft sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generator Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="rounded-xl border-input bg-secondary/50">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">SEO Blog Post</SelectItem>
                    <SelectItem value="linkedin">LinkedIn Post</SelectItem>
                    <SelectItem value="reddit">Reddit Thread</SelectItem>
                    <SelectItem value="email">Cold Outreach Email</SelectItem>
                    <SelectItem value="video_script">Short Video Script</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Topic or Keywords</label>
                <Input 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Benefits of Cloudflare Workers for SaaS" 
                  className="rounded-xl border-input bg-secondary/50"
                />
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full btn-gradient rounded-xl py-6 mt-4"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Generate Content
              </Button>
            </CardContent>
          </Card>
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                History
              </h2>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-3xl border-muted-foreground/20">
                <PenTool className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No content generated yet. Start above!</p>
              </div>
            ) : (
              history.map((item) => (
                <Card key={item.id} className="border-none shadow-soft hover:shadow-glow transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none capitalize">
                        {item.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-base mt-2">{item.topic}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {item.content}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button variant="ghost" size="sm" className="text-xs rounded-lg h-8">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-xs rounded-lg h-8">Publish</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
function PenTool({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19 7-7 3 3-7 7-3-3Z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5Z"/><path d="m2 2 5 5"/><path d="m8.5 8.5 4 4"/></svg>
}