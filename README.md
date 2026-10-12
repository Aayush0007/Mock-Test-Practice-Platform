# Mock Test Practice Platform

A browser-based mock-test platform that converts examination PDFs into interactive, timed computer-based tests for Indian competitive exam aspirants (Banking & SSC).

## Features

- **PDF to Test**: Upload question paper PDFs, extract questions & answer keys locally
- **CBT Interface**: Sectional timers, Save & Next, Mark for Review, question palette
- **Anti-Cheating**: Tab-switch detection, shortcut blocking, configurable warning policy
- **Analytics**: Section-wise scores, accuracy, time analysis, question review
- **Privacy-first**: All data stored in browser IndexedDB — nothing uploaded to a server

## Supported Examinations

SBI Clerk/PO, IBPS Clerk/PO/RRB/SO, SSC CGL (Prelims & Mains)

## Tech Stack

- React 18 + Vite
- Tailwind CSS v3
- Zustand (state)
- IndexedDB via `idb`
- PDF.js (text extraction)
- React Router v6
- Recharts (analytics charts)
- Lucide React (icons)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open http://localhost:5173

## Project Structure

```
src/
├── app/            # App shell, router, providers
├── components/     # Shared UI components
├── features/       # Feature modules (dashboard, pdf-import, test-builder, test-runner, results, history)
├── config/         # Exam configurations, env
├── services/       # PDF parser, IndexedDB storage
├── stores/         # Zustand stores
├── hooks/          # Shared hooks
├── utils/          # Scoring engine, error helpers
└── styles/         # Global CSS + Tailwind
```

## Architecture Notes

1. **Test Engine** (`stores/testStore.js`) is the single source of truth during an active attempt.
2. **Scoring** is pure functions in `utils/scoring.js` — easy to unit test.
3. **PDF parsing** is best-effort. Human review in the Test Builder is required.
4. **Timers** use absolute deadlines to avoid drift when the tab is backgrounded.
5. The API layer (`services/api/`) is a placeholder for future backend integration.

## Known Limitations

- Scanned (image-only) PDFs are not yet supported (OCR planned)
- PDF layouts vary widely — extraction accuracy depends on document format
- Client-side storage is not tamper-proof
- Activity monitoring is deterrence, not secure proctoring

## License

Private — for personal / educational use.
