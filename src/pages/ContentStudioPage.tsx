import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Send, History, BrainCircuit, Check, X } from 'lucide-react';
import { api, type ContentAsset, type Topic } from '@/lib/api-client';
import { toast } from 'sonner';
export function ContentStudioPage() {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('linkedin');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<ContentAsset[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<Topic[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  useEffect(() => {
    loadHistory();
    loadSuggestions();
  }, []);
  const loadHistory = async () => {
    const res = await api.listContent();
    if (res.success && res.data) setHistory(res.data);
  };
  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    const res = await api.listTopics();
    if (res.success && res.data) setSuggestedTopics(res.data);
    setLoadingSuggestions(false);
  };
  const handleGenerate = async (overrideTopic?: string, overrideType?: string) => {
    const finalTopic = overrideTopic || topic;
    const finalType = overrideType || type;
    if (!finalTopic) return toast.error("Please enter a topic");
    setIsGenerating(true);
    try {
      const res = await api.generateContent(finalType, finalTopic);
      if (res.success && res.data) {
        setHistory([res.data, ...history]);
        toast.success("Content generated successfully!");
        setTopic('');
      }
    } finally {
      setIsGenerating(false);
    }
  };
  const handleApprove = (item: Topic) => {
    setTopic(item.topic);
    setType(item.suggestedType || 'linkedin');
    api.approveTopic(item.id, 'approved');
    toast.info("Topic pre-filled in generator");
  };
  return (
    <AppLayout container>
      <div className="space-y-8">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Content Studio</h1>
            <p className="text-muted-foreground mt-1">AI-powered marketing copy & decision engine.</p>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1">
            <BrainCircuit className="h-3 w-3 mr-2" />
            Decision Engine Active
          </Badge>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Suggested Topics
            </h2>
            <div className="space-y-3">
              {loadingSuggestions ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
                ))
              ) : suggestedTopics.filter(t => t.status === 'suggested').length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 text-center">No new suggestions</div>
              ) : (
                suggestedTopics.filter(t => t.status === 'suggested').map((item) => (
                  <Card key={item.id} className="border-none shadow-soft hover:shadow-glow transition-all cursor-pointer group" onClick={() => handleApprove(item)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-tighter">
                          {item.source.replace('_', ' ')}
                        </Badge>
                        <span className="text-[9px] font-bold text-emerald-500">{item.score}% Weight</span>
                      </div>
                      <p className="text-sm font-semibold line-clamp-2 mb-3">{item.topic}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2 rounded-lg bg-primary/5 text-primary">
                          Use Topic
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-soft bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="rounded-xl border-none bg-secondary/50">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog">SEO Blog Post</SelectItem>
                        <SelectItem value="linkedin">LinkedIn Post</SelectItem>
                        <SelectItem value="reddit">Reddit Thread</SelectItem>
                        <SelectItem value="email">Cold Outreach Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Main Topic</label>
                    <Input 
                      value={topic} 
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Modern Resume Best Practices" 
                      className="rounded-xl border-none bg-secondary/50"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => handleGenerate()} 
                  disabled={isGenerating}
                  className="w-full btn-gradient rounded-xl py-6"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Generate Content
                </Button>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                Recent Assets
              </h2>
              {history.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-3xl border-muted">
                  <p className="text-muted-foreground text-sm">No history yet.</p>
                </div>
              ) : (
                history.map((item) => (
                  <Card key={item.id} className="border-none shadow-soft overflow-hidden group">
                    <div className="flex">
                      <div className="w-1 bg-primary group-hover:w-2 transition-all" />
                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-[10px] capitalize">{item.type}</Badge>
                          <span className="text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-base mb-1">{item.topic}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.content}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}