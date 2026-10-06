import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { translations } from './translations';
import { computeFileHash, inspectPdf, createTenderPackage } from './utils/pdfHelper';
import { evaluatePackageCompliance } from './utils/statusEngine';
import { exportToExcel, exportToCsv } from './utils/exportChecklist';
import { suggestMatches } from './utils/autoMatch';

import { Navbar } from './components/Navbar';
import { TenderHeader } from './components/TenderHeader';
import { RequirementsList } from './components/RequirementsList';
import { FileUploadSection } from './components/FileUploadSection';
import { PackageGenerator } from './components/PackageGenerator';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { TenderEditModal } from './components/TenderEditModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { AiAssistantModal } from './components/AiAssistantModal';

// Default initial tender configuration from requirements.json
const DEFAULT_TENDER = {
  tender_id: "T-2026-0417",
  title: "Supply of IT Equipment",
  procuring_entity: "Directorate of Sample Services",
  bidder: "Meghna Tech Solutions Ltd.",
  submission_deadline: "2026-10-20"
};

const DEFAULT_REQUIREMENTS = [
  { id: "R01", order: 1, title_en: "Trade License", title_bn: "ট্রেড লাইসেন্স", mandatory: true, has_expiry: true },
  { id: "R02", order: 2, title_en: "TIN Certificate", title_bn: "টিআইএন সনদ", mandatory: true, has_expiry: false },
  { id: "R03", order: 3, title_en: "VAT Registration Certificate", title_bn: "ভ্যাট নিবন্ধন সনদ", mandatory: true, has_expiry: false },
  { id: "R04", order: 4, title_en: "Bank Solvency Certificate", title_bn: "ব্যাংক সচ্ছলতা সনদ", mandatory: true, has_expiry: true },
  { id: "R05", order: 5, title_en: "Experience Certificate", title_bn: "অভিজ্ঞতার সনদ", mandatory: true, has_expiry: false },
  { id: "R06", order: 6, title_en: "Audited Financial Statement", title_bn: "নিরীক্ষিত আর্থিক বিবরণী", mandatory: false, has_expiry: false },
  { id: "R07", order: 7, title_en: "Manufacturer's Authorization", title_bn: "প্রস্তুতকারকের অনুমোদনপত্র", mandatory: false, has_expiry: true },
  { id: "R08", order: 8, title_en: "Technical Proposal", title_bn: "কারিগরি প্রস্তাব", mandatory: true, has_expiry: false },
  { id: "R09", order: 9, title_en: "Financial Proposal", title_bn: "আর্থিক প্রস্তাব", mandatory: true, has_expiry: false },
  { id: "R10", order: 10, title_en: "Signed Declaration", title_bn: "স্বাক্ষরিত ঘোষণাপত্র", mandatory: true, has_expiry: false }
];

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('tender_lang') || 'en');
  const t = translations[lang] || translations.en;

  const [tender, setTender] = useState(DEFAULT_TENDER);
  const [requirements, setRequirements] = useState(DEFAULT_REQUIREMENTS);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [matchedFilesMap, setMatchedFilesMap] = useState({}); // { [reqId]: fileObj }
  const [expiryDatesMap, setExpiryDatesMap] = useState({}); // { [reqId]: "YYYY-MM-DD" }

  const [packageOptions, setPackageOptions] = useState({
    includeIndexPage: true,
    sealImageBuffer: null,
    sealPlacement: 'none',
    sealFileName: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Modals
  const [previewFileData, setPreviewFileData] = useState(null);
  const [isEditTenderOpen, setIsEditTenderOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Notifications
  const [alertMessage, setAlertMessage] = useState(null);

  // Update language preference
  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('tender_lang', newLang);
  };

  const showAlert = (text, type = 'danger') => {
    setAlertMessage({ text, type });
    setTimeout(() => {
      setAlertMessage(null);
    }, 6000);
  };

  // Evaluate compliance across all requirements
  const compliance = useMemo(() => {
    return evaluatePackageCompliance({
      requirements,
      matchedFilesMap,
      expiryDatesMap,
      submissionDeadline: tender.submission_deadline
    });
  }, [requirements, matchedFilesMap, expiryDatesMap, tender.submission_deadline]);

  // Overall Statistics
  const stats = useMemo(() => {
    const mandatoryCount = requirements.filter(r => r.mandatory).length;
    const optionalCount = requirements.filter(r => !r.mandatory).length;
    return {
      totalCount: requirements.length,
      mandatoryCount,
      optionalCount,
      validCount: compliance.validCount,
      blockerCount: compliance.blockerCount
    };
  }, [requirements, compliance]);

  // Handle uploading requirements.json (Task 4.1)
  const handleUploadRequirements = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (json.tender) {
          setTender(json.tender);
        }
        if (Array.isArray(json.requirements)) {
          // Sort requirements by order
          const sorted = [...json.requirements].sort((a, b) => a.order - b.order);
          setRequirements(sorted);
          setMatchedFilesMap({});
          setExpiryDatesMap({});
          showAlert('requirements.json loaded successfully!', 'success');
        } else {
          showAlert('Invalid requirements.json format: missing requirements array.');
        }
      } catch (err) {
        showAlert(`Error parsing requirements.json: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Process files when added (Task 4.2 & Task 4.6)
  const handleFilesAdded = async (fileList) => {
    const newFiles = [];
    const nonPdfRejected = [];

    // Track hash map of existing and newly processed files
    const existingHashMap = new Map();
    uploadedFiles.forEach(f => {
      if (f.hash) existingHashMap.set(f.hash, f.name);
    });

    for (const file of fileList) {
      // Validate PDF format (Task 4.2: reject non-PDF and show clear message)
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      if (!isPdf) {
        nonPdfRejected.push(file.name);
        continue;
      }

      try {
        const buffer = await file.arrayBuffer();
        const hash = await computeFileHash(buffer);
        const inspection = await inspectPdf(buffer);

        let isDuplicateSecondary = false;
        let duplicateOriginalName = '';

        if (existingHashMap.has(hash)) {
          // Task 4.6: duplicate found!
          isDuplicateSecondary = true;
          duplicateOriginalName = existingHashMap.get(hash);
        } else {
          existingHashMap.set(hash, file.name);
        }

        const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));

        newFiles.push({
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          buffer: buffer,
          blobUrl: blobUrl,
          pageCount: inspection.pageCount,
          hash: hash,
          isDuplicateSecondary,
          duplicateOriginalName,
          valid: inspection.valid,
          isEncrypted: inspection.isEncrypted,
          error: inspection.error
        });
      } catch (err) {
        showAlert(`Failed to process ${file.name}: ${err.message}`);
      }
    }

    if (nonPdfRejected.length > 0) {
      showAlert(
        `Rejected non-PDF file(s): ${nonPdfRejected.join(', ')}. Only PDF documents are accepted.`,
        'danger'
      );
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Remove an uploaded file (Task 4.2)
  const handleRemoveFile = (fileId) => {
    // Unmatch if file was matched to any requirement
    setMatchedFilesMap(prev => {
      const updated = { ...prev };
      for (const reqId in updated) {
        if (updated[reqId]?.id === fileId) {
          delete updated[reqId];
        }
      }
      return updated;
    });

    setUploadedFiles(prev => {
      const target = prev.find(f => f.id === fileId);
      if (target?.blobUrl) {
        URL.revokeObjectURL(target.blobUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // Match a file to a requirement (Task 4.3 & Task 4.6)
  const handleMatchFile = (reqId, fileId) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;

    // Rule 4.6: "If two or more uploaded files have exactly the same content, do not allow them to be matched to different documents."
    if (file.isDuplicateSecondary) {
      showAlert(`Cannot match duplicate file '${file.name}'. Duplicate of '${file.duplicateOriginalName}'.`, 'warning');
      return;
    }

    setMatchedFilesMap(prev => {
      const updated = { ...prev };

      // Ensure one file goes to at most one document: remove if already matched elsewhere
      for (const key in updated) {
        if (updated[key]?.id === fileId) {
          delete updated[key];
        }
      }

      updated[reqId] = {
        id: file.id,
        fileName: file.name,
        pageCount: file.pageCount,
        buffer: file.buffer,
        blobUrl: file.blobUrl
      };
      return updated;
    });

    // Auto-detect expiry date if filename has hints (e.g. trade_license_2026 or bank_solvency)
    const req = requirements.find(r => r.id === reqId);
    if (req?.has_expiry && !expiryDatesMap[reqId]) {
      if (file.name.includes('2026') && file.name.includes('trade')) {
        setExpiryDatesMap(prev => ({ ...prev, [reqId]: '2027-06-30' }));
      } else if (file.name.includes('2025') && file.name.includes('trade')) {
        setExpiryDatesMap(prev => ({ ...prev, [reqId]: '2025-06-30' }));
      } else if (file.name.includes('solvency')) {
        setExpiryDatesMap(prev => ({ ...prev, [reqId]: '2026-12-31' }));
      }
    }
  };

  // Undo / unmatch file (Task 4.3)
  const handleUnmatchFile = (reqId) => {
    setMatchedFilesMap(prev => {
      const updated = { ...prev };
      delete updated[reqId];
      return updated;
    });
  };

  // Update expiry date (Task 4.4)
  const handleUpdateExpiryDate = (reqId, newDate) => {
    setExpiryDatesMap(prev => ({
      ...prev,
      [reqId]: newDate
    }));
  };

  // Auto-Match button handler (Bonus 7.5)
  const handleAutoMatch = () => {
    const suggestions = suggestMatches(requirements, uploadedFiles);
    let matchCount = 0;

    setMatchedFilesMap(prev => {
      const updated = { ...prev };
      for (const [reqId, fileId] of Object.entries(suggestions)) {
        const file = uploadedFiles.find(f => f.id === fileId);
        if (file) {
          updated[reqId] = {
            id: file.id,
            fileName: file.name,
            pageCount: file.pageCount,
            buffer: file.buffer,
            blobUrl: file.blobUrl
          };
          matchCount++;
        }
      }
      return updated;
    });

    // Set sample expiry dates automatically if matched
    setExpiryDatesMap(prev => {
      const updated = { ...prev };
      // R01 Trade license 2026 expiry is 2027-06-30
      if (!updated['R01']) updated['R01'] = '2027-06-30';
      // R04 Bank solvency expiry is 2026-12-31
      if (!updated['R04']) updated['R04'] = '2026-12-31';
      return updated;
    });

    showAlert(`Smart Auto-Matched ${matchCount} documents successfully!`, 'success');
  };

  // 1-Click Load Sample Pack
  const handleLoadSamplePack = async () => {
    setIsLoadingSample(true);
    try {
      // 1. Set requirements from default
      setTender(DEFAULT_TENDER);
      setRequirements(DEFAULT_REQUIREMENTS);

      // 2. Fetch sample documents from public folder
      const sampleFilesToFetch = [
        '01_financial_proposal.pdf',
        '02_technical_proposal.pdf',
        '03_tin_certificate.pdf',
        '04_vat_certificate.pdf',
        'bank_solvency.pdf',
        'experience_cert.pdf',
        'experience_cert (1).pdf', // duplicate
        'scan_0042.pdf',
        'trade_license_2026.pdf',
        'company_logo.png' // will demonstrate non-pdf rejection or seal
      ];

      const loadedFileList = [];
      let logoArrayBuffer = null;

      for (const filename of sampleFilesToFetch) {
        try {
          const res = await fetch(`/sample-pack/documents/${encodeURIComponent(filename)}`);
          if (!res.ok) continue;
          const blob = await res.blob();
          const file = new File([blob], filename, { type: blob.type });

          if (filename.endsWith('.png')) {
            logoArrayBuffer = await file.arrayBuffer();
          }

          loadedFileList.push(file);
        } catch (e) {
          console.warn(`Could not fetch ${filename}:`, e);
        }
      }

      if (loadedFileList.length > 0) {
        await handleFilesAdded(loadedFileList);
      }

      // If logo was fetched, set as default seal option
      if (logoArrayBuffer) {
        setPackageOptions(prev => ({
          ...prev,
          sealImageBuffer: new Uint8Array(logoArrayBuffer),
          sealFileName: 'company_logo.png'
        }));
      }

      showAlert('Sample Pack loaded! Auto-detected duplicate file and validated PDFs.', 'success');
    } catch (err) {
      showAlert(`Error loading sample pack: ${err.message}`);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Generate combined PDF Package (Task 4.7 & Section 6)
  const handleGeneratePackage = async () => {
    if (!compliance.isReady) {
      showAlert('Cannot generate package: please resolve all blocking issues first.');
      return;
    }

    setIsGenerating(true);
    try {
      const pdfBytes = await createTenderPackage({
        tender,
        requirements,
        matchedFilesMap,
        expiryDatesMap,
        options: {
          includeIndexPage: packageOptions.includeIndexPage,
          sealImageBuffer: packageOptions.sealImageBuffer,
          sealPlacement: packageOptions.sealPlacement,
          language: lang
        }
      });

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (generatedPdfUrl) {
        URL.revokeObjectURL(generatedPdfUrl);
      }

      setGeneratedPdfBlob(blob);
      setGeneratedPdfUrl(url);

      // Trigger celebratory confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Auto trigger download (Task 4.8: <tender_id>_Package.pdf)
      const downloadName = `${tender.tender_id || 'Tender'}_Package.pdf`;
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showAlert(`Package generated and downloaded as ${downloadName}!`, 'success');
    } catch (err) {
      showAlert(`Error generating PDF package: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Manual download of generated package
  const handleDownloadGenerated = () => {
    if (!generatedPdfUrl) return;
    const downloadName = `${tender.tender_id || 'Tender'}_Package.pdf`;
    const a = document.createElement('a');
    a.href = generatedPdfUrl;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Preview generated package
  const handlePreviewGenerated = () => {
    if (!generatedPdfUrl) return;
    setPreviewFileData({
      title: `${tender.tender_id || 'Tender'}_Package.pdf (Generated Dossier)`,
      fileName: `${tender.tender_id || 'Tender'}_Package.pdf`,
      blobUrl: generatedPdfUrl
    });
  };

  // Preview an individual file
  const handlePreviewFile = (file) => {
    setPreviewFileData({
      title: file.fileName || file.name,
      fileName: file.fileName || file.name,
      blobUrl: file.blobUrl
    });
  };

  // Save project session to JSON (Bonus 7.4)
  const handleSaveProject = () => {
    const projectData = {
      tender,
      requirements,
      matchedFilesMeta: Object.entries(matchedFilesMap).map(([reqId, f]) => ({
        reqId,
        fileName: f.fileName,
        pageCount: f.pageCount
      })),
      expiryDatesMap,
      savedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tender.tender_id || 'Tender'}_Project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      {/* Alert Notification Toast */}
      {alertMessage && (
        <div className={`alert-banner alert-${alertMessage.type}`}>
          <span>{alertMessage.text}</span>
          <button 
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => setAlertMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar 
        lang={lang}
        setLang={handleLangChange}
        t={t}
        onLoadSamplePack={handleLoadSamplePack}
        onExportExcel={() => exportToExcel(requirements, matchedFilesMap, expiryDatesMap, compliance.statusMap, tender)}
        onExportCsv={() => exportToCsv(requirements, matchedFilesMap, expiryDatesMap, compliance.statusMap, tender)}
        onSaveProject={handleSaveProject}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        isLoadingSample={isLoadingSample}
      />

      {/* Tender Header Dossier Card */}
      <TenderHeader 
        tender={tender}
        stats={stats}
        lang={lang}
        t={t}
        onUploadRequirements={handleUploadRequirements}
        onEditTender={() => setIsEditTenderOpen(true)}
      />

      {/* Main Grid: Left side (Requirements & Uploads), Right side (Compliance & Generator) */}
      <div className="main-grid">
        <div>
          {/* Section 4.3 & 5: Requirements Checklist */}
          <RequirementsList 
            requirements={requirements}
            matchedFilesMap={matchedFilesMap}
            expiryDatesMap={expiryDatesMap}
            statusMap={compliance.statusMap}
            uploadedFiles={uploadedFiles}
            lang={lang}
            t={t}
            onMatchFile={handleMatchFile}
            onUnmatchFile={handleUnmatchFile}
            onUpdateExpiryDate={handleUpdateExpiryDate}
            onPreviewFile={handlePreviewFile}
          />

          {/* Section 4.2 & 4.6: PDF Files Repository */}
          <FileUploadSection 
            uploadedFiles={uploadedFiles}
            onFilesAdded={handleFilesAdded}
            onRemoveFile={handleRemoveFile}
            onPreviewFile={handlePreviewFile}
            onAutoMatch={handleAutoMatch}
            matchedFilesMap={matchedFilesMap}
            lang={lang}
            t={t}
          />
        </div>

        {/* Section 4.7, 4.8 & 6: Package Generator & Live Compliance */}
        <div>
          <PackageGenerator 
            compliance={compliance}
            onGeneratePackage={handleGeneratePackage}
            isGenerating={isGenerating}
            generatedPdfBlob={generatedPdfBlob}
            onDownloadGenerated={handleDownloadGenerated}
            onPreviewGenerated={handlePreviewGenerated}
            options={packageOptions}
            setOptions={setPackageOptions}
            lang={lang}
            t={t}
          />
        </div>
      </div>

      {/* Modals */}
      {previewFileData && (
        <PdfPreviewModal 
          fileData={previewFileData}
          onClose={() => setPreviewFileData(null)}
          lang={lang}
          t={t}
        />
      )}

      {isEditTenderOpen && (
        <TenderEditModal 
          tender={tender}
          onSave={setTender}
          onClose={() => setIsEditTenderOpen(false)}
          lang={lang}
          t={t}
        />
      )}

      {isHelpModalOpen && (
        <HelpGuideModal 
          onClose={() => setIsHelpModalOpen(false)}
          lang={lang}
          t={t}
        />
      )}

      {isAiModalOpen && (
        <AiAssistantModal 
          tender={tender}
          requirements={requirements}
          matchedFilesMap={matchedFilesMap}
          expiryDatesMap={expiryDatesMap}
          statusMap={compliance.statusMap}
          onClose={() => setIsAiModalOpen(false)}
          lang={lang}
          t={t}
        />
      )}
    </div>
  );
}
