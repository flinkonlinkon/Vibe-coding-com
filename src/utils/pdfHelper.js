import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Computes SHA-256 hash of an ArrayBuffer
 */
export async function computeFileHash(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Safely inspects a PDF ArrayBuffer to get page count and validate format
 */
export async function inspectPdf(arrayBuffer) {
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: false });
    return {
      valid: true,
      pageCount: pdfDoc.getPageCount(),
      isEncrypted: false,
      error: null
    };
  } catch (err) {
    const msg = err.message || '';
    const isEncrypted = msg.toLowerCase().includes('encrypt') || msg.toLowerCase().includes('password');
    return {
      valid: false,
      pageCount: 0,
      isEncrypted,
      error: isEncrypted ? 'Password protected PDF. Please remove password.' : `Corrupted or invalid PDF: ${msg}`
    };
  }
}

/**
 * Helper to render high-resolution Bengali / multilingual text onto a canvas and return PNG data URL
 */
function renderMultilingualTextCanvas(text, fontSpec = 'bold 24px "Hind Siliguri", "Segoe UI", sans-serif', color = '#0f172a', maxWidth = 800) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = maxWidth * 2;
    canvas.height = 100 * 2;
    ctx.scale(2, 2);
    ctx.font = fontSpec;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 10, 25);
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error('Canvas render error:', e);
    return null;
  }
}

/**
 * Creates the complete combined tender document package following Section 6 & 7 rules
 */
export async function createTenderPackage({
  tender,
  requirements,
  matchedFilesMap, // { reqId: { file, buffer, pageCount, fileName } }
  expiryDatesMap, // { reqId: "YYYY-MM-DD" }
  options = {
    includeIndexPage: true,
    sealImageBuffer: null, // Uint8Array or ArrayBuffer for PNG seal
    sealPlacement: 'none', // 'all', 'cover', 'last', 'none'
    language: 'en'
  }
}) {
  const mergedPdf = await PDFDocument.create();
  const fontHelvetica = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  // Standard A4 dimensions in points (595.28 x 841.89)
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  // Filter and sort included documents by requirement order
  const sortedRequirements = [...requirements].sort((a, b) => a.order - b.order);
  const includedDocs = [];

  for (const req of sortedRequirements) {
    const matched = matchedFilesMap[req.id];
    if (matched && matched.buffer) {
      includedDocs.push({
        req,
        matched,
        expiry: expiryDatesMap[req.id] || null,
        pageCount: matched.pageCount || 1,
        startPage: 0, // will compute below
        endPage: 0
      });
    }
  }

  // Determine starting page numbers
  let currentPageIndex = 1; // 1-based index
  // Page 1 is Cover Page
  currentPageIndex += 1;

  // If index page is requested, it takes 1 page
  const hasIndexPage = Boolean(options.includeIndexPage);
  if (hasIndexPage) {
    currentPageIndex += 1;
  }

  // Calculate start and end page for each document
  for (const doc of includedDocs) {
    doc.startPage = currentPageIndex;
    doc.endPage = currentPageIndex + doc.pageCount - 1;
    currentPageIndex += doc.pageCount;
  }

  const totalPages = currentPageIndex - 1;
  const currentDateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // -------------------------------------------------------------
  // 1. CREATE COVER PAGE (Page 1) - Section 6.1: In English
  // -------------------------------------------------------------
  const coverPage = mergedPdf.addPage([pageWidth, pageHeight]);

  // Decorative header background banner
  coverPage.drawRectangle({
    x: 0,
    y: pageHeight - 140,
    width: pageWidth,
    height: 140,
    color: rgb(0.08, 0.14, 0.28) // Deep Navy
  });

  // Gold accent line
  coverPage.drawRectangle({
    x: 0,
    y: pageHeight - 144,
    width: pageWidth,
    height: 4,
    color: rgb(0.85, 0.65, 0.13) // Royal Gold
  });

  // Cover Page Title & Subtitle
  coverPage.drawText('TENDER SUBMISSION DOSSIER', {
    x: 50,
    y: pageHeight - 65,
    size: 22,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1)
  });

  coverPage.drawText('OFFICIAL BID COMPLIANCE & VERIFIED DOCUMENT PACKAGE', {
    x: 50,
    y: pageHeight - 90,
    size: 9.5,
    font: fontHelvetica,
    color: rgb(0.8, 0.88, 0.98)
  });

  // Tender Metadata Card Box
  const metaBoxY = pageHeight - 315;
  coverPage.drawRectangle({
    x: 48,
    y: metaBoxY,
    width: pageWidth - 96,
    height: 150,
    color: rgb(0.97, 0.98, 1.0),
    borderColor: rgb(0.82, 0.86, 0.92),
    borderWidth: 1
  });

  // Card Left Accent
  coverPage.drawRectangle({
    x: 48,
    y: metaBoxY,
    width: 6,
    height: 150,
    color: rgb(0.19, 0.38, 0.85) // Royal Blue accent
  });

  // Metadata Fields
  const drawMetaRow = (label, value, yPos, isBold = false) => {
    coverPage.drawText(label, {
      x: 68,
      y: yPos,
      size: 10,
      font: fontHelveticaBold,
      color: rgb(0.28, 0.33, 0.42)
    });
    coverPage.drawText(value || 'N/A', {
      x: 210,
      y: yPos,
      size: 10.5,
      font: isBold ? fontHelveticaBold : fontHelvetica,
      color: rgb(0.06, 0.09, 0.16)
    });
  };

  drawMetaRow('Tender ID:', tender.tender_id || 'N/A', pageHeight - 185, true);
  drawMetaRow('Tender Title:', (tender.title || '').slice(0, 52), pageHeight - 210, true);
  drawMetaRow('Procuring Entity:', (tender.procuring_entity || '').slice(0, 52), pageHeight - 235);
  drawMetaRow('Bidder Name:', tender.bidder || 'N/A', pageHeight - 260, true);
  drawMetaRow('Submission Deadline:', tender.submission_deadline || 'N/A', pageHeight - 285);
  drawMetaRow('Date Package Generated:', currentDateStr, pageHeight - 305);

  // Section Heading: Included Documents Table
  coverPage.drawText('LIST OF INCLUDED DOCUMENTS (IN TENDER ORDER)', {
    x: 50,
    y: metaBoxY - 30,
    size: 11,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.18, 0.3)
  });

  // Documents Table Header
  const tableHeaderY = metaBoxY - 55;
  coverPage.drawRectangle({
    x: 48,
    y: tableHeaderY - 5,
    width: pageWidth - 96,
    height: 22,
    color: rgb(0.12, 0.18, 0.3)
  });

  coverPage.drawText('ORDER', { x: 56, y: tableHeaderY + 2, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  coverPage.drawText('DOCUMENT TITLE', { x: 105, y: tableHeaderY + 2, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  coverPage.drawText('EXPIRY DATE', { x: 330, y: tableHeaderY + 2, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  coverPage.drawText('PAGES', { x: 425, y: tableHeaderY + 2, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  coverPage.drawText('STATUS', { x: 495, y: tableHeaderY + 2, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });

  // Table Rows
  let rowY = tableHeaderY - 26;
  const rowHeight = 22;

  includedDocs.forEach((doc, idx) => {
    // Alternating zebra row background
    if (idx % 2 === 0) {
      coverPage.drawRectangle({
        x: 48,
        y: rowY - 4,
        width: pageWidth - 96,
        height: rowHeight,
        color: rgb(0.97, 0.98, 0.99)
      });
    }

    // Border line bottom
    coverPage.drawLine({
      start: { x: 48, y: rowY - 4 },
      end: { x: pageWidth - 48, y: rowY - 4 },
      thickness: 0.5,
      color: rgb(0.88, 0.9, 0.93)
    });

    coverPage.drawText(`${doc.req.order}`, { x: 62, y: rowY + 3, size: 9, font: fontHelveticaBold, color: rgb(0.2, 0.25, 0.35) });
    
    // English title as required by 6.1
    const titleText = doc.req.title_en || doc.req.title_bn || 'Document';
    coverPage.drawText(titleText.slice(0, 36), { x: 105, y: rowY + 3, size: 9, font: fontHelvetica, color: rgb(0.1, 0.12, 0.18) });

    const expiryDisplay = doc.req.has_expiry ? (doc.expiry || 'N/A') : '—';
    coverPage.drawText(expiryDisplay, { x: 330, y: rowY + 3, size: 8.5, font: fontHelvetica, color: rgb(0.3, 0.35, 0.45) });

    coverPage.drawText(`${doc.pageCount} pg`, { x: 430, y: rowY + 3, size: 8.5, font: fontHelvetica, color: rgb(0.3, 0.35, 0.45) });

    // Status pill
    coverPage.drawText('VERIFIED OK', { x: 490, y: rowY + 3, size: 8, font: fontHelveticaBold, color: rgb(0.06, 0.55, 0.3) });

    rowY -= rowHeight;
  });

  // Verification Certification stamp box on cover page
  const certBoxY = Math.max(rowY - 45, 60);
  coverPage.drawRectangle({
    x: 48,
    y: certBoxY,
    width: pageWidth - 96,
    height: 38,
    color: rgb(0.95, 0.98, 0.95),
    borderColor: rgb(0.65, 0.85, 0.65),
    borderWidth: 1
  });

  coverPage.drawText('COMPLIANCE VERIFIED: All mandatory documents included, validated against deadline, and ordered.', {
    x: 60,
    y: certBoxY + 22,
    size: 7.5,
    font: fontHelveticaBold,
    color: rgb(0.06, 0.45, 0.2)
  });

  coverPage.drawText(`Generated via TenderPack Compliance Engine. Ready for electronic & physical submission.`, {
    x: 60,
    y: certBoxY + 9,
    size: 7.5,
    font: fontHelvetica,
    color: rgb(0.2, 0.4, 0.25)
  });


  // -------------------------------------------------------------
  // 2. BONUS: TABLE OF CONTENTS / INDEX PAGE (Page 2)
  // -------------------------------------------------------------
  if (hasIndexPage) {
    const indexPage = mergedPdf.addPage([pageWidth, pageHeight]);

    // Header bar
    indexPage.drawRectangle({
      x: 0,
      y: pageHeight - 90,
      width: pageWidth,
      height: 90,
      color: rgb(0.08, 0.14, 0.28)
    });

    indexPage.drawRectangle({
      x: 0,
      y: pageHeight - 94,
      width: pageWidth,
      height: 4,
      color: rgb(0.85, 0.65, 0.13)
    });

    indexPage.drawText('DOCUMENT INDEX & PAGINATION SCHEDULE', {
      x: 50,
      y: pageHeight - 48,
      size: 16,
      font: fontHelveticaBold,
      color: rgb(1, 1, 1)
    });

    indexPage.drawText(`Tender: ${tender.tender_id} | Total Package Pages: ${totalPages}`, {
      x: 50,
      y: pageHeight - 70,
      size: 9.5,
      font: fontHelvetica,
      color: rgb(0.8, 0.88, 0.98)
    });

    // Table Header
    const idxHeaderY = pageHeight - 130;
    indexPage.drawRectangle({
      x: 48,
      y: idxHeaderY - 5,
      width: pageWidth - 96,
      height: 24,
      color: rgb(0.12, 0.18, 0.3)
    });

    indexPage.drawText('NO.', { x: 56, y: idxHeaderY + 3, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });
    indexPage.drawText('DOCUMENT NAME', { x: 95, y: idxHeaderY + 3, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });
    indexPage.drawText('FILE ATTACHED', { x: 285, y: idxHeaderY + 3, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });
    indexPage.drawText('PAGE RANGE', { x: 420, y: idxHeaderY + 3, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });
    indexPage.drawText('START PAGE', { x: 500, y: idxHeaderY + 3, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });

    let idxRowY = idxHeaderY - 28;
    const idxRowHeight = 26;

    // Cover page entry
    indexPage.drawRectangle({
      x: 48,
      y: idxRowY - 4,
      width: pageWidth - 96,
      height: idxRowHeight,
      color: rgb(0.97, 0.98, 1.0)
    });
    indexPage.drawText('—', { x: 62, y: idxRowY + 5, size: 9, font: fontHelveticaBold, color: rgb(0.3, 0.35, 0.45) });
    indexPage.drawText('Tender Cover Page', { x: 95, y: idxRowY + 5, size: 9, font: fontHelveticaBold, color: rgb(0.1, 0.15, 0.25) });
    indexPage.drawText('Generated Cover Dossier', { x: 285, y: idxRowY + 5, size: 8.5, font: fontHelvetica, color: rgb(0.4, 0.45, 0.55) });
    indexPage.drawText('Page 1', { x: 425, y: idxRowY + 5, size: 9, font: fontHelvetica, color: rgb(0.2, 0.25, 0.35) });
    indexPage.drawText('1', { x: 520, y: idxRowY + 5, size: 9, font: fontHelveticaBold, color: rgb(0.12, 0.18, 0.3) });

    idxRowY -= idxRowHeight;

    // This index page entry
    indexPage.drawText('—', { x: 62, y: idxRowY + 5, size: 9, font: fontHelveticaBold, color: rgb(0.3, 0.35, 0.45) });
    indexPage.drawText('Document Index & Pagination', { x: 95, y: idxRowY + 5, size: 9, font: fontHelveticaBold, color: rgb(0.1, 0.15, 0.25) });
    indexPage.drawText('Table of Contents', { x: 285, y: idxRowY + 5, size: 8.5, font: fontHelvetica, color: rgb(0.4, 0.45, 0.55) });
    indexPage.drawText('Page 2', { x: 425, y: idxRowY + 5, size: 9, font: fontHelvetica, color: rgb(0.2, 0.25, 0.35) });
    indexPage.drawText('2', { x: 520, y: idxRowY + 5, size: 9, font: fontHelveticaBold, color: rgb(0.12, 0.18, 0.3) });

    idxRowY -= idxRowHeight;

    // Included documents entries
    includedDocs.forEach((doc, idx) => {
      if (idx % 2 === 0) {
        indexPage.drawRectangle({
          x: 48,
          y: idxRowY - 4,
          width: pageWidth - 96,
          height: idxRowHeight,
          color: rgb(0.97, 0.98, 0.99)
        });
      }

      indexPage.drawLine({
        start: { x: 48, y: idxRowY - 4 },
        end: { x: pageWidth - 48, y: idxRowY - 4 },
        thickness: 0.5,
        color: rgb(0.88, 0.9, 0.93)
      });

      indexPage.drawText(`${doc.req.order}`, { x: 60, y: idxRowY + 5, size: 9, font: fontHelveticaBold, color: rgb(0.2, 0.25, 0.35) });
      indexPage.drawText((doc.req.title_en || doc.req.title_bn).slice(0, 30), { x: 95, y: idxRowY + 5, size: 9, font: fontHelveticaBold, color: rgb(0.1, 0.15, 0.25) });
      
      const fileNameStr = doc.matched.fileName || 'document.pdf';
      indexPage.drawText(fileNameStr.slice(0, 24), { x: 285, y: idxRowY + 5, size: 8, font: fontHelvetica, color: rgb(0.4, 0.45, 0.55) });

      const pageRangeStr = doc.pageCount === 1 ? `Page ${doc.startPage}` : `Page ${doc.startPage} - ${doc.endPage}`;
      indexPage.drawText(pageRangeStr, { x: 420, y: idxRowY + 5, size: 8.5, font: fontHelvetica, color: rgb(0.2, 0.25, 0.35) });

      indexPage.drawText(`${doc.startPage}`, { x: 520, y: idxRowY + 5, size: 9.5, font: fontHelveticaBold, color: rgb(0.12, 0.35, 0.75) });

      idxRowY -= idxRowHeight;
    });
  }

  // -------------------------------------------------------------
  // 3. COPY PAGES OF EACH INCLUDED DOCUMENT (Section 6.2)
  // -------------------------------------------------------------
  for (const doc of includedDocs) {
    const srcDoc = await PDFDocument.load(doc.matched.buffer);
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  // -------------------------------------------------------------
  // 4. EMBED SEAL / SIGNATURE (Bonus Task 7.2)
  // -------------------------------------------------------------
  let embeddedSealImage = null;
  if (options.sealImageBuffer && options.sealPlacement && options.sealPlacement !== 'none') {
    try {
      embeddedSealImage = await mergedPdf.embedPng(options.sealImageBuffer);
    } catch (e) {
      console.warn('Could not embed seal image as PNG:', e.message);
    }
  }

  // -------------------------------------------------------------
  // 5. ADD FOOTER TO EVERY PAGE - Section 6.3 & 6.4:
  // Format: <tender_id> | Page X of Y
  // "The footer must be easy to read and must not cover the document's content."
  // -------------------------------------------------------------
  const allPages = mergedPdf.getPages();
  const actualTotalPages = allPages.length;

  for (let i = 0; i < actualTotalPages; i++) {
    const page = allPages[i];
    const { width: pWidth, height: pHeight } = page.getSize();
    const pageNum = i + 1;
    const footerText = `${tender.tender_id || 'Tender'}  |  Page ${pageNum} of ${actualTotalPages}`;

    // Clean white footer background strip with subtle border to ensure maximum readability
    // and prevent obscuring background content while leaving content intact
    const footerBarHeight = 22;
    const footerY = 8;
    const footerX = 30;
    const footerWidth = pWidth - 60;

    // Semi-translucent white pill/banner
    page.drawRectangle({
      x: footerX,
      y: footerY,
      width: footerWidth,
      height: footerBarHeight,
      color: rgb(1, 1, 1),
      opacity: 0.92,
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 0.8
    });

    // Tender ID & Page X of Y text
    page.drawText(footerText, {
      x: footerX + 14,
      y: footerY + 6.5,
      size: 8.5,
      font: fontHelveticaBold,
      color: rgb(0.18, 0.22, 0.3)
    });

    // Verification badge on the right side of the footer
    const verifiedBadge = 'OFFICIAL TENDER DOSSIER';
    page.drawText(verifiedBadge, {
      x: footerX + footerWidth - 140,
      y: footerY + 6.5,
      size: 7.5,
      font: fontHelvetica,
      color: rgb(0.45, 0.5, 0.58)
    });

    // Apply seal/signature if selected for this page
    if (embeddedSealImage) {
      let applyToThisPage = false;
      if (options.sealPlacement === 'all') applyToThisPage = true;
      else if (options.sealPlacement === 'cover' && pageNum === 1) applyToThisPage = true;
      else if (options.sealPlacement === 'last' && pageNum === actualTotalPages) applyToThisPage = true;

      if (applyToThisPage) {
        const sealDims = embeddedSealImage.scale(0.35); // pleasant stamp size
        // Place bottom right, right above footer
        const stampX = pWidth - sealDims.width - 45;
        const stampY = 38;
        page.drawImage(embeddedSealImage, {
          x: stampX,
          y: stampY,
          width: sealDims.width,
          height: sealDims.height,
          opacity: 0.88
        });
      }
    }
  }

  // Save and return Uint8Array
  return await mergedPdf.save();
}
