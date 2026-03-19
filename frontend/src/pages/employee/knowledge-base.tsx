import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import {
  Search,
  BookOpen,
  ArrowUpRight,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Film,
  File as FileIcon,
  ExternalLink,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import type { PublishedArticle } from '../../services/api';
import { fetchPublishedArticles } from '../../services/api';

const ITEMS_PER_PAGE = 12;

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

function getFileExtension(url: string): string {
  const [path] = url.split('?');
  const name = path.split('/').pop() || '';
  return name.split('.').pop()?.toLowerCase() || '';
}

function getFileName(url: string): string {
  const [path] = url.split('?');
  const name = path.split('/').pop() || 'attachment';
  return decodeURIComponent(name);
}

function FileTypeIcon({ url }: { url: string }) {
  if (isImageUrl(url)) return <ImageIcon className="w-5 h-5 text-emerald-500" />;
  if (isVideoUrl(url)) return <Film className="w-5 h-5 text-purple-500" />;
  const ext = getFileExtension(url);
  if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(ext)) {
    return <FileText className="w-5 h-5 text-blue-500" />;
  }
  return <FileIcon className="w-5 h-5 text-gray-500" />;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm text-gray-800 dark:text-gray-200 break-words">{value || '—'}</div>
    </div>
  );
}

export default function EmployeeKnowledgeBase() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selected, setSelected] = useState<PublishedArticle | null>(null);
  const [page, setPage] = useState(1);
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

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
      <div className="space-y-4">
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
        {paged.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paged.map((article) => {
              const steps = parseSteps(article.published_description);
              return (
                <Card
                  key={article.id}
                  className="p-0 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelected(article)}
                >
                  <div className="h-40 bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative group">
                    {isImageUrl(article.file_url) ? (
                      <img
                        src={article.file_url}
                        alt={article.published_title}
                        className="w-full h-full object-cover"
                      />
                    ) : isVideoUrl(article.file_url) ? (
                      <video
                        src={article.file_url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileTypeIcon url={article.file_url} />
                        <span className="text-xs text-gray-400 uppercase">{getFileExtension(article.file_url)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2" title={article.published_title}>
                      {article.published_title}
                    </p>
                    <p className="text-xs text-[#0E8F79] font-medium">{article.stf_no}</p>

                    {article.published_tags && article.published_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {article.published_tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-[#0E8F79]/10 text-[#0E8F79] text-[10px] font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {steps.length > 0 && (
                      <ol className="list-decimal list-inside text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                        {steps.slice(0, 2).map((step, i) => (
                          <li key={i} className="truncate">{step}</li>
                        ))}
                      </ol>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-[10px] text-gray-400">{article.published_by_name || 'Unknown'}</span>
                      <span className="text-[10px] text-gray-400">{new Date(article.published_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-gray-400">…</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-[#0E8F79] text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Article Details</h2>
                <p className="text-sm text-[#0E8F79] font-medium">{selected.stf_no}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-5">
              <div className="rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                {isImageUrl(selected.file_url) ? (
                  <img
                    src={selected.file_url}
                    alt={selected.published_title}
                    className="w-full max-h-96 object-contain"
                  />
                ) : isVideoUrl(selected.file_url) ? (
                  <div className="w-full aspect-video bg-black">
                    <video controls playsInline preload="metadata" className="w-full h-full object-cover bg-black">
                      <source src={selected.file_url} />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <FileTypeIcon url={selected.file_url} />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getFileName(selected.file_url)}</p>
                    <a
                      href={selected.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E8F79] text-white text-sm font-medium hover:bg-[#0b7a67] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Open File
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailRow label="Title" value={selected.published_title} />
                <DetailRow label="STF Number" value={selected.stf_no} />
                <DetailRow label="File Name" value={getFileName(selected.file_url)} />
                <DetailRow label="Uploaded By" value={selected.uploaded_by_name || '—'} />
                <DetailRow label="Published By" value={selected.published_by_name || '—'} />
                <DetailRow label="Uploaded At" value={new Date(selected.uploaded_at).toLocaleString()} />
                <DetailRow label="Published At" value={new Date(selected.published_at).toLocaleString()} />
                <DetailRow
                  label="Tags"
                  value={
                    (selected.published_tags && selected.published_tags.length > 0) ? (
                      <div className="flex flex-wrap gap-1">
                        {selected.published_tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-[#0E8F79]/10 text-[#0E8F79] text-[10px] font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : '—'
                  }
                />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Troubleshooting Steps
                </h4>
                <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  {parseSteps(selected.published_description).map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

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
