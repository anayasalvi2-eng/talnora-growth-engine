import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileUp, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  FileText,
  Target,
  BarChart3
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
export function ResumeScorerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ score: number; feedback: string[] } | null>(null);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !email) return;
    setIsUploading(true);
    setProgress(10);
    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 500);
    try {
      const res = await api.scoreResume(file, email);
      clearInterval(interval);
      setProgress(100);
      if (res.success && res.data) {
        setResult(res.data);
        toast.success("Resume analyzed successfully!");
      } else {
        toast.error(res.error || "Analysis failed");
      }
    } catch (err) {
      toast.error("An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ThemeToggle className="absolute top-4 right-4" />
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-20 lg:py-24 text-center">
          <Badge variant="outline" className="mb-4 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary">
            AI-Powered ATS Checker
          </Badge>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground mb-6">
            Get Your Resume <span className="text-gradient">ATS Ready</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-10">
            Don't get lost in the "black hole" of job applications. Our AI analyzes your resume against industry-standard ATS algorithms in seconds.
          </p>
          {!result ? (
            <Card className="max-w-xl mx-auto border-none shadow-2xl rounded-3xl overflow-hidden glass animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardContent className="p-8">
                <form onSubmit={handleAnalyze} className="space-y-6">
                  <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer ${
                      isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                        <FileUp className={`h-8 w-8 ${isDragActive ? 'text-primary animate-bounce' : 'text-muted-foreground'}`} />
                      </div>
                      <p className="font-semibold text-foreground">
                        {file ? file.name : 'Click or drag to upload resume'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">PDF or DOCX (Max 5MB)</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-medium ml-1">Work Email Address</label>
                    <Input 
                      type="email" 
                      placeholder="alex@company.com" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl bg-secondary/50 border-none h-12"
                    />
                    <p className="text-[10px] text-muted-foreground ml-1">We'll send your full detailed report to this email.</p>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!file || !email || isUploading}
                    className="w-full btn-gradient py-6 rounded-xl text-lg font-bold"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing... {progress}%
                      </>
                    ) : (
                      <>
                        Check My Score
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                  {isUploading && (
                    <Progress value={progress} className="h-2 rounded-full" />
                  )}
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 border-none shadow-soft rounded-3xl bg-primary text-white p-8 flex flex-col items-center justify-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-20">
                     <Sparkles className="h-12 w-12" />
                   </div>
                   <span className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Your ATS Score</span>
                   <span className="text-7xl font-display font-bold">{result.score}</span>
                   <span className="text-sm opacity-80 mt-2">out of 100</span>
                </Card>
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div className="bg-card shadow-soft rounded-3xl p-6 flex flex-col items-start">
                    <BarChart3 className="h-6 w-6 text-primary mb-3" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Keywords</span>
                    <span className="text-xl font-bold">Strong Match</span>
                  </div>
                  <div className="bg-card shadow-soft rounded-3xl p-6 flex flex-col items-start">
                    <Target className="h-6 w-6 text-indigo-500 mb-3" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Formatting</span>
                    <span className="text-xl font-bold">Standard</span>
                  </div>
                </div>
              </div>
              <Card className="border-none shadow-soft rounded-3xl text-left">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.feedback.map((item, i) => (
                    <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-muted/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{item}</p>
                    </div>
                  ))}
                  <div className="pt-6 border-t border-border mt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left">
                        <h4 className="font-bold text-lg">Want the full 15-page PDF report?</h4>
                        <p className="text-sm text-muted-foreground">It includes specific keyword suggestions for your target role.</p>
                      </div>
                      <Button className="btn-gradient px-8 py-6 rounded-xl font-bold">
                        Download Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Social Proof */}
          <div className="mt-20 flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
             <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" /><span className="font-bold">ATS COMPLIANT</span></div>
             <div className="flex items-center gap-2"><FileText className="h-5 w-5" /><span className="font-bold">ISO SECURE</span></div>
             <div className="flex items-center gap-2"><Target className="h-5 w-5" /><span className="font-bold">AI POWERED</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}