import { MAPTECH_LOGO_BASE64 } from './pdfLogo';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
    font-size: 11px;
    line-height: 1.4;
  }
  .page-wrapper { padding: 0 32px 60px 32px; }
  /* ── Header Banner ── */
  .header-banner {
    background: #ffffff;
    padding: 20px 32px 16px 32px;
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 0;
    border-bottom: 3px solid #154734;
  }
  .header-logo { height: 52px; width: auto; }
  .header-text { flex: 1; }
  .header-title {
    font-size: 20px; font-weight: 700; color: #154734; letter-spacing: 0.3px;
    margin-bottom: 2px;
  }
  .header-company {
    font-size: 9px; color: #6b7280; text-transform: uppercase;
    letter-spacing: 1.5px; font-weight: 500;
  }
  /* ── Sub-header ── */
  .sub-header {
    background: #e8faf0; padding: 8px 32px;
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 2px solid #2FAD52;
    margin-bottom: 20px;
  }
  .sub-header-left { font-size: 11px; color: #154734; font-weight: 600; }
  .sub-header-right { font-size: 10px; color: #6b7280; }
  /* ── Stat Cards ── */
  .stat-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
    margin-bottom: 20px;
  }
  .stat-card {
    background: #ffffff; border: 1px solid #d1fae5; border-radius: 8px;
    border-left: 4px solid #154734;
    padding: 12px 14px; overflow: hidden;
    min-height: 70px;
  }
  .stat-label {
    font-size: 9px; color: #6b7280; text-transform: uppercase;
    letter-spacing: 0.6px; font-weight: 600; margin-bottom: 4px;
  }
  .stat-value { 
    font-size: 16px; font-weight: 700; color: #154734; 
    line-height: 1.2; word-break: break-word;
  }
  /* ── Section Headings ── */
  h2 {
    font-size: 13px; font-weight: 700; color: #154734;
    margin: 18px 0 10px; padding: 6px 0 6px 12px;
    border-left: 4px solid #2FAD52; background: #f0fdf4;
    border-radius: 0 6px 6px 0; letter-spacing: 0.2px;
  }
  h2:first-child { margin-top: 0; }
  h3 {
    font-size: 13px;
    font-weight: 700;
    color: #154734;
    margin: 18px 0 10px;
    line-height: 1.3;
  }
  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10px; }
  thead tr {
    background: #154734;
  }
  th {
    padding: 8px 8px; text-align: left; color: #ffffff;
    font-weight: 600; text-transform: uppercase; font-size: 8px;
    letter-spacing: 0.5px; border: none;
  }
  td {
    padding: 6px 8px; border-bottom: 1px solid #e8faf0; color: #374151;
    font-size: 10px; vertical-align: top;
  }
  tbody tr:nth-child(even) { background: #f8fdf9; }
  /* ── Info Grid (for detail pages) ── */
  .info-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px;
    margin-bottom: 12px; padding: 10px 14px;
    background: #fafffe; border: 1px solid #e8faf0; border-radius: 6px;
  }
  .info-row { display: flex; gap: 6px; padding: 4px 0; font-size: 11px; align-items: flex-start; }
  .info-label { font-weight: 600; color: #154734; min-width: 120px; flex-shrink: 0; font-size: 10px; }
  .info-value { color: #1f2937; font-size: 11px; word-break: break-word; }
  .desc {
    padding: 12px 14px; background: #f8fdf9; border: 1px solid #e8faf0;
    border-radius: 6px; font-size: 11px; line-height: 1.6; margin-bottom: 12px;
    white-space: pre-wrap; color: #374151;
  }
  /* ── Signature Section ── */
  .signature-section {
    margin-top: 16px;
    padding: 12px 14px;
    background: #fafffe;
    border: 1px solid #e8faf0;
    border-radius: 6px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 28px;
  }
  .signature-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .signature-item .info-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    color: #154734;
    font-size: 10px;
    text-align: center;
    min-width: 0; /* allow centering inside grid column */
  }
  .signature-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 220px;
    min-height: 70px;
    padding: 8px 12px;
    background: #ffffff;
    border: 1px solid #d1fae5;
    border-radius: 6px;
  }
  .signature-box img {
    max-height: 60px;
    max-width: 180px;
    object-fit: contain;
  }
  .signature-name {
    margin-top: 8px;
    font-size: 11px;
    color: #1f2937;
    word-break: break-word;
    width: 100%;
    text-align: center;
  }
  .signature-title {
    font-size: 12px;
    font-weight: 600;
    color: #154734;
    width: 100%;
  }
  /* ── Page Break Control ── */
  h2 { page-break-after: avoid; }
  .info-grid, .stat-grid, table { page-break-inside: avoid; }
  tr { page-break-inside: avoid; }
  .desc { page-break-inside: avoid; }
  .signature-section { page-break-inside: avoid; }
  /* ── Badge ── */
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 12px;
    font-size: 9px; font-weight: 700; letter-spacing: 0.3px;
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
    padding: 10px 20px; display: flex;
    justify-content: space-between; align-items: center;
  }
  .footer-left { color: #ffffff; font-size: 10px; font-weight: 600; }
  .footer-right { color: rgba(255,255,255,0.8); font-size: 9px; text-align: right; line-height: 1.4; }
  /* ── Print ── */
  @media print {
    body { padding: 0 0 60px 0; }
    .page-wrapper { padding: 0 32px 60px 32px; }
    .header-banner { padding: 20px 32px 16px 32px; }
    .sub-header { padding: 8px 32px; }
    .footer-wrap {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
    }
    .footer-bar { padding: 10px 20px; }
  }
`;

/** Generate the branded header banner HTML */
export function pdfHeader(
  reportTitle: string,
  dateStr: string,
  timeStr: string,
): string {
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
  signatureData?: string,
  signedBy?: string,
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString();
  const dateIso = now.toISOString().slice(0, 10);
  const signatureMeta = signatureData ? 'present' : 'none';
  const signedByMeta = signedBy || 'n/a';

  return `<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>${PDF_CSS}</style>
  </head><body>
    <!-- signature:${signatureMeta}; signedBy:${signedByMeta} -->
    ${pdfHeader(reportTitle, dateStr, timeStr)}
    <div class="page-wrapper">
      ${bodyContent}
    </div>
    ${pdfFooter(recordSummary, dateIso, timeStr)}
  </body></html>`;
}

function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim() || 'maptech-report';
  const safe = trimmed.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_');
  return safe.toLowerCase().endsWith('.pdf') ? safe : `${safe}.pdf`;
}

/**
 * Generate and automatically download a PDF file from branded report HTML.
 * Keeps the existing function name for backward compatibility across pages.
 */
export async function openPrintWindow(html: string, fileName = 'maptech-report.pdf'): Promise<void> {
  const safeFileName = sanitizeFileName(fileName);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.visibility = 'hidden';
  iframe.style.right = '-10000px';
  iframe.style.bottom = '-10000px';
  iframe.style.width = '794px';
  iframe.style.height = '1123px';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  const exportTask = async () => {
    const frameDoc = iframe.contentDocument;
    if (!frameDoc) throw new Error('Unable to initialize PDF document frame.');

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    await new Promise<void>((resolve) => {
      if (frameDoc.readyState === 'complete') {
        resolve();
        return;
      }
      iframe.onload = () => resolve();
      setTimeout(resolve, 400);
    });

    try {
      await frameDoc.fonts.ready;
    } catch {
      // continue even if fonts API is unavailable
    }

    const attachmentCards = Array.from(frameDoc.querySelectorAll<HTMLElement>('.report-attachment'));
    for (const card of attachmentCards) {
      const img = card.querySelector('img') as HTMLImageElement | null;
      if (!img) continue;

      if (!img.complete) {
        await new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });
      }

      if (img.naturalHeight > img.naturalWidth) {
        card.classList.add('portrait');
      }
    }

    const body = frameDoc.body;

    // Capture header and footer separately so they can be pinned to every
    // PDF page. The header is composed of `.header-banner` + `.sub-header`.
    const headerBanner = frameDoc.querySelector<HTMLElement>('.header-banner');
    const subHeader = frameDoc.querySelector<HTMLElement>('.sub-header');
    let headerCanvas: HTMLCanvasElement | null = null;
    if (headerBanner || subHeader) {
      const headerWrapper = frameDoc.createElement('div');
      headerWrapper.style.width = '100%';
      headerWrapper.style.boxSizing = 'border-box';
      if (headerBanner) headerWrapper.appendChild(headerBanner.cloneNode(true));
      if (subHeader) headerWrapper.appendChild(subHeader.cloneNode(true));
      // place the wrapper at the top so CSS applies correctly
      frameDoc.body.insertBefore(headerWrapper, frameDoc.body.firstChild);
      headerCanvas = await html2canvas(headerWrapper as HTMLElement, {
        useCORS: true,
        backgroundColor: null,
        scale: 2,
        windowWidth: 794,
      });
      // remove the temporary wrapper
      headerWrapper.remove();
      // hide the original header elements so the main body capture does not
      // include them (we will draw the header separately on each page).
      if (headerBanner) headerBanner.style.display = 'none';
      if (subHeader) subHeader.style.display = 'none';
    }

    // Move footer from fixed positioning into normal document flow so we can
    // measure the true full-document height and capture it separately.
    const footerEl = frameDoc.querySelector<HTMLElement>('.footer-wrap');
    if (footerEl) {
      footerEl.style.position = 'static';
      footerEl.style.width = '100%';
    }

    // Reflow + expand iframe height.
    await new Promise<void>((r) => setTimeout(r, 80));
    iframe.style.height = `${body.scrollHeight}px`;
    await new Promise<void>((r) => setTimeout(r, 80));

    // Capture footer as its own canvas, then hide it from the body capture.
    let footerCanvas: HTMLCanvasElement | null = null;
    if (footerEl) {
      footerCanvas = await html2canvas(footerEl, {
        useCORS: true,
        backgroundColor: null,   // let the element's own CSS supply the background
        scale: 2,
        windowWidth: 794,
      });
      footerEl.style.display = 'none';
    }

    // Allow layout to recalculate without the footer.
    await new Promise<void>((r) => setTimeout(r, 30));
    const contentScrollH = body.scrollHeight;

    // Capture body content (footer already hidden).
    const contentCanvas = await html2canvas(body, {
      useCORS: true,
      backgroundColor: '#ffffff',
      scale: 2,
      windowWidth: 794,
      windowHeight: contentScrollH,
    });

    // PDF setup.
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();   // 595.28 pt
    const pageH = pdf.internal.pageSize.getHeight();  // 841.89 pt

    // pt per canvas-pixel conversion (content canvas is 794×scale wide → pageW pt wide).
    const ptPerPx = pageW / contentCanvas.width;

    // Footer height in PDF points.
    let footerH_pt = 0;
    let footerImgData = '';
    if (footerCanvas && footerCanvas.width > 0) {
      footerImgData = footerCanvas.toDataURL('image/png');
      footerH_pt = footerCanvas.height * ptPerPx;
    }

    // Header height in PDF points.
    let headerH_pt = 0;
    let headerImgData = '';
    if (headerCanvas && headerCanvas.width > 0) {
      headerImgData = headerCanvas.toDataURL('image/png');
      headerH_pt = headerCanvas.height * ptPerPx;
    }

    // Usable content height per page (between header and footer).
    const contentAreaH_pt = pageH - headerH_pt - footerH_pt;
    // Equivalent in canvas pixels — use Math.floor to guarantee no overrun.
    const maxSliceH_px = Math.floor(contentAreaH_pt / ptPerPx);

    // Collect every table-row's bottom edge (in canvas pixels) so we can find
    // page-break positions that fall between rows rather than through them.
    function rowBottomPx(row: HTMLElement): number {
      let top = 0;
      let el: HTMLElement | null = row;
      while (el && el !== body) {
        top += el.offsetTop;
        el = el.offsetParent as HTMLElement | null;
      }
      // ×2 because html2canvas was captured at scale 2.
      return Math.round((top + row.offsetHeight) * 2);
    }

    const rowEnds = Array.from(frameDoc.querySelectorAll<HTMLElement>('tr'))
      .map(rowBottomPx)
      .filter((y) => y > 0)
      .sort((a, b) => a - b);

    // Also collect attachment element top/bottom positions so we can avoid
    // slicing pages through images that would be cut in half.
    function elTopBottomPx(el: HTMLElement): { top: number; bottom: number } {
      let top = 0;
      let node: HTMLElement | null = el;
      while (node && node !== body) {
        top += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return { top: Math.round(top * 2), bottom: Math.round((top + el.offsetHeight) * 2) };
    }

    const attachmentBounds = Array.from(frameDoc.querySelectorAll<HTMLElement>('.report-attachment'))
      .map((el) => elTopBottomPx(el))
      .filter((b) => b.bottom > 0)
      .sort((a, b) => a.top - b.top);

    // Determine each page's start position in canvas pixels, snapping breaks
    // to the nearest row boundary so rows are never split mid-height.
    const sliceStarts: number[] = [];
    let cursor = 0;

    while (cursor < contentCanvas.height) {
      sliceStarts.push(cursor);
      const rawEnd = cursor + maxSliceH_px;
      if (rawEnd >= contentCanvas.height) break;

      // Best break = last row that ends at or before the raw cut point.
      const snapped = [...rowEnds].filter((y) => y > cursor && y <= rawEnd).pop();

      // If our chosen cut would slice through an attachment image, move the
      // break earlier so the attachment starts on the next page.
      const wouldCutAttachment = attachmentBounds.find((b) => b.top > cursor && b.top <= rawEnd && b.bottom > rawEnd);
      if (wouldCutAttachment) {
        // Break before the attachment top (so it will appear on next page).
        cursor = wouldCutAttachment.top;
      } else {
        cursor = snapped ?? rawEnd;
      }
    }

    // Render each page.
    for (let i = 0; i < sliceStarts.length; i++) {
      const top = sliceStarts[i];
      const bot =
        i + 1 < sliceStarts.length ? sliceStarts[i + 1] : contentCanvas.height;
      const sliceH_px = Math.max(1, Math.round(bot - top)); // Ensure at least 1px height
      const sliceH_pt = sliceH_px * ptPerPx; // always ≤ contentAreaH_pt

      if (i > 0) pdf.addPage();

      // Crop exactly this page's content slice from the full content canvas.
      const slice = document.createElement('canvas');
      slice.width = Math.max(1, Math.round(contentCanvas.width));
      slice.height = sliceH_px;
      const ctx = slice.getContext('2d');
      if (ctx) {
        const validTop = Math.max(0, Math.round(top));
        const validSliceH = Math.min(sliceH_px, Math.round(contentCanvas.height - validTop));
        if (validSliceH > 0) {
          ctx.drawImage(
            contentCanvas,
            0, validTop, Math.round(contentCanvas.width), validSliceH,
            0, 0,   Math.round(contentCanvas.width), validSliceH,
          );
        }
      }

      // Place header at the top of the page (if available).
      if (headerImgData && headerH_pt > 0) {
        pdf.addImage(headerImgData, 'PNG', 0, 0, pageW, headerH_pt);
      }

      // Place the content slice below the header.
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, headerH_pt, pageW, sliceH_pt);

      // Pin footer flush to the bottom of every page.
      if (footerImgData && footerH_pt > 0) {
        pdf.addImage(footerImgData, 'PNG', 0, pageH - footerH_pt, pageW, footerH_pt);
      }
    }

    pdf.save(safeFileName);
  };

  try {
    await exportTask();
  } finally {
    cleanup();
  }
}
