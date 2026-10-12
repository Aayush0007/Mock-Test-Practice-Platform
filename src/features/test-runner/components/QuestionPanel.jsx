import { useTestStore } from '../../../stores/testStore'

export default function QuestionPanel() {
  const getCurrentQuestion = useTestStore((s) => s.getCurrentQuestion)
  const tempSelection = useTestStore((s) => s.tempSelection)
  const setTempSelection = useTestStore((s) => s.setTempSelection)
  const responses = useTestStore((s) => s.responses)

  const question = getCurrentQuestion()
  if (!question) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        No question available
      </div>
    )
  }

  // Display temp selection, or fall back to saved response
  const selected =
    tempSelection !== null ? tempSelection : responses[question.id] ?? null

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <span className="text-sm font-semibold text-primary-700">
          Question {question.number}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <p className="text-slate-900 whitespace-pre-wrap leading-relaxed mb-6">
          {question.text}
        </p>

        <div className="space-y-2">
          {(question.options || []).map((opt) => {
            const isSelected = selected === opt.label
            return (
              <button
                key={opt.label}
                onClick={() => setTempSelection(opt.label)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold flex-shrink-0 ${
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {opt.label}
                </span>
                <span className="text-sm text-slate-800 pt-0.5">{opt.text}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
