import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  AlertTriangle,
  Target,
  BarChart3,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { getAttempt, getTest } from '../../services/storage/db'
import { formatTime } from '../../utils/scoring'

function StatBox({ label, value, subtext, color = 'slate' }) {
  const colors = {
    slate: 'text-slate-900',
    green: 'text-green-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    blue: 'text-blue-600',
  }
  return (
    <div className="text-center p-4">
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
    </div>
  )
}

export default function TestResults() {
  const { attemptId } = useParams()
  const navigate = useNavigate()

  const [attempt, setAttempt] = useState(null)
  const [test, setTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('summary') // summary | sections | review
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const a = await getAttempt(attemptId)
        if (!a) {
          navigate('/')
          return
        }
        setAttempt(a)
        const t = await getTest(a.testId)
        setTest(t)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [attemptId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!attempt?.result) {
    return (
      <div className="text-center py-20 text-slate-500">
        No result data available.
      </div>
    )
  }

  const r = attempt.result
  const chartData = (r.sectionResults || []).map((s) => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
    Correct: s.correct,
    Incorrect: s.incorrect,
    Unanswered: s.unanswered,
  }))

  const filteredQuestions = (r.questionResults || []).filter((q) => {
    if (filterStatus === 'all') return true
    return q.status === filterStatus
  })

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {test?.title || 'Test Results'}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            {attempt.submissionReason === 'activity_violation' && (
              <Badge variant="danger">Submitted due to activity violations</Badge>
            )}
            {attempt.submissionReason === 'timeout' && (
              <Badge variant="warning">Auto-submitted (time expired)</Badge>
            )}
            {attempt.submissionReason === 'completed' && (
              <Badge variant="success">Completed</Badge>
            )}
            {r.hasIncompleteAnswerKey && (
              <Badge variant="warning">Provisional scores (incomplete answer key)</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Score overview */}
      <Card className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
          <StatBox
            label="Score"
            value={`${r.score} / ${r.maxMarks}`}
            subtext={`${r.percentage}%`}
            color="blue"
          />
          <StatBox
            label="Accuracy"
            value={`${r.accuracy}%`}
            subtext={`${r.correct} correct of ${r.attempted}`}
            color="green"
          />
          <StatBox
            label="Attempted"
            value={r.attempted}
            subtext={`${r.unanswered} unanswered`}
          />
          <StatBox
            label="Time Spent"
            value={formatTime(r.timeSpent)}
            subtext={`Avg ${formatTime(r.averageTimePerQuestion)}/q`}
          />
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <Card className="flex items-center gap-2 py-3 px-4">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-lg font-bold text-slate-900">{r.correct}</p>
            <p className="text-xs text-slate-500">Correct</p>
          </div>
        </Card>
        <Card className="flex items-center gap-2 py-3 px-4">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-lg font-bold text-slate-900">{r.incorrect}</p>
            <p className="text-xs text-slate-500">Incorrect</p>
          </div>
        </Card>
        <Card className="flex items-center gap-2 py-3 px-4">
          <MinusCircle className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-lg font-bold text-slate-900">{r.unanswered}</p>
            <p className="text-xs text-slate-500">Unanswered</p>
          </div>
        </Card>
        <Card className="flex items-center gap-2 py-3 px-4">
          <Target className="h-5 w-5 text-purple-500" />
          <div>
            <p className="text-lg font-bold text-slate-900">{r.markedForReview}</p>
            <p className="text-xs text-slate-500">Marked</p>
          </div>
        </Card>
        <Card className="flex items-center gap-2 py-3 px-4">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-lg font-bold text-slate-900">{r.warningCount || 0}</p>
            <p className="text-xs text-slate-500">Warnings</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {[
          { id: 'summary', label: 'Section Analysis' },
          { id: 'review', label: 'Question Review' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section Analysis */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary-600" />
                Section-wise Performance
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Correct" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Incorrect" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Unanswered" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Section cards */}
          {(r.sectionResults || []).map((sec) => (
            <Card key={sec.sectionId}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h3 className="font-semibold text-slate-900">{sec.name}</h3>
                <span className="text-sm font-medium text-slate-700">
                  {sec.score} / {sec.maxMarks} ({sec.accuracy}% accuracy)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Correct</p>
                  <p className="font-medium text-green-600">{sec.correct}</p>
                </div>
                <div>
                  <p className="text-slate-500">Incorrect</p>
                  <p className="font-medium text-red-600">{sec.incorrect}</p>
                </div>
                <div>
                  <p className="text-slate-500">Unanswered</p>
                  <p className="font-medium text-slate-600">{sec.unanswered}</p>
                </div>
                <div>
                  <p className="text-slate-500">Time Used</p>
                  <p className="font-medium text-slate-700">
                    {formatTime(sec.timeUsed)} / {formatTime(sec.timeAllocated)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Question Review */}
      {activeTab === 'review' && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'correct', label: 'Correct' },
              { id: 'incorrect', label: 'Incorrect' },
              { id: 'unanswered', label: 'Unanswered' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterStatus === f.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <Card key={q.questionId} className="!p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      Q{q.questionNumber}
                    </span>
                    <Badge
                      variant={
                        q.status === 'correct'
                          ? 'success'
                          : q.status === 'incorrect'
                            ? 'danger'
                            : 'default'
                      }
                    >
                      {q.status}
                    </Badge>
                    {q.provisional && (
                      <Badge variant="warning">Provisional</Badge>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    <span
                      className={
                        q.marks > 0
                          ? 'text-green-600 font-medium'
                          : q.marks < 0
                            ? 'text-red-600 font-medium'
                            : ''
                      }
                    >
                      {q.marks > 0 ? '+' : ''}
                      {q.marks}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {formatTime(q.timeSpent)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-1">{q.sectionName}</p>
                <div className="text-sm text-slate-700 space-y-1">
                  <p>
                    Your answer:{' '}
                    <strong>{q.savedAnswer || '—'}</strong>
                  </p>
                  <p>
                    Correct answer:{' '}
                    <strong className="text-green-700">
                      {q.correctAnswer || 'Not available'}
                    </strong>
                  </p>
                  {q.explanation && (
                    <p className="text-slate-500 mt-1 italic">{q.explanation}</p>
                  )}
                </div>
              </Card>
            ))}
            {filteredQuestions.length === 0 && (
              <p className="text-center text-slate-400 py-8">
                No questions match this filter.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex justify-center gap-3">
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
        {test && (
          <Button onClick={() => navigate(`/test/${test.id}/instructions`)}>
            Re-attempt
          </Button>
        )}
      </div>
    </div>
  )
}
