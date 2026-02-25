import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import {
  Search,
  BookOpen,
  AlertTriangle,
  Database,
  Wifi,
  Shield,
  Server,
  Monitor,
  HardDrive,
  Mail,
  ChevronRight,
  ArrowUpRight,
  Play,
  Image as ImageIcon,
  Video,
} from 'lucide-react';

interface Article {
  id: number;
  title: string;
  category: string;
  icon: React.ElementType;
  content: string[];
  escalation?: string;
  media: {
    type: 'video' | 'image';
    caption: string;
    duration?: string;
  };
}

const ARTICLES: Article[] = [
  {
    id: 1,
    title: 'Database Connection Failure',
    category: 'Database',
    icon: Database,
    content: [
      'Check if the database service is running: sudo systemctl status postgresql.',
      'Verify connection string credentials in the .env file.',
      'Test connectivity with: pg_isready -h <host> -p 5432.',
      'Review database logs at /var/log/postgresql/ for error details.',
      'If connection pool is exhausted, restart the application server and increase pool size.',
    ],
    escalation: 'If the issue persists after all steps, escalate to the Database Administration team with logs attached.',
    media: { type: 'video', caption: 'Database Diagnostics Walkthrough', duration: '4:32' },
  },
  {
    id: 2,
    title: 'Email Sync Issues',
    category: 'Email',
    icon: Mail,
    content: [
      `Confirm the user's email credentials and app password are correct.`,
      'Check IMAP/SMTP server settings and ports (993 for IMAP SSL, 587 for SMTP TLS).',
      'Clear local email cache and re-sync the mailbox.',
      'Verify there are no firewall rules blocking mail server access.',
      'Test with a different email client to isolate the issue.',
    ],
    escalation: 'Escalate to the Email Infrastructure team if the server itself is unreachable or returning 5xx errors.',
    media: { type: 'image', caption: 'IMAP / SMTP Configuration Screenshot' },
  },
  {
    id: 3,
    title: 'VPN Access Not Working',
    category: 'Network',
    icon: Wifi,
    content: [
      'Verify the VPN client is updated to the latest version.',
      `Check if the user's VPN certificate has expired and renew if needed.`,
      'Ensure the user is not behind a restrictive firewall blocking VPN protocols.',
      'Try switching between TCP and UDP VPN protocols.',
      'Restart the VPN service and flush DNS: ipconfig /flushdns.',
    ],
    escalation: 'If multiple users are affected, escalate to the Network Security team — may indicate a server-side issue.',
    media: { type: 'video', caption: 'VPN Troubleshooting Tutorial', duration: '6:15' },
  },
  {
    id: 4,
    title: 'Server CPU Overheating',
    category: 'Hardware',
    icon: Server,
    content: [
      'Check server room temperature and HVAC status.',
      'Verify all cooling fans are operational using IPMI/BMC interface.',
      'Review running processes for abnormal CPU consumption: top or htop.',
      'Check for dust buildup in server chassis — schedule cleaning if needed.',
      'Reduce load by migrating non-critical services to another server temporarily.',
    ],
    escalation: 'Escalate to the Data Center Operations team for hardware inspection if thermal throttling continues.',
    media: { type: 'image', caption: 'Thermal Monitoring Dashboard' },
  },
  {
    id: 5,
    title: 'SSL Certificate Expired',
    category: 'Security',
    icon: Shield,
    content: [
      'Check certificate expiry: openssl s_client -connect domain:443 | openssl x509 -noout -dates.',
      `Renew the certificate through your CA provider or Let's Encrypt.`,
      'Install the new certificate on the web server and restart the service.',
      'Verify the full certificate chain is correctly configured.',
      'Set up automated renewal with certbot renew --dry-run.',
    ],
    escalation: 'If the domain is managed externally, escalate to the vendor with urgency due to security exposure.',
    media: { type: 'video', caption: 'SSL Certificate Renewal Demo', duration: '3:48' },
  },
  {
    id: 6,
    title: 'File Sharing Permissions Error',
    category: 'Storage',
    icon: HardDrive,
    content: [
      `Verify the user's Active Directory group membership.`,
      'Check share-level and NTFS permissions on the file server.',
      `Run gpupdate /force on the user's machine to refresh group policies.`,
      'Test access from a different machine to isolate client-side issues.',
      'Review recent changes to folder permissions or group policies.',
    ],
    escalation: 'Escalate to the Systems Administration team if permissions appear correct but access is still denied.',
    media: { type: 'image', caption: 'NTFS Permissions Configuration' },
  },
  {
    id: 7,
    title: 'Backup Job Failing',
    category: 'Storage',
    icon: HardDrive,
    content: [
      'Check backup software logs for specific error codes.',
      'Verify target storage has sufficient free space.',
      'Ensure network connectivity to the backup target is stable.',
      'Test a manual backup run to isolate scheduling issues.',
      'Review recent changes to backup policies or retention rules.',
    ],
    escalation: 'Escalate to the Backup & Recovery team if data integrity is at risk.',
    media: { type: 'video', caption: 'Backup Recovery Walkthrough', duration: '5:22' },
  },
  {
    id: 8,
    title: 'Workstation Blue Screen (BSOD)',
    category: 'Hardware',
    icon: Monitor,
    content: [
      'Note the BSOD stop code (e.g., IRQL_NOT_LESS_OR_EQUAL, PAGE_FAULT_IN_NONPAGED_AREA).',
      'Boot into Safe Mode and check for recently installed drivers or updates.',
      'Run sfc /scannow and DISM /Online /Cleanup-Image /RestoreHealth.',
      'Check RAM with Windows Memory Diagnostic or memtest86.',
      'Review Event Viewer > System logs for critical errors before the crash.',
    ],
    escalation: 'If hardware failure is suspected (RAM, HDD), escalate to the Hardware Support team for replacement.',
    media: { type: 'image', caption: 'BSOD Error Code Quick Reference' },
  },
];

const CATEGORIES = ['All', ...Array.from(new Set(ARTICLES.map((a) => a.category)))];

export default function EmployeeKnowledgeBase() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = ARTICLES.filter((a) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || a.title.toLowerCase().includes(q) || a.content.some((c) => c.toLowerCase().includes(q));
    const matchCat = selectedCategory === 'All' || a.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
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
            placeholder="Search articles..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-[#3BC25B]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#0E8F79] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No articles found matching your search.</p>
          </Card>
        )}
        {filtered.map((article) => {
          const isExpanded = expandedId === article.id;
          const Icon = article.icon;
          return (
            <Card
              key={article.id}
              className="cursor-pointer hover:border-[#3BC25B] dark:hover:border-[#3BC25B] transition-all"
              onClick={() => setExpandedId(isExpanded ? null : article.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0E8F79]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#0E8F79]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{article.title}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{article.category}</span>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                  {/* Demo Media */}
                  {article.media.type === 'video' ? (
                    <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video flex items-center justify-center cursor-pointer group">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
                      <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 30% 40%, rgba(14,143,121,0.4), transparent 50%)' }} />
                      <div className="relative flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
                          <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
                        </div>
                        <span className="text-white/80 text-xs font-medium">{article.media.caption}</span>
                      </div>
                      {article.media.duration && (
                        <div className="absolute bottom-2.5 right-3 bg-black/70 px-2 py-0.5 rounded text-white/90 text-xs font-mono">
                          {article.media.duration}
                        </div>
                      )}
                      <div className="absolute top-2.5 left-3 flex items-center gap-1.5 bg-red-600/90 px-2 py-0.5 rounded text-white text-[10px] font-bold uppercase">
                        <Video className="w-3 h-3" /> Demo Video
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-700 aspect-video flex items-center justify-center">
                      <div className="relative flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-[#0E8F79]/10 flex items-center justify-center">
                          <ImageIcon className="w-7 h-7 text-[#0E8F79]" />
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium text-center px-4">{article.media.caption}</span>
                      </div>
                      <div className="absolute top-2.5 left-3 flex items-center gap-1.5 bg-[#0E8F79]/90 px-2 py-0.5 rounded text-white text-[10px] font-bold uppercase">
                        <ImageIcon className="w-3 h-3" /> Screenshot
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Troubleshooting Steps
                    </h4>
                    <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2">
                      {article.content.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {article.escalation && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                          Escalation
                        </h5>
                        <p className="text-sm text-amber-800 dark:text-amber-300">{article.escalation}</p>
                      </div>
                    </div>
                  )}
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
              If the troubleshooting guides above don't resolve the issue, escalate the ticket to a senior engineer or contact the admin team directly.
            </p>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
              Contact Admin Team <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
