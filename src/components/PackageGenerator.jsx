import React, { useRef } from 'react';
import { 
  FileCheck, 
  AlertOctagon, 
  CheckCircle2, 
  Download, 
  Eye, 
  Stamp, 
  Layers, 
  Sparkles,
  FileText
} from 'lucide-react';

export function PackageGenerator({
  compliance,
  onGeneratePackage,
  isGenerating,
  generatedPdfBlob,
  onDownloadGenerated,
  onPreviewGenerated,
  options,
  setOptions,
  lang,
  t
}) {
  const sealInputRef = useRef(null);

  const handleSealUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes('png')) {
        alert('Please upload a PNG image file for seal / signature.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setOptions(prev => ({
          ...prev,
          sealImageBuffer: new Uint8Array(reader.result),
          sealFileName: file.name
        }));
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const isReady = compliance.isReady;

  return (
    <div className="glass-card generator-card">
      <div className="section-header" style={{ marginBottom: '12px' }}>
        <h3 className={`section-title ${lang === 'bn' ? 'font-bengali' : ''}`} style={{ fontSize: '1.05rem' }}>
          <FileCheck size={18} className="text-emerald-400" />
          {t.packageRulesHeader}
        </h3>
      </div>

      {/* Compliance / Blockers Status Box */}
      {isReady ? (
        <div className="alert-banner alert-success" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span className={lang === 'bn' ? 'font-bengali' : ''}>
              {t.noBlockers}
            </span>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
            <AlertOctagon size={16} />
            <span className={lang === 'bn' ? 'font-bengali' : ''}>
              {t.blockingIssues} ({compliance.blockerCount})
            </span>
          </div>

          <div className="blockers-list">
            {compliance.blockers.map(b => (
              <div key={b.reqId} className="blocker-item">
                <div>
                  <strong>[{b.reqId}] {lang === 'bn' ? b.titleBn : b.titleEn}</strong>
                  <div style={{ fontSize: '0.74rem', opacity: 0.9, marginTop: '2px' }}>
                    {lang === 'bn' ? b.reasonBn : b.reasonEn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bonus Options Section */}
      <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Package Options (Bonus)
        </span>

        {/* Option 1: Include Document Index / Table of Contents */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px', fontSize: '0.85rem' }}>
          <input 
            type="checkbox"
            checked={options.includeIndexPage}
            onChange={(e) => setOptions(prev => ({ ...prev, includeIndexPage: e.target.checked }))}
            style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
          />
          <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.includeIndexPage}</span>
        </label>

        {/* Option 2: Apply Official Seal / Signature PNG */}
        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Stamp size={14} className="text-amber-400" />
              <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.addSealSignature}</span>
            </span>

            <button 
              className="btn btn-outline"
              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
              onClick={() => sealInputRef.current?.click()}
            >
              {options.sealFileName ? 'Change' : 'Upload PNG'}
            </button>
            <input 
              type="file" 
              ref={sealInputRef} 
              onChange={handleSealUpload} 
              accept=".png,image/png" 
              style={{ display: 'none' }} 
            />
          </div>

          {options.sealFileName && (
            <div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginBottom: '6px' }}>
                ✓ {options.sealFileName} loaded
              </div>
              <label className="input-label" style={{ marginBottom: '4px' }}>
                {t.sealPlacement}:
              </label>
              <select 
                className="select-custom"
                value={options.sealPlacement}
                onChange={(e) => setOptions(prev => ({ ...prev, sealPlacement: e.target.value }))}
                style={{ padding: '6px 8px', fontSize: '0.8rem' }}
              >
                <option value="none">{t.sealNone}</option>
                <option value="all">{t.sealAllPages}</option>
                <option value="cover">{t.sealCoverOnly}</option>
                <option value="last">{t.sealLastPage}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Footer Rule Notification */}
      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FileText size={13} />
        <span>Footer: &lt;tender_id&gt; | Page X of Y (Section 6.3)</span>
      </div>

      {/* Generate Button (Disabled if any blocking issue) */}
      <button 
        className={`btn btn-generate ${isReady ? 'btn-emerald animate-pulse' : 'btn-secondary'}`}
        disabled={!isReady || isGenerating}
        onClick={onGeneratePackage}
        title={!isReady ? 'Resolve all blocking issues to enable generation' : 'Generate complete tender package'}
      >
        {isGenerating ? (
          <>
            <span className="spinner" />
            <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.generating}</span>
          </>
        ) : (
          <>
            <Sparkles size={18} />
            <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.generatePackage}</span>
          </>
        )}
      </button>

      {/* Generated Package Actions */}
      {generatedPdfBlob && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', animation: 'fadeIn 0.3s ease' }}>
          <button 
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
            onClick={onDownloadGenerated}
          >
            <Download size={16} />
            <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.downloadPdf}</span>
          </button>

          <button 
            className="btn btn-outline"
            style={{ width: '100%', padding: '10px', justifyContent: 'center' }}
            onClick={onPreviewGenerated}
          >
            <Eye size={16} />
            <span className={lang === 'bn' ? 'font-bengali' : ''}>{t.previewPackage}</span>
          </button>
        </div>
      )}
    </div>
  );
}
