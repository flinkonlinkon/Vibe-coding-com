import React, { useRef } from 'react';
import { 
  Building2, 
  Calendar, 
  Briefcase, 
  FileCheck2, 
  AlertCircle, 
  Upload, 
  Edit3,
  FileCode,
  ShieldCheck
} from 'lucide-react';

export function TenderHeader({
  tender,
  stats,
  lang,
  t,
  onUploadRequirements,
  onEditTender
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadRequirements(file);
    }
  };

  return (
    <div className="glass-card tender-header-card">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="badge-tender-id">
            <ShieldCheck size={16} />
            <span>{tender.tender_id || 'T-2026-0417'}</span>
          </div>
          <h2 className={`section-title ${lang === 'bn' ? 'font-bengali' : ''}`} style={{ fontSize: '1.25rem' }}>
            {tender.title || 'Supply of IT Equipment'}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => fileInputRef.current?.click()}
            title="Upload custom requirements.json file"
          >
            <Upload size={15} />
            <span className={lang === 'bn' ? 'font-bengali' : ''}>
              {t.uploadRequirements}
            </span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json,application/json" 
            style={{ display: 'none' }} 
          />

          <button 
            className="btn btn-outline" 
            onClick={onEditTender}
            title="Edit tender information"
          >
            <Edit3 size={15} />
          </button>
        </div>
      </div>

      <div className="tender-meta-grid">
        <div className="meta-item">
          <span className={`meta-label ${lang === 'bn' ? 'font-bengali' : ''}`}>{t.procuringEntity}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} className="text-slate-400" />
            <span className="meta-value">{tender.procuring_entity || 'N/A'}</span>
          </div>
        </div>

        <div className="meta-item">
          <span className={`meta-label ${lang === 'bn' ? 'font-bengali' : ''}`}>{t.bidderName}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={16} className="text-slate-400" />
            <span className="meta-value">{tender.bidder || 'N/A'}</span>
          </div>
        </div>

        <div className="meta-item">
          <span className={`meta-label ${lang === 'bn' ? 'font-bengali' : ''}`}>{t.submissionDeadline}</span>
          <div>
            <span className="deadline-badge">
              <Calendar size={14} />
              {tender.submission_deadline || '2026-10-20'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Counter Banner */}
      <div className="stats-banner">
        <div className="stat-box">
          <span className="stat-num" style={{ color: '#818cf8' }}>{stats.totalCount}</span>
          <span className={`stat-title ${lang === 'bn' ? 'font-bengali' : ''}`}>{t.totalDocuments}</span>
        </div>

        <div className="stat-box">
          <span className="stat-num" style={{ color: '#f87171' }}>{stats.mandatoryCount}</span>
          <span className={`stat-title ${lang === 'bn' ? 'font-bengali' : ''}`}>{t.mandatoryCount}</span>
        </div>

        <div className="stat-box">
          <span className="stat-num" style={{ color: '#94a3b8' }}>{stats.optionalCount}</span>
          <span className={`stat-title ${lang === 'bn' ? 'font-bengali' : ''}`}>{t.optionalCount}</span>
        </div>

        <div className="stat-box">
          <span className="stat-num" style={{ color: '#10b981' }}>{stats.validCount}</span>
          <span className={`stat-title ${lang === 'bn' ? 'font-bengali' : ''}`}>{t.validCount}</span>
        </div>

        <div className="stat-box" style={{ borderColor: stats.blockerCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)' }}>
          <span className="stat-num" style={{ color: stats.blockerCount > 0 ? '#ef4444' : '#10b981' }}>
            {stats.blockerCount}
          </span>
          <span className={`stat-title ${lang === 'bn' ? 'font-bengali' : ''}`}>{t.blockerCount}</span>
        </div>
      </div>
    </div>
  );
}
