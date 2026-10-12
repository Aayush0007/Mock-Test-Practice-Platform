import { useTestStore } from '../../../stores/testStore'

const STATUS_STYLES = {
  'not-visited': 'bg-slate-200 text-slate-600 border-slate-300',
  'not-answered': 'bg-red-100 text-red-700 border-red-300',
  answered: 'bg-green-100 text-green-700 border-green-300',
  marked: 'bg-purple-100 text-purple-700 border-purple-300',
  'answered-marked': 'bg-purple-200 text-purple-800 border-purple-400',
}

export default function QuestionPalette() {
  const getCurrentSectionQuestions = useTestStore((s) => s.getCurrentSectionQuestions)
  const currentQuestionIndex = useTestStore((s) => s.currentQuestionIndex)
  const getQuestionStatus = useTestStore((s) => s.getQuestionStatus)
  const goToQuestion = useTestStore((s) => s.goToQuestion)

  const questions = getCurrentSectionQuestions()

  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Question Palette
      </h4>
      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((q, idx) => {
          const status = getQuestionStatus(q.id)
          const isCurrent = idx === currentQuestionIndex
          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(idx)}
              className={`w-9 h-9 rounded text-xs font-semibold border transition-all ${
                STATUS_STYLES[status] || STATUS_STYLES['not-visited']
              } ${isCurrent ? 'ring-2 ring-primary-500 ring-offset-1' : 'hover:opacity-80'}`}
              title={`Q${q.number} — ${status}`}
            >
              {q.number}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px] text-slate-500">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300" />
          Not Visited
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-300" />
          Not Answered
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-300" />
          Answered
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-purple-100 border border-purple-300" />
          Marked
        </div>
      </div>
    </div>
  )
}
