# 📋 Tender Document Package Builder (TenderPack Pro)

> **AI DevFest Problem Statement Solution**  
> A client-side web application built with **React** that empowers office staff to assemble, validate, and produce a strictly ordered, fully compliant tender submission package (`.pdf`) ready for e-GP and physical submission.

🔗 **Live Application URL:** [https://sunny-salmiakki-738220.netlify.app/](https://sunny-salmiakki-738220.netlify.app/)  
📂 **Final Sample Package Output:** [`output/T-2026-0417_Package.pdf`](./output/T-2026-0417_Package.pdf)  
📸 **Document Statuses Screenshots:** [`screenshots/`](./screenshots/)

---

## 🌟 Executive Summary

When companies bid on government and institutional tenders, preparation errors such as **missing files**, **expired licenses**, **duplicate uploads**, or **incorrect ordering** can lead to immediate disqualification. 

**TenderPack Pro** automates document validation entirely inside the browser:
- **100% Client-Side Processing**: No confidential documents or sensitive files ever leave the user's browser.
- **Section 5 Compliance Engine**: Real-time evaluation of all mandatory, optional, and expiry-dependent documents.
- **Duplicate & Anomaly Detection**: SHA-256 byte hashing detects duplicate content regardless of filename and prevents cross-assignment.
- **Section 6 Packaging Standard**: Assembles a professional dossier with an English Cover Page, Document Index Schedule, and non-overlapping footers (`<tender_id> | Page X of Y`).
- **Bilingual Interface**: 1-click toggle between **English** and **বাংলা (Bengali)** for non-technical office staff.

---

## 🚀 Key Features

### 1. Main Tasks Compliance (Section 4)

| Task | Feature | Description |
| :--- | :--- | :--- |
| **4.1** | **Load the List** | Upload any custom `requirements.json` or use the 1-click **"Load Sample Pack"** button. Displays tender metadata and sorts all requirements by strict tender order (`1` to `N`). |
| **4.2** | **Upload Files** | Multi-file PDF drag-and-drop repository showing file names, page counts, and sizes. **Rejects non-PDF files** (e.g., `company_logo.png`) with an explicit alert message. Users can remove any file. |
| **4.3** | **Match Files** | Enforces strict **1-to-1 matching**: one requirement gets at most one file; one file goes to at most one requirement. Allows changing or undoing matches at any time. |
| **4.4** | **Enter Expiry Dates** | Interactive date picker appears for any requirement where `has_expiry = true` once a file is matched. |
| **4.5** | **Live Compliance Status** | Real-time status badge updates instantly upon any file match, unmatch, or date change adhering to Section 5 rules. |
| **4.6** | **Find Duplicates** | Computes SHA-256 hash for every file. Identical content is tagged (`⚠️ Duplicate of [file]`) and **prohibited from being matched to different documents**. |
| **4.7** | **Package Generator** | **"Generate Tender Package"** button stays disabled while blocking issues exist and displays a comprehensive **Blockers Checklist**. Enables with a glowing emerald gradient once 100% compliant. |
| **4.8** | **Standardized Download** | Generates and downloads the consolidated dossier named `<tender_id>_Package.pdf` (e.g., `T-2026-0417_Package.pdf`). |
| **4.9** | **Bilingual Localization** | Seamless toggle between **English** and **বাংলা**. Switches document titles (`title_en` vs `title_bn`), UI controls, status badges, blocker warnings, and user guides. |

---

### 2. Status Rules (Section 5)

Each document evaluates to exactly one of the five official statuses:

| Status | When Triggered | Blocks Package? | Visual Indicator |
| :--- | :--- | :---: | :--- |
| **Missing** | Mandatory document (`mandatory: true`), no file matched. | **Yes** | 🔴 Red Badge |
| **Expiry date needed** | `has_expiry = true` and file matched, but no expiry date entered. | **Yes** | 🟡 Amber Badge |
| **Expired** | Expiry date is before the submission deadline (`expiry_date < submission_deadline`). | **Yes** | 🔴 Red Badge + Warning |
| **Not provided** | Optional document (`mandatory: false`), no file matched. | **No** | ⚪ Slate Badge |
| **OK** | File matched, and if `has_expiry = true`, expiry date is on or after the deadline (`expiry_date >= submission_deadline`). | **No** | 🟢 Emerald Badge |

> **Rule Note:** If a document expires on the exact submission deadline day, it is considered **OK**.

---

### 3. Package Structure Rules (Section 6)

Every generated package strictly adheres to Section 6:
1. **Cover Page (Page 1 in English)**:
   - Tender ID
   - Tender Title
   - Procuring Entity
   - Bidder Name
   - Submission Deadline
   - Package Creation Date
   - Ordered table of included documents with titles, expiry dates, page counts, and compliance status.
2. **Document Sequence (Page 2+)**:
   - All included documents follow strictly in ascending order.
   - All original pages of each document are preserved.
   - Unmatched optional documents are skipped.
3. **Uniform Footer**:
   - Every page (including Cover and Index) features `<tender_id> | Page X of Y`, where `Y` is total package pages.
   - Rendered in a crisp high-contrast pill banner at the bottom that **does not obscure document content**.

---

### 4. Bonus Features Implemented (Section 7)

- [x] **Document Index (Table of Contents)**: Page 2 pagination schedule displaying each document's starting page number and page range.
- [x] **Official Seal / Signature PNG**: Upload a company seal or signature image (`company_logo.png` / PNG) and apply it to *All Pages*, *Cover Only*, or *Last Page*.
- [x] **Export Checklist to Excel & CSV**: One-click download of the complete compliance audit as `.xlsx` (via SheetJS) or `.csv`.
- [x] **Save & Reopen Work**: Export project state to `.json` and automatic browser `localStorage` recovery.
- [x] **Smart Auto-Match**: Intelligent heuristic matcher that auto-assigns uploaded files based on filename keywords in 1 click.
- [x] **Safe PDF Error Handling**: Try/catch handlers for password-protected or corrupted PDFs without crashing.
- [x] **AI Dossier Assistant**: In-browser assistant supporting optional user-provided Gemini API keys for AI compliance audits.
- [x] **In-Browser PDF Preview**: Responsive modal viewer to inspect individual uploaded PDFs and the final generated package without leaving the browser.

---

## 🔍 How the Sample Pack Problems Were Resolved

The contest sample pack contains real-world office anomalies that the application successfully handles:

| File / Item | Problem Detected | App Resolution & Verification |
| :--- | :--- | :--- |
| `company_logo.png` | Non-PDF file | **Rejected** with alert: *"Only valid PDF documents are allowed."* Can be loaded separately as an official Seal/Signature. |
| `experience_cert (1).pdf` | Identical duplicate of `experience_cert.pdf` | Flagged via SHA-256 hash match (`91cb4ab6...`). Application **blocks assigning duplicate copies** to different requirements. |
| `trade_license_2025.pdf` | Expired Trade License | Expiry date is `2025-06-30`, which is before the `2026-10-20` deadline. Status marked **Expired** (Blocks package). |
| `trade_license_2026.pdf` | Valid Trade License | Expiry date is `2027-06-30` (after deadline). Matched to R01; status marked **OK**. |
| `bank_solvency.pdf` | Expiry validation required | Expiry date is `2026-12-31` (after deadline). Matched to R04; status marked **OK**. |
| `scan_0042.pdf` | Scanned image-only PDF | Successfully parsed (1 page) and matched to R10 (Signed Declaration); status marked **OK**. |
| `R06` & `R07` | Optional documents with no file | Marked as **Not provided** without blocking package generation. |

---

## 🛠️ Technology Stack

- **Framework:** React 18
- **Build Tool:** Vite 6
- **Styling:** Vanilla CSS with custom design tokens, dark glassmorphism, and responsive grid
- **PDF Manipulation:** `pdf-lib` (browser-side merging, cover generation, footers, and stamping)
- **Spreadsheet Generation:** `xlsx` (Excel `.xlsx` and CSV export)
- **Icons:** `lucide-react`
- **Effects:** `canvas-confetti`
- **Fonts:** Plus Jakarta Sans, Hind Siliguri (Bengali), JetBrains Mono

---

## 💻 Local Development Setup

To run the application locally:

```bash
# 1. Clone repository
git clone <your-repo-url>
cd vibe-coding

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Google Chrome.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📁 Repository Structure

```text
├── output/
│   └── T-2026-0417_Package.pdf       # Generated 17-page submission package
├── screenshots/
│   ├── document_statuses.png         # Document statuses verification screenshot
│   ├── document_statuses_initial.png # Initial blocking state screenshot
│   └── document_statuses_verified.png# Full compliance state screenshot
├── sample-pack/
│   ├── requirements.json             # Tender requirements specification
│   └── documents/                    # Sample PDF documents
├── scripts/
│   ├── generate_output.js            # Standalone package generation script
│   └── capture_screenshot.js         # Headless browser screenshot capture script
├── src/
│   ├── components/
│   │   ├── Navbar.jsx                # Navigation, language toggle & action triggers
│   │   ├── TenderHeader.jsx          # Tender metadata & live compliance counters
│   │   ├── RequirementsList.jsx      # Ordered requirements & status badges
│   │   ├── FileUploadSection.jsx     # PDF repository & duplicate detection
│   │   ├── PackageGenerator.jsx      # Blocker checklist & PDF compilation
│   │   ├── PdfPreviewModal.jsx       # In-browser PDF previewer
│   │   ├── TenderEditModal.jsx       # Tender metadata editor
│   │   ├── HelpGuideModal.jsx        # Non-tech office staff guide
│   │   └── AiAssistantModal.jsx      # AI compliance assistant
│   ├── utils/
│   │   ├── pdfHelper.js              # PDF combination & footer stamping
│   │   ├── statusEngine.js           # Section 5 status rules evaluation
│   │   ├── autoMatch.js              # Heuristic auto-matching engine
│   │   └── exportChecklist.js        # Excel & CSV export utilities
│   ├── translations.js               # Full English & Bengali dictionary
│   ├── App.jsx                       # Main application state orchestration
│   ├── index.css                     # Design system & dark glassmorphic styling
│   └── main.jsx                      # React application mount
├── package.json
└── vite.config.js
```

---

## 👥 User Guide for Office Staff (অফিস কর্মীদের জন্য নির্দেশিকা)

1. **Load Requirements:** Click **"Load Sample Pack"** or upload your agency's `requirements.json`.
2. **Upload Documents:** Drag and drop all PDF documents into the upload box.
3. **Match Documents:** Click **"Smart Auto-Match"** or choose from the dropdown list.
4. **Enter Expiry Dates:** Provide expiry dates for documents that require them. If a document is expired or duplicated, resolve it until all mandatory statuses are **OK**.
5. **Download Package:** When 0 blockers remain, click **"Generate Tender Package"** to download the verified `<tender_id>_Package.pdf`!
