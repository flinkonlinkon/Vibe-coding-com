import React from 'react';
import { X, BookOpen, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export function HelpGuideModal({ onClose, lang, t }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} className="text-indigo-400" />
            <h3 className={`section-title ${lang === 'bn' ? 'font-bengali' : ''}`} style={{ fontSize: '1.15rem' }}>
              {t.helpGuide}
            </h3>
          </div>
          <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '12px 16px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', fontSize: '0.85rem' }}>
            <strong>💡 Quick Workflow:</strong> Follow these 5 steps to assemble and verify your tender dossier in minutes without any technical expertise.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>1</div>
              <div>
                <strong>Load Requirements:</strong> Click <em>"Load Sample Pack"</em> to start instantly, or upload your agency's <code>requirements.json</code>.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>2</div>
              <div>
                <strong>Upload PDFs:</strong> Drag and drop all PDF documents into the upload box. Non-PDF files (e.g. images) are safely rejected.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>3</div>
              <div>
                <strong>Match Documents:</strong> Click <em>"Smart Auto-Match"</em> or select from the dropdown. One file matches one requirement.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>4</div>
              <div>
                <strong>Check Expiry & Duplicates:</strong> Enter expiry dates for documents requiring them. Make sure expiry date is on or after the submission deadline. Duplicates are blocked from cross-matching.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>5</div>
              <div>
                <strong>Generate & Download:</strong> When all blockers are cleared (status is OK), click <em>"Generate Tender Package"</em> to download your verified PDF dossier!
              </div>
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
            <ShieldCheck size={14} style={{ display: 'inline', marginRight: '6px', color: '#10b981' }} />
            Privacy Notice: All document processing happens entirely inside your web browser. Documents are never transmitted to any external server.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
