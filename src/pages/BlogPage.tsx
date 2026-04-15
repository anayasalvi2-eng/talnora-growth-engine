import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type Blog } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Sparkles, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
export function BlogPage() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchBlog() {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await api.getBlogBySlug(slug);
        if (res.success && res.data) {
          setBlog(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchBlog();
  }, [slug]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
        <Link to="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <ThemeToggle className="absolute top-4 right-4" />
      <header className="border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back Home
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-display font-bold">Talnora</span>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1">
            {new Date(blog.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground mb-8 leading-tight">
            {blog.title}
          </h1>
          {blog.metaDescription && (
            <p className="text-xl text-muted-foreground mb-12 italic border-l-4 border-primary/20 pl-6 leading-relaxed">
              {blog.metaDescription}
            </p>
          )}
          <div className="text-lg leading-relaxed text-foreground/90 space-y-6 whitespace-pre-wrap">
            {blog.content}
          </div>
        </article>
        <section className="mt-20 pt-20 border-t border-border">
          <Card className="bg-gradient-primary border-none shadow-glow-lg rounded-3xl overflow-hidden p-8 md:p-12 text-white">
            <CardContent className="p-0 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div>
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">
                  Ready to boost your career?
                </h3>
                <p className="text-white/80 text-lg max-w-md">
                  Get your resume ATS score instantly with our AI-powered analyzer. Join 10,000+ professionals.
                </p>
              </div>
              <Link to="/score">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl px-8 h-14 font-bold text-lg shadow-xl">
                  Try Resume Scorer
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
      <footer className="py-12 bg-muted/30 border-t border-border">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Talnora Growth Engine. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}