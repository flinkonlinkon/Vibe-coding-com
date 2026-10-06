import React, { useRef, useState } from 'react';
import { 
  Upload, 
  FileUp, 
  FileText, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  Copy, 
  Check, 
  Sparkles,
  ShieldAlert,
  Info
} from 'lucide-react';

export function FileUploadSection({
  uploadedFiles,
  onFilesAdded,
  onRemoveFile,
  onPreviewFile,
  onAutoMatch,
  duplicateHashMap,
  matchedFilesMap,
  lang,
  t
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
      e.target.value = ''; // reset for re-selection
    }
  };

  // Check if file is matched to a requirement
  const getMatchedRequirementId = (fileId) => {
    for (const [reqId, f] of Object.entries(matchedFilesMap)) {
      if (f?.id === fileId) return reqId;
    }
    return null;
  };

  return (
    <div className="glass-card" style={{ marginTop: '24px' }}>
      <div className="section-header">
        <div>
          <h2 className={`section-title ${lang === 'bn' ? 'font-bengali' : ''}`}>
            <FileUp size={20} className="text-cyan-400" />
            {t.fileUploadSection}
          </h2>
          <p className={`text-sub ${lang === 'bn' ? 'font-bengali' : ''}`} style={{ fontSize: '0.8rem', marginTop: '2px' }}>
            {t.uploadPdfSubtitle}
          </p>
        </div>

        {/* Smart Auto Match Button */}
        {uploadedFiles.length > 0 && (
          <button 
            className="btn btn-primary"
            onClick={onAutoMatch}
            title="Automatically match uploaded PDFs to requirements by file name"
          >
            <Sparkles size={16} />
            <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.autoMatch}</span>
          </button>
        )}
      </div>

      {/* Drag & Drop Zone */}
      <div 
        className={`dropzone ${isDragging ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-icon">
          <Upload size={26} />
        </div>
        <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }} className={lang === 'bn' ? 'font-bengali' : ''}>
          {t.dragPdfsHere}
        </p>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
          Supports multiple PDF uploads (up to 30 files, max 50MB)
        </p>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          multiple 
          accept=".pdf,application/pdf"
          style={{ display: 'none' }} 
        />
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>
              {t.uploadedFiles} ({uploadedFiles.length})
            </span>
          </div>

          <div className="file-list">
            {uploadedFiles.map(file => {
              const matchedReqId = getMatchedRequirementId(file.id);
              const isDuplicate = file.isDuplicateSecondary;

              return (
                <div 
                  key={file.id} 
                  className={`file-item ${isDuplicate ? 'is-duplicate' : ''}`}
                >
                  <div className="file-meta-left">
                    <div className="file-item-icon">
                      <FileText size={18} className={isDuplicate ? 'text-amber-400' : 'text-slate-400'} />
                    </div>

                    <div className="file-name-block">
                      <div className="file-display-name" title={file.name}>
                        {file.name}
                      </div>

                      <div className="file-sub-meta">
                        <span>{file.pageCount} {file.pageCount === 1 ? t.page : t.pages}</span>
                        <span>•</span>
                        <span>{(file.size / 1024).toFixed(1)} KB</span>

                        {file.hash && (
                          <>
                            <span>•</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                              SHA: {file.hash.slice(0, 8)}...
                            </span>
                          </>
                        )}

                        {/* Duplicate Warning Tag */}
                        {isDuplicate && (
                          <span className="badge-duplicate" title={t.duplicateWarning}>
                            <AlertTriangle size={11} />
                            <span>{t.duplicateOf} {file.duplicateOriginalName}</span>
                          </span>
                        )}

                        {/* Matched Requirement Badge */}
                        {matchedReqId && (
                          <span className="badge-assigned">
                            <Check size={11} />
                            <span>Matched to {matchedReqId}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions on file */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      onClick={() => onPreviewFile(file)}
                      title={t.preview}
                    >
                      <Eye size={14} />
                      <span className="hidden sm:inline">{t.preview}</span>
                    </button>

                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      onClick={() => onRemoveFile(file.id)}
                      title={t.removeFile}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
