import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Play,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Plus,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import { getTest, saveTest } from '../../services/storage/db'
import { useAppStore } from '../../stores/appStore'
import { formatTime } from '../../utils/scoring'
import { generateId } from '../../utils/id'

export default function TestBuilder() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)

  const [test, setTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedQuestionId, setSelectedQuestionId] = useState(null)
  const [activeTab, setActiveTab] = useState('questions') // questions | sections | config

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
        if (t.questions?.length) {
          setSelectedQuestionId(t.questions[0].id)
        }
      } catch (err) {
        console.error(err)
        addToast({ type: 'error', title: 'Failed to load test' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [testId])

  const selectedQuestion = test?.questions?.find((q) => q.id === selectedQuestionId)

  const updateQuestion = (field, value) => {
    setTest((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === selectedQuestionId ? { ...q, [field]: value } : q
      ),
    }))
  }

  const updateOption = (optIdx, field, value) => {
    setTest((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id !== selectedQuestionId) return q
        const options = [...(q.options || [])]
        options[optIdx] = { ...options[optIdx], [field]: value }
        return { ...q, options }
      }),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Recalculate stats
      const updated = {
        ...test,
        totalQuestions: test.questions.length,
        maxMarks: test.sections.reduce((sum, sec) => {
          const count = test.questions.filter((q) => q.sectionId === sec.id).length
          return sum + count * (sec.positiveMarks || 1)
        }, 0),
        sections: test.sections.map((sec) => ({
          ...sec,
          actualQuestions: test.questions.filter((q) => q.sectionId === sec.id).length,
          maxMarks:
            test.questions.filter((q) => q.sectionId === sec.id).length *
            (sec.positiveMarks || 1),
        })),
        answerKeyStatus: test.questions.some((q) => q.correctAnswer)
          ? test.questions.every((q) => q.correctAnswer)
            ? 'complete'
            : 'partial'
          : 'missing',
        status: 'ready',
        updatedAt: new Date().toISOString(),
      }
      await saveTest(updated)
      setTest(updated)
      addToast({ type: 'success', title: 'Test saved' })
    } catch (err) {
      addToast({ type: 'error', title: 'Save failed', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  const addQuestion = () => {
    const sectionId = test.sections[0]?.id || 'default'
    const maxNum = Math.max(0, ...test.questions.map((q) => q.number))
    const newQ = {
      id: generateId(),
      number: maxNum + 1,
      sectionId,
      text: '',
      type: 'mcq',
      options: [
        { label: 'A', text: '' },
        { label: 'B', text: '' },
        { label: 'C', text: '' },
        { label: 'D', text: '' },
      ],
      correctAnswer: null,
      explanation: null,
      positiveMarks: test.sections[0]?.positiveMarks ?? 1,
      negativeMarks: test.sections[0]?.negativeMarks ?? 0.25,
      validationStatus: 'incomplete',
    }
    setTest((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }))
    setSelectedQuestionId(newQ.id)
  }

  const deleteQuestion = (qId) => {
    if (!confirm('Delete this question?')) return
    setTest((prev) => {
      const remaining = prev.questions.filter((q) => q.id !== qId)
      if (selectedQuestionId === qId) {
        setSelectedQuestionId(remaining[0]?.id || null)
      }
      return { ...prev, questions: remaining }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!test) return null

  const incompleteCount = test.questions.filter(
    (q) => !q.text || !q.options?.length
  ).length
  const missingAnswers = test.questions.filter((q) => !q.correctAnswer).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{test.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="info">
                {test.examName} {test.examStage}
              </Badge>
              <span className="text-sm text-slate-500">
                {test.questions.length} questions · {test.maxMarks} marks
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button
            onClick={() => {
              handleSave().then(() =>
                navigate(`/test/${test.id}/instructions`)
              )
            }}
          >
            <Play className="h-4 w-4" />
            Start Test
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {(incompleteCount > 0 || missingAnswers > 0) && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            {incompleteCount > 0 && (
              <p>{incompleteCount} question(s) have incomplete content.</p>
            )}
            {missingAnswers > 0 && (
              <p>
                {missingAnswers} question(s) have no answer key — scoring will be
                provisional.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {['questions', 'sections', 'config'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question list */}
          <div className="lg:col-span-1">
            <Card padding={false}>
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="font-medium text-sm">Questions</span>
                <Button size="sm" variant="ghost" onClick={addQuestion}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
                {test.questions
                  .sort((a, b) => a.number - b.number)
                  .map((q) => {
                    const section = test.sections.find((s) => s.id === q.sectionId)
                    return (
                      <button
                        key={q.id}
                        onClick={() => setSelectedQuestionId(q.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                          selectedQuestionId === q.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            Q{q.number}
                          </span>
                          <div className="flex items-center gap-1">
                            {q.correctAnswer ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {section?.name || 'No section'} ·{' '}
                          {q.text?.slice(0, 40) || 'Empty'}...
                        </p>
                      </button>
                    )
                  })}
              </div>
            </Card>
          </div>

          {/* Question editor */}
          <div className="lg:col-span-2">
            {selectedQuestion ? (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">
                    Question {selectedQuestion.number}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQuestion(selectedQuestion.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Question Number"
                      type="number"
                      value={selectedQuestion.number}
                      onChange={(e) =>
                        updateQuestion('number', parseInt(e.target.value) || 1)
                      }
                    />
                    <Select
                      label="Section"
                      value={selectedQuestion.sectionId}
                      onChange={(e) => updateQuestion('sectionId', e.target.value)}
                      options={test.sections.map((s) => ({
                        value: s.id,
                        label: s.name,
                      }))}
                    />
                  </div>

                  <div>
                    <label className="label">Question Text</label>
                    <textarea
                      className="input min-h-[100px]"
                      value={selectedQuestion.text || ''}
                      onChange={(e) => updateQuestion('text', e.target.value)}
                      placeholder="Enter question text..."
                    />
                  </div>

                  <div>
                    <label className="label">Options</label>
                    <div className="space-y-2">
                      {(selectedQuestion.options || []).map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-sm font-medium flex-shrink-0">
                            {opt.label}
                          </span>
                          <input
                            className="input flex-1"
                            value={opt.text}
                            onChange={(e) =>
                              updateOption(idx, 'text', e.target.value)
                            }
                            placeholder={`Option ${opt.label}`}
                          />
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={
                              selectedQuestion.correctAnswer === opt.label
                            }
                            onChange={() =>
                              updateQuestion('correctAnswer', opt.label)
                            }
                            className="h-4 w-4 text-primary-600"
                            title="Mark as correct"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Select the radio button to mark the correct answer
                    </p>
                  </div>

                  <div>
                    <label className="label">Explanation (optional)</label>
                    <textarea
                      className="input min-h-[60px]"
                      value={selectedQuestion.explanation || ''}
                      onChange={(e) =>
                        updateQuestion('explanation', e.target.value)
                      }
                      placeholder="Explanation for the correct answer..."
                    />
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="text-center py-12 text-slate-500">
                Select a question to edit, or add a new one.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Sections Tab */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          {test.sections.map((sec) => {
            const qCount = test.questions.filter(
              (q) => q.sectionId === sec.id
            ).length
            return (
              <Card key={sec.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{sec.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {qCount} / {sec.expectedQuestions} questions ·{' '}
                      {formatTime(sec.durationSeconds)} · +{sec.positiveMarks} / −
                      {sec.negativeMarks}
                    </p>
                  </div>
                  {qCount !== sec.expectedQuestions && (
                    <Badge variant="warning">
                      Expected {sec.expectedQuestions}
                    </Badge>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && (
        <Card>
          <div className="space-y-4 max-w-md">
            <Input
              label="Test Title"
              value={test.title}
              onChange={(e) =>
                setTest((prev) => ({ ...prev, title: e.target.value }))
              }
            />
            <div className="text-sm text-slate-600 space-y-1">
              <p>
                <span className="font-medium">Examination:</span> {test.examName}{' '}
                {test.examStage}
              </p>
              <p>
                <span className="font-medium">Total Questions:</span>{' '}
                {test.questions.length}
              </p>
              <p>
                <span className="font-medium">Maximum Marks:</span> {test.maxMarks}
              </p>
              <p>
                <span className="font-medium">Answer Key:</span>{' '}
                <Badge
                  variant={
                    test.answerKeyStatus === 'complete'
                      ? 'success'
                      : test.answerKeyStatus === 'partial'
                        ? 'warning'
                        : 'danger'
                  }
                >
                  {test.answerKeyStatus}
                </Badge>
              </p>
              <p>
                <span className="font-medium">Source:</span>{' '}
                {test.sourceFileName || 'Manual'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
