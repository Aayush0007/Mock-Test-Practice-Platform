import { AlertTriangle } from 'lucide-react'
import SectionTimer from './SectionTimer'
import { useTestStore } from '../../../stores/testStore'

export default function TestHeader({ remaining, isWarning }) {
  const test = useTestStore((s) => s.test)
  const getCurrentSection = useTestStore((s) => s.getCurrentSection)
  const getCurrentQuestion = useTestStore((s) => s.getCurrentQuestion)
  const warningCount = useTestStore((s) => s.warningCount)
  const currentSectionIndex = useTestStore((s) => s.currentSectionIndex)

  const section = getCurrentSection()
  const question = getCurrentQuestion()

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-4 flex-shrink-0">
      <div className="min-w-0">
        <h1 className="text-sm font-semibold text-slate-900 truncate">
          {test?.title}
        </h1>
        <p className="text-xs text-slate-500">
          Section {currentSectionIndex + 1}: {section?.name} · Q
          {question?.number}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {warningCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-700 text-xs font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            {warningCount} warning{warningCount > 1 ? 's' : ''}
          </div>
        )}
        <SectionTimer remaining={remaining} isWarning={isWarning} />
      </div>
    </header>
  )
}
