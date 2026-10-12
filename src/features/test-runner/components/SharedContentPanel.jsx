/**
 * Left panel: Directions / passage for the current question.
 */
import { useTestStore } from '../../../stores/testStore'

function FormattedText({ text }) {
  if (!text) return null
  const parts = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0
  let m
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(<span key={key++}>{text.slice(last, m.index)}</span>)
    }
    parts.push(
      <strong key={key++} className="font-bold text-slate-900 bg-yellow-100 px-0.5 rounded-sm">
        {m[1]}
      </strong>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) {
    parts.push(<span key={key++}>{text.slice(last)}</span>)
  }
  return <>{parts.length ? parts : text}</>
}

export default function SharedContentPanel() {
  const getCurrentQuestion = useTestStore((s) => s.getCurrentQuestion)
  const test = useTestStore((s) => s.test)
  const question = getCurrentQuestion()

  if (!question) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-400 p-6 text-center">
        No question selected
      </div>
    )
  }

  let passage = null
  if (question.sharedContentId && test?.passages?.length) {
    passage = test.passages.find((p) => p.id === question.sharedContentId)
  }
  if (!passage && test?.passages?.length) {
    passage = test.passages.find(
      (p) =>
        typeof p.from === 'number' &&
        typeof p.to === 'number' &&
        question.number >= p.from &&
        question.number <= p.to
    )
  }

  if (!passage?.text) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-400 p-6 text-center">
        No Directions or passage for this question.
        <br />
        <span className="text-xs mt-2 block">
          (Standalone questions show only options on the right.)
        </span>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 sticky top-0 bg-white py-1 z-10">
        Directions / Passage
        {passage.from != null && passage.to != null
          ? ` (Q${passage.from}–Q${passage.to})`
          : ''}
      </h4>
      <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-100 rounded-lg p-3 bg-slate-50">
        <FormattedText text={passage.text} />
      </div>
    </div>
  )
}
