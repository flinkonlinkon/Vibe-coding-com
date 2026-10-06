import React from 'react';
import { 
  FileText, 
  Languages, 
  Sparkles, 
  Download, 
  Upload, 
  HelpCircle, 
  CheckCircle2, 
  FolderDown, 
  Bot,
  FileSpreadsheet
} from 'lucide-react';

export function Navbar({
  lang,
  setLang,
  t,
  onLoadSamplePack,
  onExportExcel,
  onExportCsv,
  onSaveProject,
  onOpenProject,
  onOpenAiModal,
  onOpenHelpModal,
  isLoadingSample
}) {
  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-icon-box">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="brand-title">TenderPack Pro</h1>
          <p className={`brand-subtitle ${lang === 'bn' ? 'font-bengali' : ''}`}>
            {t.appSubtitle}
          </p>
        </div>
      </div>

      <div className="nav-actions">
        {/* Load Sample Pack (1-click quick evaluation) */}
        <button 
          className="btn btn-secondary" 
          onClick={onLoadSamplePack}
          disabled={isLoadingSample}
          title="Instantly load the DevFest sample requirements.json and document files"
        >
          <Sparkles size={16} className="text-amber-400" />
          <span className={lang === 'bn' ? 'font-bengali' : ''}>
            {isLoadingSample ? 'Loading...' : t.loadSamplePack}
          </span>
        </button>

        {/* Export Checklist Dropdown / Buttons */}
        <button 
          className="btn btn-secondary" 
          onClick={onExportExcel}
          title={t.exportExcel}
        >
          <FileSpreadsheet size={16} className="text-emerald-400" />
          <span className={lang === 'bn' ? 'font-bengali' : ''}>
            {lang === 'bn' ? 'এক্সেল রিপোর্ট' : 'Excel (.xlsx)'}
          </span>
        </button>

        {/* Save / Open Project */}
        <button 
          className="btn btn-secondary" 
          onClick={onSaveProject}
          title="Save project state to JSON file"
        >
          <FolderDown size={16} />
          <span>{lang === 'bn' ? 'সংরক্ষণ' : 'Save'}</span>
        </button>

        {/* AI Assistant Button */}
        <button 
          className="btn btn-secondary" 
          onClick={onOpenAiModal}
          title="AI Document Assistant"
        >
          <Bot size={16} className="text-indigo-400" />
          <span>AI Help</span>
        </button>

        {/* Quick Help Guide */}
        <button 
          className="btn btn-outline" 
          onClick={onOpenHelpModal}
          title="User Guide"
        >
          <HelpCircle size={17} />
        </button>

        {/* Language Toggle: EN / বাংলা */}
        <div className="lang-toggle" role="group" aria-label="Language selector">
          <button 
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
          >
            English
          </button>
          <button 
            className={`lang-btn font-bengali ${lang === 'bn' ? 'active' : ''}`}
            onClick={() => setLang('bn')}
          >
            বাংলা
          </button>
        </div>
      </div>
    </header>
  );
}
