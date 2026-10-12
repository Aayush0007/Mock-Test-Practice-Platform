import { Clock } from 'lucide-react'
import { formatTime } from '../../../utils/scoring'

export default function SectionTimer({ remaining, isWarning, dark = false }) {
  const base = dark
    ? isWarning
      ? 'bg-red-500 text-white animate-pulse'
      : remaining <= 300
        ? 'bg-amber-500 text-white'
        : 'bg-white/15 text-white'
    : isWarning
      ? 'bg-red-100 text-red-700 animate-pulse'
      : remaining <= 300
        ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-100 text-slate-700'

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-sm font-bold tabular-nums ${base}`}
    >
      <Clock className="h-4 w-4" />
      <span>{formatTime(remaining)}</span>
    </div>
  )
}
