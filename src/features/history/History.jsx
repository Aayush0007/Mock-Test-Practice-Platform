import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { History as HistoryIcon, Trash2, Eye } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import {
  getAllAttempts,
  getAllTests,
  deleteAttempt,
  deleteTest,
} from '../../services/storage/db'
import { formatTime } from '../../utils/scoring'
import { useAppStore } from '../../stores/appStore'

export default function History() {
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)

  const [attempts, setAttempts] = useState([])
  const [tests, setTests] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [a, t] = await Promise.all([getAllAttempts(), getAllTests()])
        setAttempts(a.reverse())
        const testMap = {}
        t.forEach((test) => {
          testMap[test.id] = test
        })
        setTests(testMap)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDeleteAttempt = async (id) => {
    if (!confirm('Delete this attempt?')) return
    try {
      await deleteAttempt(id)
      setAttempts((prev) => prev.filter((a) => a.id !== id))
      addToast({ type: 'success', title: 'Attempt deleted' })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to delete' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">History</h1>
        <p className="text-slate-500 mt-1">Your past test attempts</p>
      </div>

      {attempts.length === 0 ? (
        <Card>
          <EmptyState
            icon={HistoryIcon}
            title="No attempts yet"
            description="Complete a mock test to see your results and history here."
            actionLabel="Go to Dashboard"
            onAction={() => navigate('/')}
          />
        </Card>
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-slate-100">
            {attempts.map((attempt) => {
              const test = tests[attempt.testId]
              const r = attempt.result
              return (
                <div
                  key={attempt.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-slate-900">
                        {test?.title || 'Unknown Test'}
                      </h3>
                      {attempt.submissionReason === 'activity_violation' && (
                        <Badge variant="danger">Activity</Badge>
                      )}
                      {attempt.submissionReason === 'timeout' && (
                        <Badge variant="warning">Timeout</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      {r && (
                        <>
                          <span>
                            Score: {r.score}/{r.maxMarks} ({r.percentage}%)
                          </span>
                          <span>•</span>
                          <span>Accuracy: {r.accuracy}%</span>
                          <span>•</span>
                        </>
                      )}
                      <span>
                        {attempt.completedAt
                          ? new Date(attempt.completedAt).toLocaleDateString(
                              'en-IN',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )
                          : 'In progress'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {attempt.status === 'completed' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/results/${attempt.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAttempt(attempt.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
