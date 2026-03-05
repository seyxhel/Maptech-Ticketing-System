import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import {
  Search,
  BookOpen,
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  Play,
  Image as ImageIcon,
  Video,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import type { PublishedArticle } from '../../services/api';
import { fetchPublishedArticles } from '../../services/api';

function parseSteps(description: string): string[] {
  try {
    const parsed = JSON.parse(description);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fallback: split by newlines for plain-text descriptions
  }
  return description.split('\n').filter((s: string) => s.trim());
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|avi|mkv)$/i.test(url);
}

export default function EmployeeKnowledgeBase() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(false);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await fetchPublishedArticles(search ? { search } : undefined);
      setArticles(data);
    } catch {
      toast.error('Failed to load articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  // Collect unique tags across all articles
  const allTags = Array.from(new Set(articles.flatMap((a) => a.published_tags || [])));
  const TAG_OPTIONS = ['All', ...allTags];

  const filtered = articles.filter((a) => {
    const q = search.trim().toLowerCase();
    const steps = parseSteps(a.published_description);
    const matchSearch =
      !q ||
      a.published_title.toLowerCase().includes(q) ||
      steps.some((s) => s.toLowerCase().includes(q));
    const matchTag = selectedTag === 'All' || (a.published_tags || []).includes(selectedTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Hub</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Troubleshooting guides and escalation procedures for common issues
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') loadArticles(); }}
            placeholder="Search articles..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-[#3BC25B]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedTag === tag
                  ? 'bg-[#0E8F79] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tag}
            </button>
          ))}
          <button
            onClick={loadArticles}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {loading && articles.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <Card>
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No articles found matching your search.</p>
          </Card>
        )}
        {filtered.map((article) => {
          const isExpanded = expandedId === article.id;
          const steps = parseSteps(article.published_description);
          const isVideo = isVideoUrl(article.file_url);
          const isImage = isImageUrl(article.file_url);
          return (
            <Card
              key={article.id}
              className="cursor-pointer hover:border-[#3BC25B] dark:hover:border-[#3BC25B] transition-all"
              onClick={() => setExpandedId(isExpanded ? null : article.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0E8F79]/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[#0E8F79]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{article.published_title}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {(article.published_tags || []).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-[#0E8F79]/10 text-[#0E8F79] text-[10px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="text-[10px] text-gray-400">{article.stf_no}</span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                  {/* Media Preview */}
                  {isVideo ? (
                    <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video flex items-center justify-center cursor-pointer group">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
                      <div className="relative flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
                          <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
                        </div>
                        <span className="text-white/80 text-xs font-medium">Attached Video</span>
                      </div>
                      <div className="absolute top-2.5 left-3 flex items-center gap-1.5 bg-red-600/90 px-2 py-0.5 rounded text-white text-[10px] font-bold uppercase">
                        <Video className="w-3 h-3" /> Video
                      </div>
                    </div>
                  ) : isImage ? (
                    <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-700 aspect-video flex items-center justify-center">
                      <img src={article.file_url} alt={article.published_title} className="w-full h-full object-contain" />
                      <div className="absolute top-2.5 left-3 flex items-center gap-1.5 bg-[#0E8F79]/90 px-2 py-0.5 rounded text-white text-[10px] font-bold uppercase">
                        <ImageIcon className="w-3 h-3" /> Screenshot
                      </div>
                    </div>
                  ) : article.file_url ? (
                    <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-700 py-8 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <a
                          href={article.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#0E8F79] hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open Attachment
                        </a>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Troubleshooting Steps
                    </h4>
                    <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2">
                      {steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="text-xs text-gray-400 flex items-center gap-3">
                    <span>Published by {article.published_by_name}</span>
                    <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Quick Links */}
      <Card className="bg-gradient-to-br from-[#0E8F79] to-[#0a0a0a] text-white border-none">
        <div className="flex items-start gap-4">
          <BookOpen className="w-8 h-8 text-white/80 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold mb-1">Can't find what you need?</h3>
            <p className="text-white/70 text-sm mb-3">
              If the troubleshooting guides above don't resolve the issue, escalate the ticket to a senior engineer or contact the supervisor team directly.
            </p>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
              Contact Supervisor Team <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
