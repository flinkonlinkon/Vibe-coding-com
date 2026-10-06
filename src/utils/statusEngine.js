/**
 * Evaluates the compliance status for a single requirement document according to Section 5
 * 
 * Statuses:
 * - 'Missing' (Blocks: Yes)
 * - 'Expiry date needed' (Blocks: Yes)
 * - 'Expired' (Blocks: Yes)
 * - 'Not provided' (Blocks: No)
 * - 'OK' (Blocks: No)
 */
export function evaluateRequirementStatus({
  requirement,
  matchedFile,
  expiryDate,
  submissionDeadline
}) {
  // Case 1: No file matched
  if (!matchedFile) {
    if (requirement.mandatory) {
      return {
        status: 'Missing',
        blocks: true,
        badgeClass: 'status-missing',
        reasonEn: 'Mandatory document has no matched PDF file',
        reasonBn: 'বাধ্যতামূলক নথিতে কোনো পিডিএফ ফাইল সংযুক্ত নেই'
      };
    } else {
      return {
        status: 'Not provided',
        blocks: false,
        badgeClass: 'status-not-provided',
        reasonEn: 'Optional document not provided (allowed)',
        reasonBn: 'ঐচ্ছিক নথি সংযুক্ত করা হয়নি (অনুমোদিত)'
      };
    }
  }

  // Case 2: File is matched, check if expiry is required
  if (requirement.has_expiry) {
    if (!expiryDate || String(expiryDate).trim() === '') {
      return {
        status: 'Expiry date needed',
        blocks: true,
        badgeClass: 'status-expiry-needed',
        reasonEn: 'Document requires an expiry date to be entered',
        reasonBn: 'এই নথির জন্য মেয়াদের তারিখ প্রদান আবশ্যক'
      };
    }

    // Compare expiry date with submission deadline (YYYY-MM-DD format)
    // Rule: "If a document expires on the same day as the submission deadline, it is still OK."
    const cleanExpiry = String(expiryDate).trim();
    const cleanDeadline = String(submissionDeadline).trim();

    if (cleanExpiry < cleanDeadline) {
      return {
        status: 'Expired',
        blocks: true,
        badgeClass: 'status-expired',
        reasonEn: `Expired on ${cleanExpiry} (Submission deadline: ${cleanDeadline})`,
        reasonBn: `মেয়াদ ${cleanExpiry}-এ শেষ হয়েছে (দরপত্র জমার তারিখ: ${cleanDeadline})`
      };
    } else {
      return {
        status: 'OK',
        blocks: false,
        badgeClass: 'status-ok',
        reasonEn: `Valid through ${cleanExpiry} (Submission deadline: ${cleanDeadline})`,
        reasonBn: `বৈধ রয়েছে ${cleanExpiry} পর্যন্ত (জমার তারিখ: ${cleanDeadline})`
      };
    }
  }

  // Case 3: File is matched and no expiry required
  return {
    status: 'OK',
    blocks: false,
    badgeClass: 'status-ok',
    reasonEn: 'Document matched and verified',
    reasonBn: 'নথি সংযুক্ত এবং যাচাইকৃত'
  };
}

/**
 * Evaluates the entire package compliance and returns summary of blockers
 */
export function evaluatePackageCompliance({
  requirements,
  matchedFilesMap,
  expiryDatesMap,
  submissionDeadline
}) {
  const statusMap = {};
  const blockers = [];
  let validCount = 0;

  for (const req of requirements) {
    const matched = matchedFilesMap[req.id];
    const expiry = expiryDatesMap[req.id];
    const evalResult = evaluateRequirementStatus({
      requirement: req,
      matchedFile: matched,
      expiryDate: expiry,
      submissionDeadline
    });

    statusMap[req.id] = evalResult;

    if (evalResult.blocks) {
      blockers.push({
        reqId: req.id,
        order: req.order,
        titleEn: req.title_en,
        titleBn: req.title_bn,
        status: evalResult.status,
        reasonEn: evalResult.reasonEn,
        reasonBn: evalResult.reasonBn
      });
    } else {
      validCount++;
    }
  }

  return {
    statusMap,
    blockers,
    isReady: blockers.length === 0,
    validCount,
    totalCount: requirements.length,
    blockerCount: blockers.length
  };
}
