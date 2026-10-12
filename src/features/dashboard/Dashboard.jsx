import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  FileText,
  Target,
  TrendingUp,
  Clock,
  Award,
  BookOpen,
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { getDashboardStats, getAllTests } from '../../services/storage/db'
import { formatTime } from '../../utils/scoring'
import { seedDemoTestIfEmpty } from '../../utils/seedDemo'

function StatCard({ icon: Icon, label, value, subtext }) {
  return (
    <Card className="flex items-start gap-4">
      <div className="p-2.5 bg-primary-50 rounded-lg">
        <Icon className="h-5 w-5 text-primary-600" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Seed a demo test on first visit so the app is immediately usable
        await seedDemoTestIfEmpty()
        const [s, t] = await Promise.all([getDashboardStats(), getAllTests()])
        setStats(s)
        setTests(t.reverse())
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  const hasTests = tests.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Practice under real examination conditions
          </p>
        </div>
        <Button onClick={() => navigate('/create')} size="lg">
          <Plus className="h-5 w-5" />
          Create Test
        </Button>
      </div>

      {/* Stats */}
      {hasTests && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={FileText}
            label="Tests Created"
            value={stats.totalTests}
          />
          <StatCard
            icon={Target}
            label="Tests Attempted"
            value={stats.totalAttempts}
          />
          <StatCard
            icon={TrendingUp}
            label="Average Score"
            value={`${stats.averageScore}%`}
            subtext={`Best: ${stats.bestScore}%`}
          />
          <StatCard
            icon={Award}
            label="Average Accuracy"
            value={`${stats.averageAccuracy}%`}
            subtext={
              stats.averageTimePerQuestion
                ? `Avg time: ${formatTime(stats.averageTimePerQuestion)}`
                : undefined
            }
          />
        </div>
      )}

      {/* Available Tests */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Available Tests</h2>
        </div>

        {!hasTests ? (
          <EmptyState
            icon={BookOpen}
            title="No tests yet"
            description="Upload a question paper PDF to create your first mock test and start practising under real exam conditions."
            actionLabel="Create Your First Test"
            onAction={() => navigate('/create')}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {tests.map((test) => (
              <div
                key={test.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-slate-900 truncate">
                      {test.title}
                    </h3>
                    <Badge variant="info">
                      {test.examName} {test.examStage}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span>{test.totalQuestions} questions</span>
                    <span>•</span>
                    <span>{test.maxMarks} marks</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(
                        test.sections?.reduce((s, sec) => s + sec.durationSeconds, 0) || 0
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/builder/${test.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/test/${test.id}/instructions`)}
                  >
                    Start Test
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Privacy note */}
      <p className="text-xs text-slate-400 text-center mt-8">
        All data is stored locally in your browser. Clearing browser data will delete your tests and results.
      </p>
    </div>
  )
}
