import { AlertTriangle, User } from 'lucide-react'
import SectionTimer from './SectionTimer'
import { useTestStore } from '../../../stores/testStore'

/**
 * Authentic banking/SSC CBT header:
 * exam title, sectional timer, candidate photos + name (top-right)
 */
export default function TestHeader({ remaining, isWarning, candidateName = 'Practice Candidate' }) {
  const test = useTestStore((s) => s.test)
  const getCurrentSection = useTestStore((s) => s.getCurrentSection)
  const getCurrentQuestion = useTestStore((s) => s.getCurrentQuestion)
  const warningCount = useTestStore((s) => s.warningCount)
  const currentSectionIndex = useTestStore((s) => s.currentSectionIndex)

  const section = getCurrentSection()
  const question = getCurrentQuestion()
  const totalSections = test?.sections?.length || 0

  return (
    <header className="bg-[#1a365d] text-white border-b border-[#2c5282] px-3 py-2 flex items-center justify-between gap-3 flex-shrink-0 select-none">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-sm font-semibold truncate max-w-[280px] sm:max-w-md">
            {test?.title || 'Mock Test'}
          </h1>
          {test?.examName && (
            <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-white/15">
              {test.examName} {test.examStage}
            </span>
          )}
        </div>
        <p className="text-[11px] text-blue-100 mt-0.5">
          Section {currentSectionIndex + 1}/{totalSections}: {section?.name || '—'}
          {question ? `  ·  Q.${question.number}` : ''}
        </p>
      </div>

      <div className="flex-shrink-0">
        <SectionTimer remaining={remaining} isWarning={isWarning} dark />
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {warningCount > 0 && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-amber-500/90 text-white text-xs font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            {warningCount}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            <div className="w-9 h-10 rounded border-2 border-white/40 bg-slate-300 overflow-hidden flex items-center justify-center">
              <User className="h-5 w-5 text-slate-500" />
            </div>
            <div className="w-9 h-10 rounded border-2 border-white/40 bg-slate-400 overflow-hidden flex items-center justify-center">
              <User className="h-5 w-5 text-slate-600" />
            </div>
          </div>
          <div className="hidden md:block text-right leading-tight">
            <p className="text-xs font-semibold">{candidateName}</p>
            <p className="text-[10px] text-blue-200">Roll: DEMO-2025</p>
          </div>
        </div>
      </div>
    </header>
  )
}
