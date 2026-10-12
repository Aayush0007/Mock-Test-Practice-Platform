/**
 * Scoring engine — pure functions for calculating results.
 * Supports equal marks, variable marks, and fractional negative marking.
 */

/**
 * Score a single question
 * @param {Object} question - Question object with positiveMarks, negativeMarks, correctAnswer
 * @param {string|null} savedAnswer - Student's saved answer (e.g. 'A', 'B', null)
 * @returns {{ marks: number, status: 'correct'|'incorrect'|'unanswered' }}
 */
export function scoreQuestion(question, savedAnswer) {
  if (!savedAnswer) {
    return { marks: 0, status: 'unanswered' }
  }

  const correct = question.correctAnswer
  if (!correct) {
    // No verified answer key — treat as provisional
    return { marks: 0, status: 'unanswered', provisional: true }
  }

  if (String(savedAnswer).toUpperCase() === String(correct).toUpperCase()) {
    return {
      marks: question.positiveMarks ?? 1,
      status: 'correct',
    }
  }

  return {
    marks: -(question.negativeMarks ?? 0),
    status: 'incorrect',
  }
}

/**
 * Calculate full attempt result
 * @param {Object} test - Test definition with sections and questions
 * @param {Object} attempt - Attempt with responses, visited, markedForReview
 * @returns {Object} Complete result object
 */
export function calculateResult(test, attempt) {
  const responses = attempt.responses || {}
  const visited = new Set(attempt.visited || [])
  const markedForReview = new Set(attempt.markedForReview || [])
  const questionTimings = attempt.questionTimings || {}

  let totalScore = 0
  let maxMarks = 0
  let correct = 0
  let incorrect = 0
  let unanswered = 0
  let visitedCount = 0
  let markedCount = 0

  const sectionResults = []
  const questionResults = []

  for (const section of test.sections) {
    const sectionQuestions = test.questions.filter(
      (q) => q.sectionId === section.id
    )

    let secScore = 0
    let secMax = 0
    let secCorrect = 0
    let secIncorrect = 0
    let secUnanswered = 0
    let secMarked = 0
    let secTimeSpent = 0

    for (const question of sectionQuestions) {
      const savedAnswer = responses[question.id] ?? null
      const { marks, status, provisional } = scoreQuestion(question, savedAnswer)
      const timeSpent = questionTimings[question.id] || 0
      const isVisited = visited.has(question.id)
      const isMarked = markedForReview.has(question.id)

      secScore += marks
      secMax += question.positiveMarks ?? 1
      secTimeSpent += timeSpent

      if (status === 'correct') {
        secCorrect++
        correct++
      } else if (status === 'incorrect') {
        secIncorrect++
        incorrect++
      } else {
        secUnanswered++
        unanswered++
      }

      if (isVisited) visitedCount++
      if (isMarked) {
        secMarked++
        markedCount++
      }

      questionResults.push({
        questionId: question.id,
        questionNumber: question.number,
        sectionId: section.id,
        sectionName: section.name,
        savedAnswer,
        correctAnswer: question.correctAnswer || null,
        status,
        provisional: provisional || false,
        marks,
        positiveMarks: question.positiveMarks ?? 1,
        negativeMarks: question.negativeMarks ?? 0,
        timeSpent,
        visited: isVisited,
        markedForReview: isMarked,
        explanation: question.explanation || null,
      })
    }

    totalScore += secScore
    maxMarks += secMax

    const secAccuracy =
      secCorrect + secIncorrect > 0
        ? (secCorrect / (secCorrect + secIncorrect)) * 100
        : 0

    sectionResults.push({
      sectionId: section.id,
      name: section.name,
      maxMarks: secMax,
      score: Math.round(secScore * 100) / 100,
      totalQuestions: sectionQuestions.length,
      correct: secCorrect,
      incorrect: secIncorrect,
      unanswered: secUnanswered,
      accuracy: Math.round(secAccuracy * 10) / 10,
      timeAllocated: section.durationSeconds,
      timeUsed: attempt.sectionTimings?.[section.id]?.used || 0,
      averageSolvingTime:
        secCorrect + secIncorrect > 0
          ? Math.round(secTimeSpent / (secCorrect + secIncorrect))
          : 0,
      markedForReview: secMarked,
    })
  }

  const attempted = correct + incorrect
  const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0
  const percentage = maxMarks > 0 ? (totalScore / maxMarks) * 100 : 0
  const totalTimeSpent = Object.values(questionTimings).reduce(
    (s, t) => s + t,
    0
  )

  return {
    score: Math.round(totalScore * 100) / 100,
    maxMarks,
    percentage: Math.round(percentage * 10) / 10,
    totalQuestions: test.questions.length,
    correct,
    incorrect,
    unanswered,
    attempted,
    visited: visitedCount,
    notVisited: test.questions.length - visitedCount,
    markedForReview: markedCount,
    accuracy: Math.round(accuracy * 10) / 10,
    timeSpent: totalTimeSpent,
    averageTimePerQuestion:
      attempted > 0 ? Math.round(totalTimeSpent / attempted) : 0,
    sectionResults,
    questionResults,
    submissionReason: attempt.submissionReason || 'completed',
    warningCount: attempt.warningCount || 0,
    hasIncompleteAnswerKey: test.questions.some((q) => !q.correctAnswer),
  }
}

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
export function formatTime(seconds) {
  if (seconds == null || isNaN(seconds)) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
