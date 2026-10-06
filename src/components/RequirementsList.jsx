import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  FileText, 
  Eye, 
  Trash2, 
  Calendar,
  Filter,
  Check,
  FileQuestion
} from 'lucide-react';

export function RequirementsList({
  requirements,
  matchedFilesMap,
  expiryDatesMap,
  statusMap,
  uploadedFiles,
  lang,
  t,
  onMatchFile,
  onUnmatchFile,
  onUpdateExpiryDate,
  onPreviewFile
}) {
  const [filter, setFilter] = useState('all'); // 'all', 'blocking', 'matched'

  // Sort requirements strictly by order
  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);

  // Filter requirements
  const filteredReqs = sortedReqs.filter(req => {
    const status = statusMap[req.id];
    if (filter === 'blocking') return status?.blocks;
    if (filter === 'matched') return Boolean(matchedFilesMap[req.id]);
    return true;
  });

  // Calculate set of file IDs already matched to ANY other document
  const assignedFileIds = new Set(
    Object.values(matchedFilesMap).map(f => f?.id).filter(Boolean)
  );

  // Status Badge Component
  const renderStatusBadge = (statusObj) => {
    if (!statusObj) return null;

    switch (statusObj.status) {
      case 'OK':
        return (
          <div className="status-badge status-ok" title={lang === 'bn' ? statusObj.reasonBn : statusObj.reasonEn}>
            <CheckCircle2 size={15} />
            <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.statusOk}</span>
          </div>
        );
      case 'Missing':
        return (
          <div className="status-badge status-missing" title={lang === 'bn' ? statusObj.reasonBn : statusObj.reasonEn}>
            <XCircle size={15} />
            <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.statusMissing}</span>
          </div>
        );
      case 'Expiry date needed':
        return (
          <div className="status-badge status-expiry-needed" title={lang === 'bn' ? statusObj.reasonBn : statusObj.reasonEn}>
            <Clock size={15} />
            <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.statusExpiryNeeded}</span>
          </div>
        );
      case 'Expired':
        return (
          <div className="status-badge status-expired" title={lang === 'bn' ? statusObj.reasonBn : statusObj.reasonEn}>
            <AlertTriangle size={15} />
            <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.statusExpired}</span>
          </div>
        );
      case 'Not provided':
      default:
        return (
          <div className="status-badge status-not-provided" title={lang === 'bn' ? statusObj.reasonBn : statusObj.reasonEn}>
            <FileQuestion size={15} />
            <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.statusNotProvided}</span>
          </div>
        );
    }
  };

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h2 className={`section-title ${lang === 'bn' ? 'font-bengali' : ''}`}>
            <FileText size={20} className="text-indigo-400" />
            {t.requirementsList}
          </h2>
          <p className={`text-sub ${lang === 'bn' ? 'font-bengali' : ''}`} style={{ fontSize: '0.8rem', marginTop: '2px' }}>
            {t.requirementsSub}
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setFilter('all')}
          >
            <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.filterAll}</span>
          </button>
          <button 
            className={`btn ${filter === 'blocking' ? 'btn-danger' : 'btn-outline'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setFilter('blocking')}
          >
            <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.filterBlocking}</span>
          </button>
          <button 
            className={`btn ${filter === 'matched' ? 'btn-emerald' : 'btn-outline'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setFilter('matched')}
          >
            <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.filterMatched}</span>
          </button>
        </div>
      </div>

      {filteredReqs.map(req => {
        const matched = matchedFilesMap[req.id];
        const statusObj = statusMap[req.id];
        const expiryDate = expiryDatesMap[req.id] || '';
        const title = lang === 'bn' ? (req.title_bn || req.title_en) : (req.title_en || req.title_bn);

        const cardStateClass = statusObj?.blocks ? 'card-blocking' : (statusObj?.status === 'OK' ? 'card-ok' : 'card-optional');

        return (
          <div key={req.id} className={`requirement-card ${cardStateClass}`}>
            <div className="req-row-top">
              <div className="req-info">
                <div className="req-order-badge">#{req.order}</div>
                <div>
                  <div className={`req-title ${lang === 'bn' ? 'font-bengali' : ''}`}>
                    {title}
                  </div>
                  <div className="req-pills">
                    {req.mandatory ? (
                      <span className={`pill-mandatory ${lang === 'bn' ? 'font-bengali' : ''}`}>
                        {t.mandatory}
                      </span>
                    ) : (
                      <span className={`pill-optional ${lang === 'bn' ? 'font-bengali' : ''}`}>
                        {t.optional}
                      </span>
                    )}

                    {req.has_expiry && (
                      <span className={`pill-expiry-needed ${lang === 'bn' ? 'font-bengali' : ''}`}>
                        <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                        {t.expiryCheck}
                      </span>
                    )}

                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                      ID: {req.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {renderStatusBadge(statusObj)}
              </div>
            </div>

            {/* Requirement Controls (Match File & Expiry Date) */}
            <div className="req-controls">
              {/* File Matching Selector */}
              <div>
                <label className={`input-label ${lang === 'bn' ? 'font-bengali' : ''}`}>
                  {t.matchedFile}
                </label>

                {matched ? (
                  <div className="matched-file-chip">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <FileText size={16} className="text-indigo-400" style={{ flexShrink: 0 }} />
                      <span className="file-name-text" title={matched.fileName}>
                        {matched.fileName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', flexShrink: 0 }}>
                        ({matched.pageCount} {matched.pageCount === 1 ? t.page : t.pages})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => onPreviewFile(matched)}
                        title={t.preview}
                      >
                        <Eye size={13} />
                      </button>

                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => onUnmatchFile(req.id)}
                        title={t.unmatch}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <select 
                    className="select-custom"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onMatchFile(req.id, e.target.value);
                      }
                    }}
                  >
                    <option value="">{t.selectFileToMatch}</option>
                    {uploadedFiles
                      .filter(f => f.valid)
                      .map(file => {
                        const isAssignedToOther = assignedFileIds.has(file.id);
                        const isDuplicateWarn = file.isDuplicateSecondary;
                        const disabled = isAssignedToOther || isDuplicateWarn;

                        let label = `${file.name} (${file.pageCount} pg)`;
                        if (isAssignedToOther) label += ' [Already Matched]';
                        if (isDuplicateWarn) label += ' [Duplicate - Blocked]';

                        return (
                          <option 
                            key={file.id} 
                            value={file.id}
                            disabled={disabled}
                          >
                            {label}
                          </option>
                        );
                      })}
                  </select>
                )}
              </div>

              {/* Expiry Date Input (Shown when has_expiry is true) */}
              <div>
                {req.has_expiry ? (
                  <div>
                    <label className={`input-label ${lang === 'bn' ? 'font-bengali' : ''}`}>
                      {t.expiryDate} {matched ? '(Required)' : ''}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="date"
                        className="input-date"
                        value={expiryDate}
                        onChange={(e) => onUpdateExpiryDate(req.id, e.target.value)}
                        placeholder="YYYY-MM-DD"
                        disabled={!matched}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '18px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      — No expiry check needed —
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Explanatory Alert message if blocking */}
            {statusObj?.blocks && (
              <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={13} />
                <span className={lang === 'bn' ? 'font-bengali' : ''}>
                  {lang === 'bn' ? statusObj.reasonBn : statusObj.reasonEn}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
