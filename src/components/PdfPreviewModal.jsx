import React from 'react';
import { X, Download, FileText } from 'lucide-react';

export function PdfPreviewModal({
  fileData, // { title, blobUrl, fileName }
  onClose,
  lang,
  t
}) {
  if (!fileData) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '1000px', height: '88vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} className="text-indigo-400" />
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc' }}>
              {fileData.title || fileData.fileName || 'PDF Document Preview'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {fileData.blobUrl && (
              <a 
                href={fileData.blobUrl} 
                download={fileData.fileName || 'document.pdf'}
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none' }}
              >
                <Download size={14} />
                <span>Download</span>
              </a>
            )}

            <button 
              className="btn btn-outline" 
              style={{ padding: '6px 10px' }}
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: 0, height: '100%' }}>
          <iframe 
            src={fileData.blobUrl} 
            title="PDF Preview"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
