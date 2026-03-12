import { MAPTECH_LOGO_BASE64 } from './pdfLogo';

/**
 * Shared PDF template system for professional Maptech-branded exports.
 * Provides consistent CSS, header, and footer across all PDF exports.
 */

export const PDF_CSS = `
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #1f2937; background: #fff; padding: 0 0 60px 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page-wrapper { padding: 0 40px 40px 40px; }
  /* ── Header Banner ── */
  .header-banner {
    background: #ffffff;
    padding: 28px 40px 20px 40px;
    display: flex; align-items: center; gap: 20px;
    margin-bottom: 0;
    border-bottom: 3px solid #154734;
  }
  .header-logo { height: 64px; width: auto; }
  .header-text { flex: 1; }
  .header-title {
    font-size: 22px; font-weight: 700; color: #154734; letter-spacing: 0.3px;
    margin-bottom: 2px;
  }
  .header-company {
    font-size: 10px; color: #6b7280; text-transform: uppercase;
    letter-spacing: 2px; font-weight: 500;
  }
  /* ── Sub-header ── */
  .sub-header {
    background: #e8faf0; padding: 10px 40px;
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 2px solid #2FAD52;
    margin-bottom: 28px;
  }
  .sub-header-left { font-size: 13px; color: #154734; font-weight: 600; }
  .sub-header-right { font-size: 11px; color: #6b7280; }
  /* ── Stat Cards ── */
  .stat-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
    margin-bottom: 28px;
  }
  .stat-card {
    background: #ffffff; border: 1px solid #d1fae5; border-radius: 10px;
    padding: 16px 18px; position: relative; overflow: hidden;
  }
  .stat-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 4px; background: #154734; border-radius: 10px 0 0 10px;
  }
  .stat-label {
    font-size: 10px; color: #6b7280; text-transform: uppercase;
    letter-spacing: 0.8px; font-weight: 600; margin-bottom: 6px;
  }
  .stat-value { font-size: 26px; font-weight: 800; color: #154734; }
  /* ── Section Headings ── */
  h2 {
    font-size: 15px; font-weight: 700; color: #154734;
    margin: 24px 0 12px; padding: 8px 0 8px 14px;
    border-left: 4px solid #2FAD52; background: #f0fdf4;
    border-radius: 0 6px 6px 0; letter-spacing: 0.2px;
  }
  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
  thead tr {
    background: #154734;
  }
  th {
    padding: 10px 10px; text-align: left; color: #ffffff;
    font-weight: 600; text-transform: uppercase; font-size: 9px;
    letter-spacing: 0.6px; border: none;
  }
  td {
    padding: 8px 10px; border-bottom: 1px solid #e8faf0; color: #374151;
    font-size: 11px; vertical-align: top;
  }
  tbody tr:nth-child(even) { background: #f8fdf9; }
  tbody tr:hover { background: #e8faf0; }
  /* ── Info Grid (for detail pages) ── */
  .info-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 6px 32px;
    margin-bottom: 16px; padding: 12px 16px;
    background: #fafffe; border: 1px solid #e8faf0; border-radius: 8px;
  }
  .info-row { display: flex; gap: 8px; padding: 5px 0; font-size: 12px; }
  .info-label { font-weight: 600; color: #154734; min-width: 130px; font-size: 11px; }
  .info-value { color: #1f2937; font-size: 12px; }
  .desc {
    padding: 14px 16px; background: #f8fdf9; border: 1px solid #e8faf0;
    border-radius: 8px; font-size: 12px; line-height: 1.7; margin-bottom: 16px;
    white-space: pre-wrap; color: #374151;
  }
  /* ── Badge ── */
  .badge {
    display: inline-block; padding: 3px 10px; border-radius: 20px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.3px;
  }
  /* ── Footer ── */
  .footer-wrap {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
  }
  .footer-divider {
    height: 3px; background: #2FAD52;
    margin-bottom: 0;
  }
  .footer-bar {
    background: #154734;
    padding: 14px 20px; display: flex;
    justify-content: space-between; align-items: center;
  }
  .footer-left { color: #ffffff; font-size: 11px; font-weight: 600; }
  .footer-right { color: rgba(255,255,255,0.7); font-size: 10px; text-align: right; }
  /* ── Print ── */
  @media print {
    body { padding: 0 0 60px 0; }
    .page-wrapper { padding: 0 32px 32px 32px; }
    .header-banner { padding: 24px 32px 20px 32px; }
    .sub-header { padding: 8px 32px; }
    .footer-wrap {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
    }
    .footer-bar { padding: 12px 20px; }
    tbody tr:hover { background: inherit; }
  }
`;

/** Generate the branded header banner HTML */
export function pdfHeader(reportTitle: string, dateStr: string, timeStr: string): string {
  return `
    <div class="header-banner">
      <img src="${MAPTECH_LOGO_BASE64}" alt="Maptech" class="header-logo" />
      <div class="header-text">
        <div class="header-title">${reportTitle}</div>
        <div class="header-company">Maptech Information Solutions Inc.</div>
      </div>
    </div>
    <div class="sub-header">
      <span class="sub-header-left">Official Document</span>
      <span class="sub-header-right">Generated on ${dateStr} at ${timeStr}</span>
    </div>
  `;
}

/** Generate the branded footer HTML */
export function pdfFooter(recordCount: string, dateIso: string, timeStr: string): string {
  return `
    <div class="footer-wrap">
      <div class="footer-divider"></div>
      <div class="footer-bar">
        <div class="footer-left">Maptech Information Solutions Inc.</div>
        <div class="footer-right">
          ${recordCount} &bull; ${dateIso} ${timeStr}<br/>
          Confidential &mdash; For Authorized Use Only
        </div>
      </div>
    </div>
  `;
}

/** Build a full PDF document string ready for window.document.write() */
export function buildPdfDocument(
  title: string,
  reportTitle: string,
  bodyContent: string,
  recordSummary: string,
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString();
  const dateIso = now.toISOString().slice(0, 10);

  return `<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>${PDF_CSS}</style>
  </head><body>
    ${pdfHeader(reportTitle, dateStr, timeStr)}
    <div class="page-wrapper">
      ${bodyContent}
    </div>
    ${pdfFooter(recordSummary, dateIso, timeStr)}
  </body></html>`;
}

/** Open a print window with the given HTML and trigger print */
export function openPrintWindow(html: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
}
