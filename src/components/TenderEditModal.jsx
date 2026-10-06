import React, { useState } from 'react';
import { X, Save, Building2 } from 'lucide-react';

export function TenderEditModal({
  tender,
  onSave,
  onClose,
  lang,
  t
}) {
  const [formData, setFormData] = useState({ ...tender });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '540px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} className="text-indigo-400" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Edit Tender Details
            </h3>
          </div>
          <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDkirection: 'column', gap: '14px' }}>
            <div>
              <label className="input-label">{t.tenderId}</label>
              <input 
                type="text" 
                className="input-text" 
                value={formData.tender_id || ''}
                onChange={(e) => setFormData({ ...formData, tender_id: e.target.value })}
                required 
              />
            </div>

            <div>
              <label className="input-label">Tender Title</label>
              <input 
                type="text" 
                className="input-text" 
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required 
              />
            </div>

            <div>
              <label className="input-label">{t.procuringEntity}</label>
              <input 
                type="text" 
                className="input-text" 
                value={formData.procuring_entity || ''}
                onChange={(e) => setFormData({ ...formData, procuring_entity: e.target.value })}
                required 
              />
            </div>

            <div>
              <label className="input-label">{t.bidderName}</label>
              <input 
                type="text" 
                className="input-text" 
                value={formData.bidder || ''}
                onChange={(e) => setFormData({ ...formData, bidder: e.target.value })}
                required 
              />
            </div>

            <div>
              <label className="input-label">{t.submissionDeadline}</label>
              <input 
                type="date" 
                className="input-date" 
                value={formData.submission_deadline || ''}
                onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
                required 
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              {t.close}
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={15} />
              <span>{t.apply}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
