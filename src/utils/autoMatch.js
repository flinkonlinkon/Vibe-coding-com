/**
 * Smart file matching engine based on filename heuristics and requirement titles
 */
export function suggestMatches(requirements, uploadedFiles, duplicateHashMap) {
  // Map of requirement IDs to suggested file IDs
  const suggestions = {};
  const usedFileIds = new Set();

  // Keyword rules for matching
  const rules = [
    {
      match: req => /trade\s*license/i.test(req.title_en) || /ট্রেড/i.test(req.title_bn),
      fileFilter: f => /trade.*license/i.test(f.name),
      // Prefer trade_license_2026 over 2025
      tieBreaker: (a, b) => {
        const yearA = (a.name.match(/20\d\d/) || [0])[0];
        const yearB = (b.name.match(/20\d\d/) || [0])[0];
        return Number(yearB) - Number(yearA);
      }
    },
    {
      match: req => /\btin\b/i.test(req.title_en) || /টিআইএন/i.test(req.title_bn),
      fileFilter: f => /tin/i.test(f.name)
    },
    {
      match: req => /\bvat\b/i.test(req.title_en) || /ভ্যাট/i.test(req.title_bn),
      fileFilter: f => /vat/i.test(f.name)
    },
    {
      match: req => /bank\s*solvency/i.test(req.title_en) || /সচ্ছলতা/i.test(req.title_bn),
      fileFilter: f => /bank.*solvency|solvency/i.test(f.name)
    },
    {
      match: req => /experience/i.test(req.title_en) || /অভিজ্ঞতা/i.test(req.title_bn),
      fileFilter: f => /experience/i.test(f.name)
    },
    {
      match: req => /audited|financial\s*statement/i.test(req.title_en) || /নিরীক্ষিত/i.test(req.title_bn),
      fileFilter: f => /audit|financial.*statement|balance/i.test(f.name)
    },
    {
      match: req => /manufacturer|authorization/i.test(req.title_en) || /প্রস্তুতকারক/i.test(req.title_bn),
      fileFilter: f => /manufacturer|authorization|maf/i.test(f.name)
    },
    {
      match: req => /technical\s*proposal/i.test(req.title_en) || /কারিগরি/i.test(req.title_bn),
      fileFilter: f => /technical.*proposal|tech.*proposal/i.test(f.name)
    },
    {
      match: req => /financial\s*proposal/i.test(req.title_en) || /আর্থিক/i.test(req.title_bn),
      fileFilter: f => /financial.*proposal|price.*schedule/i.test(f.name)
    },
    {
      match: req => /declaration/i.test(req.title_en) || /ঘোষণাপত্র/i.test(req.title_bn),
      fileFilter: f => /declaration|scan_0042|undertaking|affidavit/i.test(f.name)
    }
  ];

  // Eligible files: valid PDFs that are not secondary duplicate copies
  const validFiles = uploadedFiles.filter(f => f.valid && !f.isDuplicateSecondary);

  for (const req of requirements) {
    for (const rule of rules) {
      if (rule.match(req)) {
        let matchingFiles = validFiles.filter(f => !usedFileIds.has(f.id) && rule.fileFilter(f));
        if (rule.tieBreaker && matchingFiles.length > 1) {
          matchingFiles.sort(rule.tieBreaker);
        }
        if (matchingFiles.length > 0) {
          const chosen = matchingFiles[0];
          suggestions[req.id] = chosen.id;
          usedFileIds.add(chosen.id);
          break;
        }
      }
    }
  }

  return suggestions;
}
