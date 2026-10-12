import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Eraser,
  AlertTriangle,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import TestHeader from './components/TestHeader'
import QuestionPanel from './components/QuestionPanel'
import QuestionPalette from './components/QuestionPalette'
import SharedContentPanel from './components/SharedContentPanel'
import { useTestTimer } from './hooks/useTestTimer'
import { useActivityMonitor } from './hooks/useActivityMonitor'
import { useTestStore } from '../../stores/testStore'
import { saveAttempt } from '../../services/storage/db'
import { calculateResult } from '../../utils/scoring'
import { useAppStore } from '../../stores/appStore'

export default function TestRunner() {
  const { testId, attemptId } = useParams()
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)

  const status = useTestStore((s) => s.status)
  const test = useTestStore((s) => s.test)
  const saveAndNext = useTestStore((s) => s.saveAndNext)
  const clearResponse = useTestStore((s) => s.clearResponse)
  const toggleMarkForReview = useTestStore((s) => s.toggleMarkForReview)
  const goToQuestion = useTestStore((s) => s.goToQuestion)
  const currentQuestionIndex = useTestStore((s) => s.currentQuestionIndex)
  const getCurrentSectionQuestions = useTestStore((s) => s.getCurrentSectionQuestions)
  const getCurrentQuestion = useTestStore((s) => s.getCurrentQuestion)
  const markVisited = useTestStore((s) => s.markVisited)
  const addQuestionTime = useTestStore((s) => s.addQuestionTime)
  const setResult = useTestStore((s) => s.setResult)
  const warningCount = useTestStore((s) => s.warningCount)
  const submissionReason = useTestStore((s) => s.submissionReason)
  const responses = useTestStore((s) => s.responses)
  const visited = useTestStore((s) => s.visited)
  const markedForReview = useTestStore((s) => s.markedForReview)
  const questionTimings = useTestStore((s) => s.questionTimings)
  const sectionTimings = useTestStore((s) => s.sectionTimings)
  const activityLog = useTestStore((s) => s.activityLog)

  const { remaining, isWarning } = useTestTimer()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [lastWarningCount, setLastWarningCount] = useState(0)
  const questionStartRef = useRef(Date.now())
  const prevQuestionRef = useRef(null)

  // Activity monitoring
  useActivityMonitor({
    enabled: status === 'active',
    onWarning: (count) => {
      setLastWarningCount(count)
      setShowWarningModal(true)
    },
  })

  // Track time spent on questions
  useEffect(() => {
    const q = getCurrentQuestion()
    if (!q) return

    // Save time for previous question
    if (prevQuestionRef.current && prevQuestionRef.current !== q.id) {
      const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
      if (elapsed > 0) {
        addQuestionTime(prevQuestionRef.current, elapsed)
      }
    }

    prevQuestionRef.current = q.id
    questionStartRef.current = Date.now()
    markVisited(q.id)
  }, [currentQuestionIndex])

  // Handle submission
  const handleSubmit = useCallback(async () => {
    // Save final question time
    const q = getCurrentQuestion()
    if (q) {
      const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
      if (elapsed > 0) addQuestionTime(q.id, elapsed)
    }

    const state = useTestStore.getState()
    const result = calculateResult(state.test, {
      responses: state.responses,
      visited: state.visited,
      markedForReview: state.markedForReview,
      questionTimings: state.questionTimings,
      sectionTimings: state.sectionTimings,
      warningCount: state.warningCount,
      submissionReason: state.submissionReason || 'completed',
    })

    setResult(result)

    try {
      await saveAttempt({
        id: attemptId,
        testId,
        startedAt: state.sectionTimings[state.test.sections[0]?.id]?.startedAt
          ? new Date(state.sectionTimings[state.test.sections[0].id].startedAt).toISOString()
          : new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'completed',
        responses: state.responses,
        visited: state.visited,
        markedForReview: state.markedForReview,
        questionTimings: state.questionTimings,
        sectionTimings: state.sectionTimings,
        warningCount: state.warningCount,
        activityLog: state.activityLog,
        submissionReason: state.submissionReason || 'completed',
        result,
      })
    } catch (err) {
      console.error('Failed to save attempt:', err)
    }

    navigate(`/results/${attemptId}`)
  }, [attemptId, testId, navigate])

  // Auto-submit when status becomes 'submitted'
  useEffect(() => {
    if (status === 'submitted') {
      handleSubmit()
    }
  }, [status])

  // Mark first question as visited on mount
  useEffect(() => {
    const q = getCurrentQuestion()
    if (q) markVisited(q.id)
  }, [])

  // Prevent accidental navigation
  useEffect(() => {
    const handler = (e) => {
      if (status === 'active') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [status])

  if (!test || status === 'idle') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">No active test session. Please start from instructions.</p>
      </div>
    )
  }

  const sectionQuestions = getCurrentSectionQuestions()
  const isFirst = currentQuestionIndex === 0
  const isLast = currentQuestionIndex === sectionQuestions.length - 1

  const candidateName = 'Practice Candidate'

  return (
    <div className="h-screen flex flex-col exam-mode bg-slate-100 relative">
      {/* Watermark like real CBT */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -25deg,
              transparent,
              transparent 80px,
              currentColor 80px,
              currentColor 81px
            )`,
          }}
        />
        <div className="absolute inset-0 flex flex-wrap content-around justify-around opacity-[0.06] select-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="text-2xl font-bold text-slate-900 rotate-[-25deg] m-8"
            >
              {candidateName}
            </span>
          ))}
        </div>
      </div>

      <TestHeader
        remaining={remaining}
        isWarning={isWarning}
        candidateName={candidateName}
      />

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left panel — passages, DI charts, diagrams */}
        <div className="hidden lg:flex w-2/5 border-r border-slate-200 bg-white overflow-hidden">
          <SharedContentPanel />
        </div>

        {/* Right panel — question + controls */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-1 p-4 overflow-y-auto">
            <QuestionPanel />
          </div>

          {/* Action buttons */}
          <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-2 flex-shrink-0 bg-slate-50">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => clearResponse()}
              >
                <Eraser className="h-3.5 w-3.5" />
                Clear
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Save current selection if any, then mark
                  saveAndNext({ markForReview: true })
                }}
              >
                <Flag className="h-3.5 w-3.5" />
                Mark for Review & Next
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isFirst}
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button size="sm" onClick={() => saveAndNext()}>
                Save & Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Palette sidebar */}
        <div className="w-52 border-l border-slate-200 bg-white p-3 overflow-y-auto flex-shrink-0 hidden sm:block">
          <QuestionPalette />
        </div>
      </div>

      {/* Warning modal */}
      <Modal
        open={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="Activity Warning"
        size="sm"
        footer={
          <Button onClick={() => setShowWarningModal(false)}>
            I Understand
          </Button>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-8 w-8 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm text-slate-700 mb-2">
              You left the test window. This has been recorded as warning{' '}
              <strong>{lastWarningCount}</strong> of 5.
            </p>
            {lastWarningCount >= 5 && (
              <p className="text-sm text-red-600 font-medium">
                The next violation will automatically submit your test!
              </p>
            )}
            {lastWarningCount >= 6 && (
              <p className="text-sm text-red-600 font-medium">
                Your test is being submitted due to repeated activity violations.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
