import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Keyboard,
  ArrowRight,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { getTest, saveAttempt } from '../../services/storage/db'
import { generateId } from '../../utils/id'
import { formatTime } from '../../utils/scoring'
import { useTestStore } from '../../stores/testStore'
import { useAppStore } from '../../stores/appStore'

export default function TestInstructions() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)
  const startAttempt = useTestStore((s) => s.startAttempt)

  const [test, setTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const t = await getTest(testId)
        if (!t) {
          addToast({ type: 'error', title: 'Test not found' })
          navigate('/')
          return
        }
        setTest(t)
      } catch (err) {
        addToast({ type: 'error', title: 'Failed to load test' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [testId])

  const handleStart = async () => {
    if (!accepted) return

    const attemptId = generateId()
    const attempt = {
      id: attemptId,
      testId: test.id,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      responses: {},
      visited: [],
      markedForReview: [],
      warningCount: 0,
      activityLog: [],
    }

    try {
      await saveAttempt(attempt)
      startAttempt({ attemptId, test })
      navigate(`/test/${test.id}/attempt/${attemptId}`)
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to start test', message: err.message })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!test) return null

  const totalDuration = test.sections.reduce((s, sec) => s + sec.durationSeconds, 0)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{test.title}</h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="info">
            {test.examName} {test.examStage}
          </Badge>
          <span className="text-sm text-slate-500">
            {test.totalQuestions} questions · {test.maxMarks} marks ·{' '}
            {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      {/* Section overview */}
      <Card className="mb-6">
        <h2 className="font-semibold text-slate-900 mb-3">Section Overview</h2>
        <div className="space-y-2">
          {test.sections.map((sec, idx) => (
            <div
              key={sec.id}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-primary-50 text-primary-700 text-sm font-medium">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-medium text-sm text-slate-900">{sec.name}</p>
                  <p className="text-xs text-slate-500">
                    {sec.actualQuestions || sec.expectedQuestions} questions · +
                    {sec.positiveMarks} / −{sec.negativeMarks}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(sec.durationSeconds)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Instructions */}
      <Card className="mb-6">
        <h2 className="font-semibold text-slate-900 mb-3">Instructions</h2>
        <ul className="space-y-3 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>
              Each section has its own timer. When the time expires, the section is
              automatically locked and the next section begins.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>
              You <strong>cannot</strong> switch between sections manually. Sections
              are attempted in order.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>
              Select an option, then click <strong>Save & Next</strong> to commit
              your answer. Navigating away without saving discards the selection.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>
              Use <strong>Mark for Review</strong> to flag questions you want to
              revisit within the same section.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <span>
              The test will be automatically submitted when the final section timer
              expires.
            </span>
          </li>
        </ul>
      </Card>

      {/* Anti-cheating policy */}
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Activity Monitoring Policy
        </h2>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <Eye className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <span>
              Switching away from this tab or window will trigger a warning. After{' '}
              <strong>5 warnings</strong>, the next violation will automatically
              submit your test.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Keyboard className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <span>
              Copy, paste, right-click, and some keyboard shortcuts are restricted
              during the test.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <span>
              This is a practice deterrence system, not secure proctoring. Browser
              limitations mean some activity cannot be fully monitored.
            </span>
          </li>
        </ul>
      </Card>

      {/* Accept & Start */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          I have read and understood the instructions and activity policy.
        </label>
        <Button onClick={handleStart} disabled={!accepted} size="lg">
          Start Test
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
