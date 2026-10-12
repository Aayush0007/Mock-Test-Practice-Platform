import { Clock } from 'lucide-react'
import { formatTime } from '../../../utils/scoring'

export default function SectionTimer({ remaining, isWarning }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold ${
        isWarning
          ? 'bg-red-100 text-red-700 animate-pulse'
          : remaining <= 300
            ? 'bg-amber-100 text-amber-700'
            : 'bg-slate-100 text-slate-700'
      }`}
    >
      <Clock className="h-4 w-4" />
      <span>{formatTime(remaining)}</span>
    </div>
  )
}
