import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function generateSamplePackage() {
  const reqJson = JSON.parse(fs.readFileSync('sample-pack/requirements.json', 'utf8'));
  const tender = reqJson.tender;
  const requirements = reqJson.requirements;

  // Resolved matches:
  // R01: trade_license_2026.pdf (expiry: 2027-06-30)
  // R02: 03_tin_certificate.pdf
  // R03: 04_vat_certificate.pdf
  // R04: bank_solvency.pdf (expiry: 2026-12-31)
  // R05: experience_cert.pdf
  // R08: 02_technical_proposal.pdf
  // R09: 01_financial_proposal.pdf
  // R10: scan_0042.pdf

  const matches = {
    'R01': { file: 'sample-pack/documents/trade_license_2026.pdf', expiry: '2027-06-30' },
    'R02': { file: 'sample-pack/documents/03_tin_certificate.pdf', expiry: null },
    'R03': { file: 'sample-pack/documents/04_vat_certificate.pdf', expiry: null },
    'R04': { file: 'sample-pack/documents/bank_solvency.pdf', expiry: '2026-12-31' },
    'R05': { file: 'sample-pack/documents/experience_cert.pdf', expiry: null },
    'R08': { file: 'sample-pack/documents/02_technical_proposal.pdf', expiry: null },
    'R09': { file: 'sample-pack/documents/01_financial_proposal.pdf', expiry: null },
    'R10': { file: 'sample-pack/documents/scan_0042.pdf', expiry: null }
  };

  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);
  const includedDocs = [];

  for (const req of sortedReqs) {
    if (matches[req.id]) {
      const match = matches[req.id];
      const buf = fs.readFileSync(match.file);
      const doc = await PDFDocument.load(buf);
      includedDocs.push({
        req,
        buf,
        fileName: path.basename(match.file),
        pageCount: doc.getPageCount(),
        expiry: match.expiry
      });
    }
  }

  const mergedPdf = await PDFDocument.create();
  const fontHelvetica = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;

  // Page 1 is Cover Page, Page 2 is Index Page
  let currentPage = 3;
  for (const d of includedDocs) {
    d.startPage = currentPage;
    d.endPage = currentPage + d.pageCount - 1;
    currentPage += d.pageCount;
  }
  const totalPages = currentPage - 1;

  // 1. COVER PAGE (Page 1)
  const coverPage = mergedPdf.addPage([pageWidth, pageHeight]);

  coverPage.drawRectangle({
    x: 0,
    y: pageHeight - 140,
    width: pageWidth,
    height: 140,
    color: rgb(0.08, 0.14, 0.28)
  });

  coverPage.drawRectangle({
    x: 0,
    y: pageHeight - 144,
    width: pageWidth,
    height: 4,
    color: rgb(0.85, 0.65, 0.13)
  });

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

  coverPage.drawRectangle({
    x: 48,
    y: metaBoxY,
    width: 6,
    height: 150,
    color: rgb(0.19, 0.38, 0.85)
  });

  const drawRow = (lbl, val, y, isBold = false) => {
    coverPage.drawText(lbl, { x: 68, y, size: 10, font: fontHelveticaBold, color: rgb(0.28, 0.33, 0.42) });
    coverPage.drawText(val, { x: 210, y, size: 10.5, font: isBold ? fontHelveticaBold : fontHelvetica, color: rgb(0.06, 0.09, 0.16) });
  };

  drawRow('Tender ID:', tender.tender_id, pageHeight - 185, true);
  drawRow('Tender Title:', tender.title, pageHeight - 210, true);
  drawRow('Procuring Entity:', tender.procuring_entity, pageHeight - 235);
  drawRow('Bidder Name:', tender.bidder, pageHeight - 260, true);
  drawRow('Submission Deadline:', tender.submission_deadline, pageHeight - 285);
  drawRow('Date Package Generated:', 'October 6, 2026', pageHeight - 305);

  coverPage.drawText('LIST OF INCLUDED DOCUMENTS (IN TENDER ORDER)', {
    x: 50,
    y: metaBoxY - 30,
    size: 11,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.18, 0.3)
  });

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

  let rowY = tableHeaderY - 26;
  const rowHeight = 22;

  includedDocs.forEach((doc, idx) => {
    if (idx % 2 === 0) {
      coverPage.drawRectangle({
        x: 48,
        y: rowY - 4,
        width: pageWidth - 96,
        height: rowHeight,
        color: rgb(0.97, 0.98, 0.99)
      });
    }

    coverPage.drawLine({
      start: { x: 48, y: rowY - 4 },
      end: { x: pageWidth - 48, y: rowY - 4 },
      thickness: 0.5,
      color: rgb(0.88, 0.9, 0.93)
    });

    coverPage.drawText(`${doc.req.order}`, { x: 62, y: rowY + 3, size: 9, font: fontHelveticaBold, color: rgb(0.2, 0.25, 0.35) });
    coverPage.drawText(doc.req.title_en.slice(0, 36), { x: 105, y: rowY + 3, size: 9, font: fontHelvetica, color: rgb(0.1, 0.12, 0.18) });
    coverPage.drawText(doc.expiry || '—', { x: 330, y: rowY + 3, size: 8.5, font: fontHelvetica, color: rgb(0.3, 0.35, 0.45) });
    coverPage.drawText(`${doc.pageCount} pg`, { x: 430, y: rowY + 3, size: 8.5, font: fontHelvetica, color: rgb(0.3, 0.35, 0.45) });
    coverPage.drawText('VERIFIED OK', { x: 490, y: rowY + 3, size: 8, font: fontHelveticaBold, color: rgb(0.06, 0.55, 0.3) });

    rowY -= rowHeight;
  });

  // 2. INDEX PAGE (Page 2)
  const indexPage = mergedPdf.addPage([pageWidth, pageHeight]);

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

  const idxHeaderY = pageHeight - 130;
  indexPage.drawRectangle({
    x: 48,
    y: idxHeaderY - 5,
    width: pageWidth - 96,
    height: 24,
    color: rgb(0.12, 0.18, 0.3)
  });

  indexPage.drawText('ORDER', { x: 56, y: idxHeaderY + 3, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  indexPage.drawText('DOCUMENT NAME', { x: 105, y: idxHeaderY + 3, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  indexPage.drawText('FILE ATTACHED', { x: 285, y: idxHeaderY + 3, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  indexPage.drawText('PAGE RANGE', { x: 420, y: idxHeaderY + 3, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  indexPage.drawText('START PAGE', { x: 500, y: idxHeaderY + 3, size: 8.5, font: fontHelveticaBold, color: rgb(1, 1, 1) });

  let idxRowY = idxHeaderY - 28;
  const idxRowHeight = 26;

  // Cover Page entry
  indexPage.drawText('—', { x: 62, y: idxRowY + 5, size: 9, font: fontHelveticaBold, color: rgb(0.3, 0.35, 0.45) });
  indexPage.drawText('Tender Cover Dossier', { x: 105, y: idxRowY + 5, size: 9, font: fontHelveticaBold, color: rgb(0.1, 0.15, 0.25) });
  indexPage.drawText('Cover Page', { x: 285, y: idxRowY + 5, size: 8.5, font: fontHelvetica, color: rgb(0.4, 0.45, 0.55) });
  indexPage.drawText('Page 1', { x: 425, y: idxRowY + 5, size: 9, font: fontHelvetica, color: rgb(0.2, 0.25, 0.35) });
  indexPage.drawText('1', { x: 520, y: idxRowY + 5, size: 9.5, font: fontHelveticaBold, color: rgb(0.12, 0.18, 0.3) });

  idxRowY -= idxRowHeight;

  // Index Page entry
  indexPage.drawText('—', { x: 62, y: idxRowY + 5, size: 9, font: fontHelveticaBold, color: rgb(0.3, 0.35, 0.45) });
  indexPage.drawText('Document Index & Pagination', { x: 105, y: idxRowY + 5, size: 9, font: fontHelveticaBold, color: rgb(0.1, 0.15, 0.25) });
  indexPage.drawText('Table of Contents', { x: 285, y: idxRowY + 5, size: 8.5, font: fontHelvetica, color: rgb(0.4, 0.45, 0.55) });
  indexPage.drawText('Page 2', { x: 425, y: idxRowY + 5, size: 9, font: fontHelvetica, color: rgb(0.2, 0.25, 0.35) });
  indexPage.drawText('2', { x: 520, y: idxRowY + 5, size: 9.5, font: fontHelveticaBold, color: rgb(0.12, 0.18, 0.3) });

  idxRowY -= idxRowHeight;

  // Documents
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
    indexPage.drawText(doc.req.title_en.slice(0, 30), { x: 105, y: idxRowY + 5, size: 9, font: fontHelveticaBold, color: rgb(0.1, 0.15, 0.25) });
    indexPage.drawText(doc.fileName.slice(0, 24), { x: 285, y: idxRowY + 5, size: 8, font: fontHelvetica, color: rgb(0.4, 0.45, 0.55) });

    const pRange = doc.pageCount === 1 ? `Page ${doc.startPage}` : `Page ${doc.startPage} - ${doc.endPage}`;
    indexPage.drawText(pRange, { x: 420, y: idxRowY + 5, size: 8.5, font: fontHelvetica, color: rgb(0.2, 0.25, 0.35) });
    indexPage.drawText(`${doc.startPage}`, { x: 520, y: idxRowY + 5, size: 9.5, font: fontHelveticaBold, color: rgb(0.12, 0.35, 0.75) });

    idxRowY -= idxRowHeight;
  });

  // 3. COPY PAGES OF EACH INCLUDED DOCUMENT
  for (const doc of includedDocs) {
    const srcDoc = await PDFDocument.load(doc.buf);
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  // 4. ADD FOOTER ON EVERY PAGE (Section 6.3 & 6.4)
  const allPages = mergedPdf.getPages();
  const actualTotal = allPages.length;

  for (let i = 0; i < actualTotal; i++) {
    const page = allPages[i];
    const { width: pWidth, height: pHeight } = page.getSize();
    const pageNum = i + 1;
    const footerText = `${tender.tender_id}  |  Page ${pageNum} of ${actualTotal}`;

    const footerBarHeight = 22;
    const footerY = 8;
    const footerX = 30;
    const footerWidth = pWidth - 60;

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

    page.drawText(footerText, {
      x: footerX + 14,
      y: footerY + 6.5,
      size: 8.5,
      font: fontHelveticaBold,
      color: rgb(0.18, 0.22, 0.3)
    });

    page.drawText('OFFICIAL TENDER DOSSIER', {
      x: footerX + footerWidth - 140,
      y: footerY + 6.5,
      size: 7.5,
      font: fontHelvetica,
      color: rgb(0.45, 0.5, 0.58)
    });
  }

  const outBytes = await mergedPdf.save();
  const outputPath = `output/${tender.tender_id}_Package.pdf`;
  fs.writeFileSync(outputPath, outBytes);
  console.log(`Generated package: ${outputPath} (${outBytes.length} bytes, ${actualTotal} pages)`);
}

generateSamplePackage().catch(console.error);
