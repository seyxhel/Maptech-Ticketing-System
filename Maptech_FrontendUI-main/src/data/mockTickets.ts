export type Ticket = {
  id: string;
  issue: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'In Progress' | 'Assigned' | 'Resolved' | 'Pending';
  sla: number; // hours remaining
  total: number; // total SLA hours
  created?: string;
  client?: string;
  description?: string;
  contact?: string;
  assignedTo?: string;
  productDetails?: {
    deviceEquipment: string;
    versionNo: string;
    datePurchased: string;
    serialNo: string;
    warranty: string;
    product?: string;
    brand?: string;
    model?: string;
    salesNo?: string;
  };
  actionTaken?: string;
  remarks?: string;
  jobStatus?: string;
  ticketAttachments?: { name: string; type: 'screenshot' | 'recording' }[];
};

function makeSTF(n: number) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `STF-MT-${date}${String(100000 + n).slice(1)}`;
}

const ISSUES: { issue: string; description: string }[] = [
  { issue: 'Database connection failure', description: 'Production database is intermittently refusing connections, causing service outages.' },
  { issue: 'Email sync issues', description: 'Outlook email sync has stopped working for several users since the latest update.' },
  { issue: 'Software license renewal', description: 'The annual license key for the accounting software expired and needs renewal.' },
  { issue: 'VPN access not working', description: 'Remote employees are unable to establish a VPN connection to the office network.' },
  { issue: 'Printer driver installation', description: 'New network printer on 3rd floor needs driver installation on all department PCs.' },
  { issue: 'Server CPU overheating', description: 'Rack server #4 is triggering thermal alerts and throttling under normal load.' },
  { issue: 'Website SSL certificate expired', description: 'The company website is showing a security warning due to an expired SSL certificate.' },
  { issue: 'File sharing permissions error', description: 'Users in the marketing team cannot access the shared drive after a recent migration.' },
  { issue: 'Backup job failing nightly', description: 'Automated nightly backups have been failing with a timeout error for the past 3 days.' },
  { issue: 'Workstation blue screen crash', description: 'A workstation in reception keeps crashing with a BSOD during startup.' },
];

const PRODUCT_DETAILS: Ticket['productDetails'][] = [
  { deviceEquipment: 'Database Server', versionNo: 'PostgreSQL 15.2', datePurchased: 'Mar 15, 2024', serialNo: 'SRV-DB-2024-0451', warranty: 'With Warranty', brand: 'Dell', model: 'PowerEdge R750', salesNo: 'SO-2024-1087' },
  { deviceEquipment: 'Desktop Workstation', versionNo: 'Outlook 365 v2405', datePurchased: 'Jan 10, 2025', serialNo: 'WKS-2025-0892', warranty: 'With Warranty', product: 'Microsoft Office 365', brand: 'HP', model: 'ProDesk 400 G9', salesNo: 'SO-2025-0234' },
  { deviceEquipment: 'License Server', versionNo: 'v12.4.1', datePurchased: 'Jun 20, 2023', serialNo: 'LIC-ACC-2023-0167', warranty: 'Without Warranty', product: 'QuickBooks Enterprise', brand: 'Intuit', salesNo: 'SO-2023-0891' },
  { deviceEquipment: 'VPN Gateway', versionNo: 'FortiOS 7.4.2', datePurchased: 'Sep 5, 2024', serialNo: 'FGT-60F-2024-1102', warranty: 'With Warranty', brand: 'Fortinet', model: 'FortiGate 60F', salesNo: 'SO-2024-0456' },
  { deviceEquipment: 'Network Printer', versionNo: 'Firmware v3.1.0', datePurchased: 'Nov 12, 2024', serialNo: 'PRT-3F-2024-0033', warranty: 'With Warranty', brand: 'HP', model: 'LaserJet Pro M428fdw', salesNo: 'SO-2024-0778' },
  { deviceEquipment: 'Rack Server #4', versionNo: 'BIOS 2.12.1', datePurchased: 'Feb 28, 2023', serialNo: 'SRV-RK4-2023-0019', warranty: 'Without Warranty', brand: 'Supermicro', model: 'SYS-620P-TRT', salesNo: 'SO-2023-0102' },
  { deviceEquipment: 'Web Server', versionNo: 'Apache 2.4.58', datePurchased: 'Aug 14, 2024', serialNo: 'WEB-PRD-2024-0005', warranty: 'With Warranty', brand: 'Dell', model: 'PowerEdge R650', salesNo: 'SO-2024-0319' },
  { deviceEquipment: 'NAS Storage', versionNo: 'DSM 7.2.1', datePurchased: 'Apr 3, 2024', serialNo: 'NAS-MKT-2024-0012', warranty: 'With Warranty', brand: 'Synology', model: 'DS1621+', salesNo: 'SO-2024-0553' },
  { deviceEquipment: 'Backup Server', versionNo: 'Veeam B&R 12.1', datePurchased: 'Oct 22, 2024', serialNo: 'BKP-SRV-2024-0008', warranty: 'With Warranty', brand: 'HPE', model: 'ProLiant DL380 Gen10', salesNo: 'SO-2024-0667' },
  { deviceEquipment: 'Reception Workstation', versionNo: 'Windows 11 23H2', datePurchased: 'Dec 1, 2024', serialNo: 'WKS-RCP-2024-0041', warranty: 'With Warranty', brand: 'Lenovo', model: 'ThinkCentre M75q', salesNo: 'SO-2024-0819' },
];

const ACTION_TAKEN_DATA = [
  'Conducted initial diagnostics remotely. Verified database connectivity and reviewed connection pool logs.',
  '',
  '',
  '',
  '',
  'Opened server chassis, cleaned dust filters. Replaced thermal paste on CPU. Monitoring temperatures.',
  '',
  '',
  'Checked backup logs. Identified storage timeout issue. Reconfigured backup target network path.',
  '',
];

const REMARKS_DATA = [
  'Connection pool exhaustion suspected. Awaiting maintenance window to increase pool limits.',
  '',
  '',
  '',
  '',
  'Thermal readings have stabilized post-cleaning. Will monitor for 48 hours before closing.',
  '',
  '',
  'Backup target NAS was moved to a different VLAN. Updated firewall rules accordingly.',
  '',
];

const JOB_STATUS_DATA = ['Pending', '', '', '', '', 'Under Warranty', '', '', 'For Quotation', ''];

const ATTACHMENTS_DATA: { name: string; type: 'screenshot' | 'recording' }[][] = [
  [{ name: 'db-error-log.png', type: 'screenshot' }, { name: 'connection-test.mp4', type: 'recording' }],
  [],
  [],
  [],
  [],
  [{ name: 'thermal-readings.png', type: 'screenshot' }],
  [],
  [],
  [{ name: 'backup-error.png', type: 'screenshot' }, { name: 'nas-config.png', type: 'screenshot' }],
  [],
];

export const MOCK_TICKETS: Ticket[] = ISSUES.map((item, i) => {
  const id = makeSTF(i + 1);
  const priorities: Ticket['priority'][] = ['Critical', 'High', 'Low', 'Medium', 'Low', 'Critical', 'High', 'Medium', 'High', 'Low'];
  const statuses: Ticket['status'][] = ['In Progress', 'Assigned', 'Resolved', 'Pending', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'In Progress', 'Assigned'];
  return {
    id,
    issue: item.issue,
    priority: priorities[i],
    status: statuses[i],
    sla: [1, 3, 0, 6, 10, 2, 8, 0, 4, 12][i],
    total: [4, 8, 24, 12, 24, 4, 12, 24, 8, 24][i],
    created: new Date(Date.now() - i * 86400000).toLocaleDateString(),
    client: ['Maptech Inc.', 'GlobeTech', 'Acme Corp', 'DataFlow Ltd.', 'NovaStar', 'CloudNine', 'PrimeTech', 'UrbanSoft', 'NetBridge', 'AlphaWave'][i],
    description: item.description,
    contact: ['Juan Dela Cruz', 'Maria Santos', 'Carlos Reyes', 'Ana Lopez', 'Pedro Garcia', 'Sofia Cruz', 'Diego Tan', 'Lea Ramos', 'Marco Sy', 'Nina Lim'][i],
    assignedTo: i % 2 === 0 ? 'engineerA' : 'engineerB',
    productDetails: PRODUCT_DETAILS[i],
    actionTaken: ACTION_TAKEN_DATA[i],
    remarks: REMARKS_DATA[i],
    jobStatus: JOB_STATUS_DATA[i],
    ticketAttachments: ATTACHMENTS_DATA[i],
  };
});

export function getTicketById(id?: string) {
  if (!id) return undefined;
  // allow passing id that is already STF or a numeric index
  const found = MOCK_TICKETS.find((t) => t.id === id || t.id.toLowerCase() === id.toLowerCase());
  return found;
}
