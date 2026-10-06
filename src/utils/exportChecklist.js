import * as XLSX from 'xlsx';

/**
 * Generates an array of checklist data rows for export
 */
export function buildChecklistRows(requirements, matchedFilesMap, expiryDatesMap, statusMap, lang = 'en') {
  const sorted = [...requirements].sort((a, b) => a.order - b.order);

  return sorted.map(req => {
    const matched = matchedFilesMap[req.id];
    const expiry = req.has_expiry ? (expiryDatesMap[req.id] || 'Not specified') : 'N/A';
    const status = statusMap[req.id] || 'Missing';

    return {
      'Order': req.order,
      'Requirement ID': req.id,
      'Document Title (EN)': req.title_en,
      'Document Title (BN)': req.title_bn,
      'Type': req.mandatory ? 'Mandatory' : 'Optional',
      'Has Expiry Check': req.has_expiry ? 'Yes' : 'No',
      'Expiry Date': expiry,
      'Matched File': matched ? matched.fileName : 'None',
      'File Pages': matched ? matched.pageCount : 0,
      'Compliance Status': status.status,
      'Blocks Package': status.blocks ? 'YES' : 'NO'
    };
  });
}

/**
 * Exports checklist to Excel (.xlsx)
 */
export function exportToExcel(requirements, matchedFilesMap, expiryDatesMap, statusMap, tender) {
  const rows = buildChecklistRows(requirements, matchedFilesMap, expiryDatesMap, statusMap);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },  // Order
    { wch: 15 }, // Req ID
    { wch: 30 }, // Title EN
    { wch: 30 }, // Title BN
    { wch: 12 }, // Type
    { wch: 16 }, // Expiry Check
    { wch: 15 }, // Expiry Date
    { wch: 30 }, // Matched File
    { wch: 10 }, // Pages
    { wch: 20 }, // Status
    { wch: 15 }  // Blocks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Checklist');

  // Add tender info sheet
  const tenderInfo = [
    { 'Field': 'Tender ID', 'Value': tender.tender_id || '' },
    { 'Field': 'Title', 'Value': tender.title || '' },
    { 'Field': 'Procuring Entity', 'Value': tender.procuring_entity || '' },
    { 'Field': 'Bidder', 'Value': tender.bidder || '' },
    { 'Field': 'Submission Deadline', 'Value': tender.submission_deadline || '' },
    { 'Field': 'Exported At', 'Value': new Date().toISOString() }
  ];
  const infoSheet = XLSX.utils.json_to_sheet(tenderInfo);
  infoSheet['!cols'] = [{ wch: 20 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, infoSheet, 'Tender Info');

  const fileName = `${tender.tender_id || 'Tender'}_Checklist.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Exports checklist to CSV
 */
export function exportToCsv(requirements, matchedFilesMap, expiryDatesMap, statusMap, tender) {
  const rows = buildChecklistRows(requirements, matchedFilesMap, expiryDatesMap, statusMap);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tender.tender_id || 'Tender'}_Checklist.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
