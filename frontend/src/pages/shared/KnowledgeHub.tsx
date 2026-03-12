import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import {
  Search,
  Paperclip,
  RefreshCw,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Image as ImageIcon,
  Film,
  File as FileIcon,
  ExternalLink,
  Archive,
  ArchiveRestore,
  Send,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import type { KnowledgeHubAttachment } from '../../services/api';
import {
  fetchKnowledgeHubAttachments,
  deleteKnowledgeHubAttachment,
  archiveAttachment,
  unarchiveAttachment,
  publishAttachment,
  updateKnowledgeHubAttachment,
} from '../../services/api';

const ITEMS_PER_PAGE = 12;

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  escalated: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  escalated_external: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  pending_closure: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
  escalated: 'Escalated',
  escalated_external: 'Ext. Escalated',
  pending_closure: 'Pending Closure',
};

function getFileExtension(url: string): string {
  const name = url.split('/').pop() || '';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ext;
}

function isImageFile(url: string): boolean {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(getFileExtension(url));
}

function isVideoFile(url: string): boolean {
  return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(getFileExtension(url));
}

function getFileName(url: string): string {
  const name = url.split('/').pop() || 'attachment';
  return decodeURIComponent(name);
}

function FileTypeIcon({ url }: { url: string }) {
  if (isImageFile(url)) return <ImageIcon className="w-5 h-5 text-emerald-500" />;
  if (isVideoFile(url)) return <Film className="w-5 h-5 text-purple-500" />;
  const ext = getFileExtension(url);
  if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(ext))
    return <FileText className="w-5 h-5 text-blue-500" />;
  return <FileIcon className="w-5 h-5 text-gray-500" />;
}

export default function KnowledgeHub({ filter }: { filter?: 'uploaded' | 'published' | 'archived' }) {
  const [attachments, setAttachments] = useState<KnowledgeHubAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'images' | 'videos'>('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<KnowledgeHubAttachment | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [publishTarget, setPublishTarget] = useState<KnowledgeHubAttachment | null>(null);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishSteps, setPublishSteps] = useState<string[]>(['']);
  const [publishTags, setPublishTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [editTarget, setEditTarget] = useState<KnowledgeHubAttachment | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSteps, setEditSteps] = useState<string[]>(['']);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Build API filter params based on the active filter
  const getFilterParams = useCallback(() => {
    const params: Record<string, string | undefined> = {
      search: search || undefined,
    };
    if (filter === 'uploaded') {
      params.published = 'false';
      params.archived = 'false';
    } else if (filter === 'published') {
      params.published = 'true';
      params.archived = 'false';
    } else if (filter === 'archived') {
      params.archived = 'true';
    }
    return params;
  }, [filter, search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchKnowledgeHubAttachments(getFilterParams());
      setAttachments(items);
    } catch {
      toast.error('Failed to load attachments.');
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  }, [getFilterParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    setDeleting(id);
    try {
      await deleteKnowledgeHubAttachment(id);
      toast.success('Attachment deleted.');
    } catch {
      toast.error('Failed to delete attachment.');
    }
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    if (selected?.id === id) setSelected(null);
    setDeleting(null);
  };

  const handleArchive = async (id: number) => {
    try {
      await archiveAttachment(id);
      toast.success('Attachment archived.');
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
      toast.error('Failed to archive attachment.');
    }
  };

  const handleUnarchive = async (id: number) => {
    try {
      await unarchiveAttachment(id);
      toast.success('Attachment unarchived.');
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
      toast.error('Failed to unarchive attachment.');
    }
  };

  const parseSteps = (desc: string): string[] => {
    try {
      const parsed = JSON.parse(desc);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* plain text fallback */ }
    return desc ? desc.split('\n').filter((s: string) => s.trim()) : [''];
  };

  const openEditModal = (att: KnowledgeHubAttachment) => {
    setEditTarget(att);
    setEditTitle(att.published_title || '');
    setEditSteps(parseSteps(att.published_description).length ? parseSteps(att.published_description) : ['']);
    setEditTags(att.published_tags || []);
    setEditTagInput('');
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editTitle.trim()) {
      toast.error('Title is required.');
      return;
    }
    const steps = editSteps.map((s) => s.trim()).filter(Boolean);
    if (steps.length === 0) {
      toast.error('At least one troubleshooting step is required.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateKnowledgeHubAttachment(editTarget.id, {
        published_title: editTitle.trim(),
        published_description: JSON.stringify(steps),
        published_tags: editTags,
      });
      toast.success('Article updated.');
      setAttachments((prev) => prev.map((a) => (a.id === editTarget.id ? updated : a)));
      if (selected?.id === editTarget.id) setSelected(updated);
      setEditTarget(null);
    } catch {
      toast.error('Failed to update article.');
    } finally {
      setSaving(false);
    }
  };

  const openPublishModal = (att: KnowledgeHubAttachment) => {
    setPublishTarget(att);
    setPublishTitle('');
    setPublishSteps(['']);
    setPublishTags([]);
    setTagInput('');
  };

  const handlePublish = async () => {
    if (!publishTarget) return;
    if (!publishTitle.trim()) {
      toast.error('Title is required.');
      return;
    }
    const steps = publishSteps.map((s) => s.trim()).filter(Boolean);
    if (steps.length === 0) {
      toast.error('At least one troubleshooting step is required.');
      return;
    }
    setPublishing(true);
    try {
      await publishAttachment(publishTarget.id, {
        published_title: publishTitle.trim(),
        published_description: JSON.stringify(steps),
        published_tags: publishTags,
      });
      toast.success('Attachment published.');
      setAttachments((prev) => prev.filter((a) => a.id !== publishTarget.id));
      if (selected?.id === publishTarget.id) setSelected(null);
      setPublishTarget(null);
    } catch {
      toast.error('Failed to publish attachment.');
    } finally {
      setPublishing(false);
    }
  };

  const FILTER_HEADINGS: Record<string, { title: string; subtitle: string }> = {
    uploaded: { title: 'Uploaded Attachments', subtitle: 'Proof attachments that have not yet been published or archived' },
    published: { title: 'Published Attachments', subtitle: 'Attachments published to the employee Knowledge Hub' },
    archived: { title: 'Archived Attachments', subtitle: 'Attachments that have been archived' },
  };
  const heading = filter ? FILTER_HEADINGS[filter] : { title: 'Knowledge Hub', subtitle: 'Proof attachments submitted through STF Ticket forms' };

  // Client-side type filtering
  const filtered = attachments.filter((att) => {
    if (typeFilter === 'images') return isImageFile(att.file);
    if (typeFilter === 'videos') return isVideoFile(att.file);
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{heading.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {heading.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by STF no, client, description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-[#3BC25B] dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as '' | 'images' | 'videos'); setPage(1); }}
                className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-[#3BC25B] dark:text-white"
              >
                <option value="">All Types</option>
                <option value="images">Images</option>
                <option value="videos">Videos</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Attachments Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : paged.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No proof attachments found</p>
            <p className="text-sm mt-1">Proof attachments from STF ticket forms will appear here.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paged.map((att) => (
            <Card key={att.id} className="p-0 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Preview Area */}
              <div
                className="h-40 bg-gray-50 dark:bg-gray-900 flex items-center justify-center cursor-pointer relative group"
                onClick={() => setSelected(att)}
              >
                {isImageFile(att.file) ? (
                  <img
                    src={att.file}
                    alt={getFileName(att.file)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.classList.add('flex', 'items-center', 'justify-center');
                        const icon = document.createElement('div');
                        icon.innerHTML = '📎';
                        icon.className = 'text-4xl';
                        parent.appendChild(icon);
                      }
                    }}
                  />
                ) : isVideoFile(att.file) ? (
                  <div className="flex flex-col items-center gap-2">
                    <Film className="w-10 h-10 text-purple-400" />
                    <span className="text-xs text-gray-400">Video</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileTypeIcon url={att.file} />
                    <span className="text-xs text-gray-400 uppercase">{getFileExtension(att.file)}</span>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {filter === 'published' && att.published_title ? (
                      <>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={att.published_title}>
                          {att.published_title}
                        </p>
                        <p className="text-xs text-[#0E8F79] font-medium">{att.stf_no}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={getFileName(att.file)}>
                          {getFileName(att.file)}
                        </p>
                        <p className="text-xs text-[#0E8F79] font-medium">{att.stf_no}</p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={att.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Open in new tab"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {filter === 'uploaded' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openPublishModal(att); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Publish"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {filter === 'published' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(att); }}
                        className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-400 hover:text-amber-500 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {filter !== 'archived' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleArchive(att.id); }}
                        className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-400 hover:text-orange-500 transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {filter === 'archived' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUnarchive(att.id); }}
                        className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-500 transition-colors"
                        title="Unarchive"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(att.id); }}
                      disabled={deleting === att.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {filter === 'published' ? (
                  <div className="space-y-2">
                    {/* Tags */}
                    {att.published_tags && att.published_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {att.published_tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-[#0E8F79]/10 text-[#0E8F79] text-[10px] font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Steps preview */}
                    {att.published_description && (() => {
                      const steps = parseSteps(att.published_description);
                      return steps.length > 0 ? (
                        <ol className="list-decimal list-inside text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                          {steps.slice(0, 3).map((step, i) => (
                            <li key={i} className="truncate">{step}</li>
                          ))}
                          {steps.length > 3 && (
                            <li className="text-gray-400 list-none pl-4">+{steps.length - 3} more steps...</li>
                          )}
                        </ol>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                    {att.client && <p><span className="font-medium">Client:</span> {att.client}</p>}
                    {att.assigned_to_name && <p><span className="font-medium">Assigned:</span> {att.assigned_to_name}</p>}
                    {att.type_of_service_name && <p><span className="font-medium">Service:</span> {att.type_of_service_name}</p>}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] text-gray-400">
                    {att.uploaded_by ? `${att.uploaded_by.first_name} ${att.uploaded_by.last_name}` : 'Unknown'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(att.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
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
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <span className="px-1 text-gray-400">…</span>
                  )}
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
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Attachment Details</h2>
                <p className="text-sm text-[#0E8F79] font-medium">{selected.stf_no}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Preview */}
              <div className="rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                {isImageFile(selected.file) ? (
                  <img
                    src={selected.file}
                    alt={getFileName(selected.file)}
                    className="w-full max-h-96 object-contain"
                  />
                ) : isVideoFile(selected.file) ? (
                  <video controls className="w-full max-h-96">
                    <source src={selected.file} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <FileTypeIcon url={selected.file} />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getFileName(selected.file)}</p>
                    <a
                      href={selected.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E8F79] text-white text-sm font-medium hover:bg-[#0b7a67] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Open File
                    </a>
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="File Name" value={getFileName(selected.file)} />
                <DetailRow label="STF Number" value={selected.stf_no} />
                <DetailRow label="Client" value={selected.client || '—'} />
                <DetailRow
                  label="Ticket Status"
                  value={
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[selected.ticket_status] || ''}`}>
                      {STATUS_LABELS[selected.ticket_status] || selected.ticket_status}
                    </span>
                  }
                />
                <DetailRow label="Type of Service" value={selected.type_of_service_name || '—'} />
                <DetailRow label="Assigned To" value={selected.assigned_to_name || '—'} />
                <DetailRow
                  label="Uploaded By"
                  value={selected.uploaded_by ? `${selected.uploaded_by.first_name} ${selected.uploaded_by.last_name}` : '—'}
                />
                <DetailRow
                  label="Uploaded At"
                  value={new Date(selected.uploaded_at).toLocaleString()}
                />
                <DetailRow
                  label="Resolution Proof"
                  value={selected.is_resolution_proof ? 'Yes' : 'No'}
                />
              </div>

              {/* Description */}
              {selected.description_of_problem && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Description of Problem
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    {selected.description_of_problem}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <a
                  href={selected.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E8F79] text-white text-sm font-medium hover:bg-[#0b7a67] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Open File
                </a>
                {filter === 'uploaded' && (
                  <button
                    onClick={() => { setSelected(null); openPublishModal(selected); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Send className="w-4 h-4" /> Publish
                  </button>
                )}
                {filter === 'published' && (
                  <button
                    onClick={() => { setSelected(null); openEditModal(selected); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                )}
                {filter !== 'archived' && (
                  <button
                    onClick={() => handleArchive(selected.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  >
                    <Archive className="w-4 h-4" /> Archive
                  </button>
                )}
                {filter === 'archived' && (
                  <button
                    onClick={() => handleUnarchive(selected.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <ArchiveRestore className="w-4 h-4" /> Unarchive
                  </button>
                )}
                <button
                  onClick={() => { handleDelete(selected.id); }}
                  disabled={deleting === selected.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {publishTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setPublishTarget(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Publish Attachment</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{getFileName(publishTarget.file)}</p>
              </div>
              <button
                onClick={() => setPublishTarget(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  placeholder="Enter a title for this published attachment..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-[#3BC25B] dark:text-white"
                  maxLength={300}
                />
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags <span className="text-xs text-gray-400 font-normal">(max 3)</span></label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-h-[42px]">
                  {publishTags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0E8F79]/10 text-[#0E8F79] text-xs font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setPublishTags((prev) => prev.filter((_, idx) => idx !== i))}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {publishTags.length < 3 && (
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = tagInput.trim();
                          if (val && !publishTags.includes(val)) {
                            setPublishTags((prev) => [...prev, val]);
                            setTagInput('');
                          }
                        }
                      }}
                      placeholder={publishTags.length === 0 ? 'Type a tag and press Enter...' : 'Add another...'}
                      className="flex-1 min-w-[120px] bg-transparent text-sm outline-none dark:text-white"
                    />
                  )}
                </div>
              </div>

              {/* Troubleshooting Steps */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Troubleshooting Steps <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {publishSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-7 h-9 flex items-center justify-center text-xs font-bold text-[#0E8F79]">
                        {i + 1}.
                      </span>
                      <input
                        value={step}
                        onChange={(e) => {
                          const next = [...publishSteps];
                          next[i] = e.target.value;
                          setPublishSteps(next);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const next = [...publishSteps];
                            next.splice(i + 1, 0, '');
                            setPublishSteps(next);
                            // Focus next input after render
                            setTimeout(() => {
                              const inputs = document.querySelectorAll<HTMLInputElement>('[data-step-input]');
                              inputs[i + 1]?.focus();
                            }, 0);
                          } else if (e.key === 'Backspace' && step === '' && publishSteps.length > 1) {
                            e.preventDefault();
                            const next = publishSteps.filter((_, idx) => idx !== i);
                            setPublishSteps(next);
                            setTimeout(() => {
                              const inputs = document.querySelectorAll<HTMLInputElement>('[data-step-input]');
                              inputs[Math.max(0, i - 1)]?.focus();
                            }, 0);
                          }
                        }}
                        data-step-input
                        placeholder={`Step ${i + 1}...`}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-[#3BC25B] dark:text-white"
                      />
                      {publishSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPublishSteps((prev) => prev.filter((_, idx) => idx !== i))}
                          className="flex-shrink-0 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Press Enter to add a new step. Backspace on an empty step to remove it.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setPublishTarget(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E8F79] text-white text-sm font-medium hover:bg-[#0b7a67] transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setEditTarget(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Published Article</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{getFileName(editTarget.file)}</p>
              </div>
              <button
                onClick={() => setEditTarget(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter a title..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-[#3BC25B] dark:text-white"
                  maxLength={300}
                />
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags <span className="text-xs text-gray-400 font-normal">(max 3)</span></label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-h-[42px]">
                  {editTags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0E8F79]/10 text-[#0E8F79] text-xs font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setEditTags((prev) => prev.filter((_, idx) => idx !== i))}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {editTags.length < 3 && (
                    <input
                      value={editTagInput}
                      onChange={(e) => setEditTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = editTagInput.trim();
                          if (val && !editTags.includes(val)) {
                            setEditTags((prev) => [...prev, val]);
                            setEditTagInput('');
                          }
                        }
                      }}
                      placeholder={editTags.length === 0 ? 'Type a tag and press Enter...' : 'Add another...'}
                      className="flex-1 min-w-[120px] bg-transparent text-sm outline-none dark:text-white"
                    />
                  )}
                </div>
              </div>

              {/* Troubleshooting Steps */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Troubleshooting Steps <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {editSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-7 h-9 flex items-center justify-center text-xs font-bold text-[#0E8F79]">
                        {i + 1}.
                      </span>
                      <input
                        value={step}
                        onChange={(e) => {
                          const next = [...editSteps];
                          next[i] = e.target.value;
                          setEditSteps(next);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const next = [...editSteps];
                            next.splice(i + 1, 0, '');
                            setEditSteps(next);
                            setTimeout(() => {
                              const inputs = document.querySelectorAll<HTMLInputElement>('[data-edit-step]');
                              inputs[i + 1]?.focus();
                            }, 0);
                          } else if (e.key === 'Backspace' && step === '' && editSteps.length > 1) {
                            e.preventDefault();
                            const next = editSteps.filter((_, idx) => idx !== i);
                            setEditSteps(next);
                            setTimeout(() => {
                              const inputs = document.querySelectorAll<HTMLInputElement>('[data-edit-step]');
                              inputs[Math.max(0, i - 1)]?.focus();
                            }, 0);
                          }
                        }}
                        data-edit-step
                        placeholder={`Step ${i + 1}...`}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-[#3BC25B] dark:text-white"
                      />
                      {editSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditSteps((prev) => prev.filter((_, idx) => idx !== i))}
                          className="flex-shrink-0 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Press Enter to add a new step. Backspace on an empty step to remove it.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E8F79] text-white text-sm font-medium hover:bg-[#0b7a67] transition-colors disabled:opacity-50"
                >
                  <Pencil className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">{typeof value === 'string' ? value : value}</dd>
    </div>
  );
}
