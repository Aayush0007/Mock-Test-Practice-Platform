import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, AlertCircle, Loader2 } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import { EXAM_CONFIGS, getExamById } from '../../config/exams'
import { parsePDF } from '../../services/pdf/parser'
import { saveTest, saveImage } from '../../services/storage/db'
import { generateId } from '../../utils/id'
import { useAppStore } from '../../stores/appStore'
import { getErrorMessage } from '../../utils/errors'

const STEPS = {
  UPLOAD: 'upload',
  PROCESSING: 'processing',
  EXAM_SELECT: 'exam_select',
  REVIEW: 'review',
}

export default function CreateTest() {
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(STEPS.UPLOAD)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [parseResult, setParseResult] = useState(null)
  const [error, setError] = useState(null)

  // Exam selection
  const [selectedExamId, setSelectedExamId] = useState('')
  const [testTitle, setTestTitle] = useState('')

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return
    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a valid PDF file.')
      return
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size must be under 50 MB.')
      return
    }
    setFile(selectedFile)
    setError(null)
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      const dropped = e.dataTransfer.files[0]
      handleFile(dropped)
    },
    [handleFile]
  )

  const onDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const onDragLeave = () => setDragOver(false)

  const removeFile = () => {
    setFile(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startProcessing = async () => {
    if (!file) return
    setStep(STEPS.PROCESSING)
    setProgress(0)
    setProgressMsg('Reading PDF...')
    setError(null)

    try {
      const result = await parsePDF(file, {
        onProgress: (pct, msg) => {
          setProgress(pct)
          setProgressMsg(msg)
        },
      })

      setParseResult(result)

      // Auto-detect exam
      if (result.detectedExamId) {
        setSelectedExamId(result.detectedExamId)
        const exam = getExamById(result.detectedExamId)
        if (exam) {
          setTestTitle(`${exam.name} ${exam.stage} - ${new Date().getFullYear()}`)
        }
      } else {
        setTestTitle(result.title || `Mock Test - ${new Date().toLocaleDateString()}`)
      }

      setStep(STEPS.EXAM_SELECT)
    } catch (err) {
      console.error(err)
      setError(getErrorMessage(err))
      setStep(STEPS.UPLOAD)
      addToast({ type: 'error', title: 'Parsing failed', message: getErrorMessage(err) })
    }
  }

  const handleCreateTest = async () => {
    if (!selectedExamId || !testTitle.trim()) {
      setError('Please select an examination and provide a test title.')
      return
    }

    const examConfig = getExamById(selectedExamId)
    if (!examConfig) {
      setError('Invalid examination selected.')
      return
    }

    try {
      const testId = generateId()

      // Persist extracted images (DI charts, graphs, diagrams) to IndexedDB
      const imageIdMap = {} // old parser id → stable storage id
      const extractedImages = parseResult?.images || []
      for (const img of extractedImages) {
        const storageId = generateId()
        imageIdMap[img.id] = storageId
        await saveImage({
          id: storageId,
          testId,
          pageNumber: img.pageNumber,
          width: img.width,
          height: img.height,
          dataUrl: img.dataUrl,
          name: img.name || img.id,
          isPageRender: !!img.isPageRender,
        })
      }

      const remapImageIds = (ids = []) =>
        ids.map((id) => imageIdMap[id] || id).filter(Boolean)

      const questions = (parseResult?.questions || []).map((q, idx) => ({
        id: generateId(),
        number: q.number || idx + 1,
        sectionId: examConfig.sections[0]?.id || 'default',
        text: q.text || '',
        type: q.type || 'mcq',
        options: q.options || [],
        correctAnswer: q.correctAnswer || null,
        explanation: q.explanation || null,
        positiveMarks: examConfig.sections[0]?.positiveMarks ?? 1,
        negativeMarks: examConfig.sections[0]?.negativeMarks ?? 0.25,
        sharedContentId: q.sharedContentId || null,
        imageIds: remapImageIds(q.imageIds || []),
        sourcePage: q.sourcePage || null,
        validationStatus: q.text ? 'ok' : 'incomplete',
      }))

      // Shared passages / Directions (linked to question number ranges)
      const passages = (parseResult?.passages || []).map((p) => ({
        id: p.id,
        text: p.text,
        from: p.from,
        to: p.to,
        pageNumber: p.pageNumber,
        imageIds: remapImageIds(p.imageIds || []),
      }))

      // Assign sections by QUESTION NUMBER ranges (not sequential fill).
      // SBI/IBPS Prelims: Q1–30 English, Q31–65 Quant, Q66–100 Reasoning.
      // Using number ranges prevents quant questions from landing in English
      // when some earlier questions failed to extract.
      const sortedSecs = [...examConfig.sections].sort((a, b) => a.order - b.order)
      let rangeStart = 1
      const sectionRanges = sortedSecs.map((sec) => {
        const start = rangeStart
        const end = rangeStart + sec.expectedQuestions - 1
        rangeStart = end + 1
        return { ...sec, rangeStart: start, rangeEnd: end }
      })

      for (const q of questions) {
        const n = q.number
        const match =
          sectionRanges.find((s) => n >= s.rangeStart && n <= s.rangeEnd) ||
          sectionRanges[sectionRanges.length - 1]
        q.sectionId = match.id
        q.positiveMarks = match.positiveMarks
        q.negativeMarks = match.negativeMarks
      }

      const sections = sectionRanges.map((sec) => {
        const actual = questions.filter((q) => q.sectionId === sec.id).length
        return {
          id: sec.id,
          name: sec.name,
          order: sec.order,
          durationSeconds: sec.durationSeconds,
          expectedQuestions: sec.expectedQuestions,
          actualQuestions: actual,
          positiveMarks: sec.positiveMarks,
          negativeMarks: sec.negativeMarks,
          maxMarks: actual * sec.positiveMarks,
        }
      })

      const test = {
        id: testId,
        title: testTitle.trim(),
        examId: examConfig.id,
        examName: examConfig.name,
        examStage: examConfig.stage,
        provider: examConfig.provider,
        createdAt: new Date().toISOString(),
        sourceFileName: file.name,
        sourceFileSize: file.size,
        sections,
        questions,
        passages,
        totalQuestions: questions.length,
        maxMarks: sections.reduce((s, sec) => s + sec.maxMarks, 0),
        answerKeyStatus: questions.some((q) => q.correctAnswer)
          ? questions.every((q) => q.correctAnswer)
            ? 'complete'
            : 'partial'
          : 'missing',
        parsingWarnings: parseResult?.warnings || [],
        imageCount: extractedImages.length,
        status: 'draft',
      }

      await saveTest(test)
      addToast({
        type: 'success',
        title: 'Test created',
        message: `${questions.length} questions, ${extractedImages.length} image(s). Review before starting.`,
      })
      navigate(`/builder/${test.id}`)
    } catch (err) {
      console.error(err)
      setError(getErrorMessage(err))
      addToast({ type: 'error', title: 'Failed to create test', message: getErrorMessage(err) })
    }
  }

  const examOptions = EXAM_CONFIGS.map((e) => ({
    value: e.id,
    label: `${e.provider} — ${e.name} ${e.stage}`,
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create Test</h1>
        <p className="text-slate-500 mt-1">
          Upload a question paper PDF to create an interactive mock test
        </p>
      </div>

      {/* Step: Upload */}
      {step === STEPS.UPLOAD && (
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
            <CardDescription>
              Select a question paper PDF. Files are processed locally in your browser — nothing is uploaded to a server.
            </CardDescription>
          </CardHeader>

          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
              dragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            {!file ? (
              <>
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-700 font-medium mb-1">
                  Drag & drop your PDF here
                </p>
                <p className="text-sm text-slate-500 mb-4">or click to browse</p>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <FileText className="h-10 w-10 text-primary-600" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button onClick={startProcessing} disabled={!file}>
              Process PDF
            </Button>
          </div>
        </Card>
      )}

      {/* Step: Processing */}
      {step === STEPS.PROCESSING && (
        <Card className="text-center py-12">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Processing PDF
          </h3>
          <p className="text-sm text-slate-500 mb-6">{progressMsg}</p>
          <div className="max-w-xs mx-auto">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">{progress}%</p>
          </div>
        </Card>
      )}

      {/* Step: Exam Selection */}
      {step === STEPS.EXAM_SELECT && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Examination</CardTitle>
            <CardDescription>
              {parseResult?.questions?.length
                ? `Extracted ${parseResult.questions.length} questions. Select the examination pattern.`
                : 'No questions could be auto-extracted. You can still create a test and add questions manually.'}
            </CardDescription>
          </CardHeader>

          {parseResult?.warnings?.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <p className="font-medium mb-1">Extraction warnings:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {parseResult.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            <Select
              label="Examination"
              options={examOptions}
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value)
                const exam = getExamById(e.target.value)
                if (exam) {
                  setTestTitle(
                    `${exam.name} ${exam.stage} - ${new Date().getFullYear()}`
                  )
                }
              }}
              placeholder="Select examination..."
            />

            <Input
              label="Test Title"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="e.g. IBPS Clerk Prelims 2024 Mock 1"
            />
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(STEPS.UPLOAD)}>
              Back
            </Button>
            <Button onClick={handleCreateTest} disabled={!selectedExamId || !testTitle.trim()}>
              Create Test & Review
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
